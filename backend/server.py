from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import shutil

from models import (
    Competition, CompetitionCreate, ThemeSettings, CartItem, Cart,
    Order, User, UserCreate, UserLogin, Coupon, CheckoutRequest, Ticket
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user
)
from ticket_allocator import allocate_tickets
from payment_routes import router as payment_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        site_credit_balance=100.0,  # Welcome bonus
        cash_balance=0.0,
        is_admin=False
    )
    
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "is_admin": user.is_admin}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "site_credit_balance": user.site_credit_balance,
            "cash_balance": user.cash_balance,
            "is_admin": user.is_admin
        }
    }


@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "is_admin": user.get("is_admin", False)}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "site_credit_balance": user.get("site_credit_balance", 0.0),
            "cash_balance": user.get("cash_balance", 0.0),
            "is_admin": user.get("is_admin", False)
        }
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "site_credit_balance": user.get("site_credit_balance", 0.0),
        "cash_balance": user.get("cash_balance", 0.0),
        "is_admin": user.get("is_admin", False)
    }


# ============================================================================
# COMPETITION ENDPOINTS
# ============================================================================

@api_router.get("/competitions")
async def get_competitions(tag: Optional[str] = None):
    """Get all competitions, optionally filtered by tag"""
    query = {}
    if tag and tag != "all":
        query["tags"] = tag
    
    competitions = await db.competitions.find(query, {"_id": 0}).to_list(1000)
    
    # Calculate sold percentage
    for comp in competitions:
        max_tickets = comp.get("max_tickets", 0)
        tickets_sold = comp.get("tickets_sold", 0)
        sold_override = comp.get("sold_override", 0)
        
        if sold_override > 0:
            comp["sold"] = sold_override
        elif max_tickets > 0 and tickets_sold > 0:
            comp["sold"] = min(100, round((tickets_sold / max_tickets) * 100))
        else:
            comp["sold"] = 0
    
    return competitions


@api_router.get("/competitions/{competition_id}")
async def get_competition(competition_id: str):
    """Get single competition by ID"""
    comp = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Calculate sold percentage
    max_tickets = comp.get("max_tickets", 0)
    tickets_sold = comp.get("tickets_sold", 0)
    sold_override = comp.get("sold_override", 0)
    
    if sold_override > 0:
        comp["sold"] = sold_override
    elif max_tickets > 0 and tickets_sold > 0:
        comp["sold"] = min(100, round((tickets_sold / max_tickets) * 100))
    else:
        comp["sold"] = 0
    
    return comp


@api_router.post("/competitions")
async def create_competition(
    comp_data: CompetitionCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Create new competition (admin only)"""
    competition = Competition(**comp_data.model_dump())
    
    comp_dict = competition.model_dump()
    comp_dict["created_at"] = comp_dict["created_at"].isoformat()
    comp_dict["updated_at"] = comp_dict["updated_at"].isoformat()
    
    await db.competitions.insert_one(comp_dict)
    
    return competition


@api_router.put("/competitions/{competition_id}")
async def update_competition(
    competition_id: str,
    comp_data: CompetitionCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update competition (admin only)"""
    existing = await db.competitions.find_one({"id": competition_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    update_dict = comp_data.model_dump()
    update_dict["updated_at"] = datetime.utcnow().isoformat()
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$set": update_dict}
    )
    
    return {"message": "Competition updated successfully"}


@api_router.delete("/competitions/{competition_id}")
async def delete_competition(
    competition_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete competition (admin only)"""
    result = await db.competitions.delete_one({"id": competition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    return {"message": "Competition deleted successfully"}


@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin_user)
):
    """Upload image/video file (admin only)"""
    # Generate unique filename
    ext = Path(file.filename).suffix
    filename = f"{datetime.utcnow().timestamp()}{ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return public URL
    file_url = f"/uploads/{filename}"
    
    return {"url": file_url}


# ============================================================================
# THEME ENDPOINTS
# ============================================================================

@api_router.get("/theme")
async def get_theme():
    """Get theme settings"""
    theme = await db.theme_settings.find_one({"id": "theme_settings"}, {"_id": 0})
    if not theme:
        # Return default theme
        theme = ThemeSettings().model_dump()
    return theme


@api_router.put("/theme")
async def update_theme(
    theme_data: ThemeSettings,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update theme settings (admin only)"""
    theme_dict = theme_data.model_dump()
    theme_dict["updated_at"] = datetime.utcnow().isoformat()
    
    await db.theme_settings.update_one(
        {"id": "theme_settings"},
        {"$set": theme_dict},
        upsert=True
    )
    
    return {"message": "Theme updated successfully"}


# ============================================================================
# CART ENDPOINTS
# ============================================================================

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart"""
    cart = await db.carts.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "discount": 0.0, "coupon_code": ""}
    return cart


@api_router.post("/cart/add")
async def add_to_cart(
    item: CartItem,
    current_user: dict = Depends(get_current_user)
):
    """Add item to cart"""
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    
    if not cart:
        cart = Cart(user_id=current_user["user_id"], items=[item])
        cart_dict = cart.model_dump()
        cart_dict["updated_at"] = cart_dict["updated_at"].isoformat()
        await db.carts.insert_one(cart_dict)
    else:
        # Check if item already in cart
        items = cart.get("items", [])
        found = False
        for existing_item in items:
            if existing_item["competition_id"] == item.competition_id:
                existing_item["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"items": items, "updated_at": datetime.utcnow().isoformat()}}
        )
    
    return {"message": "Item added to cart"}


@api_router.post("/cart/update")
async def update_cart_item(
    competition_id: str,
    quantity: int,
    current_user: dict = Depends(get_current_user)
):
    """Update cart item quantity"""
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    for item in items:
        if item["competition_id"] == competition_id:
            if quantity <= 0:
                items.remove(item)
            else:
                item["quantity"] = quantity
            break
    
    await db.carts.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"items": items, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": "Cart updated"}


@api_router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear user's cart"""
    await db.carts.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"items": [], "discount": 0.0, "coupon_code": "", "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"message": "Cart cleared"}


@api_router.post("/cart/apply-coupon")
async def apply_coupon(
    code: str,
    current_user: dict = Depends(get_current_user)
):
    """Apply coupon code to cart"""
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check usage limits
    if coupon.get("max_uses", 0) > 0 and coupon.get("times_used", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    discount = coupon.get("discount_amount", 0.0)
    
    await db.carts.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"discount": discount, "coupon_code": code.upper(), "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": "Coupon applied", "discount": discount}


# ============================================================================
# CHECKOUT & ORDER ENDPOINTS
# ============================================================================

@api_router.post("/checkout/validate")
async def validate_cart(current_user: dict = Depends(get_current_user)):
    """Validate cart items (check ticket availability)"""
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    issues = []
    for item in cart["items"]:
        comp = await db.competitions.find_one({"id": item["competition_id"]})
        if not comp:
            issues.append(f"Competition '{item['title']}' not found")
            continue
        
        max_tickets = comp.get("max_tickets", 0)
        tickets_sold = comp.get("tickets_sold", 0)
        available = max_tickets - tickets_sold
        
        if item["quantity"] > available:
            issues.append(f"Only {available} tickets available for '{item['title']}'")
    
    if issues:
        return {"valid": False, "issues": issues}
    
    return {"valid": True, "message": "All items are available"}


@api_router.post("/checkout/complete")
async def complete_checkout(
    checkout_data: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Complete checkout and create order"""
    # Get cart
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Get user
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate total
    subtotal = sum(item["price"] * item["quantity"] for item in cart["items"])
    discount = cart.get("discount", 0.0)
    total = max(0, subtotal - discount)
    
    # Validate payment method and balance
    payment_method = checkout_data.payment_method
    
    if payment_method == "site_credit":
        if user.get("site_credit_balance", 0.0) < total:
            raise HTTPException(status_code=400, detail="Insufficient site credit balance")
    elif payment_method == "cash":
        if user.get("cash_balance", 0.0) < total:
            raise HTTPException(status_code=400, detail="Insufficient cash balance")
    elif payment_method == "card":
        # For card payments, we'll create a pending order and return payment URL
        pass
    else:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    # Generate order number
    last_order = await db.orders.find_one(sort=[("order_number", -1)])
    order_number = (last_order.get("order_number", 0) + 1) if last_order else 1000
    
    # Create order
    order = Order(
        order_number=order_number,
        user_id=current_user["user_id"],
        user_email=user["email"],
        user_name=user.get("name", ""),
        total=total,
        discount=discount,
        payment_method=payment_method,
        payment_status="pending" if payment_method == "card" else "completed",
        ticket_count=sum(item["quantity"] for item in cart["items"]),
        tickets=[]
    )
    
    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    
    # If not card payment, process immediately
    if payment_method != "card":
        # Deduct balance
        if payment_method == "site_credit":
            new_balance = user["site_credit_balance"] - total
            await db.users.update_one(
                {"id": current_user["user_id"]},
                {"$set": {"site_credit_balance": new_balance}}
            )
        elif payment_method == "cash":
            new_balance = user["cash_balance"] - total
            await db.users.update_one(
                {"id": current_user["user_id"]},
                {"$set": {"cash_balance": new_balance}}
            )
        
        # Allocate tickets
        tickets = []
        for item in cart["items"]:
            comp = await db.competitions.find_one({"id": item["competition_id"]})
            if not comp:
                continue
            
            # Allocate ticket numbers
            allocated = await allocate_tickets(
                db=db,
                competition_id=item["competition_id"],
                quantity=item["quantity"],
                order_id=order.id,
                user_id=current_user["user_id"],
                instant_wins=comp.get("instant_wins", []),
                max_tickets=comp.get("max_tickets", 0)
            )
            
            if not allocated:
                raise HTTPException(status_code=500, detail="Failed to allocate tickets")
            
            # Get instant win tickets for this order
            instant_win_tickets = await db.tickets.find({
                "order_id": order.id,
                "competition_id": item["competition_id"],
                "is_instant_win": True
            }, {"_id": 0}).to_list(None)
            
            # Group instant wins by prize
            instant_wins_grouped = {}
            for ticket in instant_win_tickets:
                prize_label = ticket.get("win_label", "")
                if prize_label not in instant_wins_grouped:
                    instant_wins_grouped[prize_label] = {
                        "prize": prize_label,
                        "ticket_numbers": []
                    }
                instant_wins_grouped[prize_label]["ticket_numbers"].append(ticket["ticket_number"])
            
            tickets.append({
                "competition_id": item["competition_id"],
                "title": item["title"],
                "numbers": [{"number": num} for num in allocated],
                "instant_wins": list(instant_wins_grouped.values())
            })
            
            # Update tickets_sold count
            new_tickets_sold = comp.get("tickets_sold", 0) + item["quantity"]
            await db.competitions.update_one(
                {"id": item["competition_id"]},
                {"$set": {"tickets_sold": new_tickets_sold}}
            )
        
        order_dict["tickets"] = tickets
        order_dict["payment_status"] = "completed"
        
        # Save order
        await db.orders.insert_one(order_dict)
        
        # Clear cart
        await db.carts.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"items": [], "discount": 0.0, "coupon_code": "", "updated_at": datetime.utcnow().isoformat()}}
        )
        
        # Increment coupon usage
        if cart.get("coupon_code"):
            await db.coupons.update_one(
                {"code": cart["coupon_code"]},
                {"$inc": {"times_used": 1}}
            )
        
        return {
            "success": True,
            "order_id": order.id,
            "order_number": order_number,
            "payment_method": payment_method,
            "tickets": tickets,
            "total": total,
            "redirect_url": None
        }
    else:
        # Card payment - save pending order and return payment URL
        await db.orders.insert_one(order_dict)
        
        # TODO: Integrate with Cashflows payment gateway
        # For now, return a mock redirect URL
        redirect_url = f"/payment/card?order_id={order.id}"
        
        return {
            "success": True,
            "order_id": order.id,
            "order_number": order_number,
            "payment_method": payment_method,
            "tickets": [],
            "total": total,
            "redirect_url": redirect_url
        }


@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    """Get user's orders"""
    orders = await db.orders.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get single order"""
    order = await db.orders.find_one({"id": order_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_admin_user)):
    """Get admin dashboard stats"""
    total_competitions = await db.competitions.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({"payment_status": "completed"}).to_list(10000)
    total_revenue = sum(order.get("total", 0) for order in orders)
    
    return {
        "total_competitions": total_competitions,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue
    }


# Include routers in the main app
app.include_router(api_router)
app.include_router(payment_router, prefix="/api")

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
