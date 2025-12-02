"""
Seed database with sample competitions and admin user
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import get_password_hash
from datetime import datetime, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding database...")
    
    # Create admin user
    admin = {
        "id": "admin-user-001",
        "email": "admin@decus.com",
        "name": "Admin User",
        "password_hash": get_password_hash("admin123"),
        "site_credit_balance": 10000.0,
        "cash_balance": 5000.0,
        "is_admin": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.delete_one({"email": "admin@decus.com"})
    await db.users.insert_one(admin)
    print("✅ Created admin user: admin@decus.com / admin123")
    
    # Create test user
    test_user = {
        "id": "test-user-001",
        "email": "test@decus.com",
        "name": "Test User",
        "password_hash": get_password_hash("test123"),
        "site_credit_balance": 500.0,
        "cash_balance": 250.0,
        "is_admin": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.delete_one({"email": "test@decus.com"})
    await db.users.insert_one(test_user)
    print("✅ Created test user: test@decus.com / test123")
    
    # Create sample competitions
    now = datetime.utcnow()
    end_date = (now + timedelta(days=7)).isoformat()
    
    competitions = [
        {
            "id": "comp-001",
            "title": "£2,400 RENT COVERED",
            "subtitle": "Win 6 months of rent payments",
            "description": "Enter for a chance to win £400 per month for 6 consecutive months. Direct payment to your landlord available!",
            "price": 2.99,
            "video": "",
            "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
            "hot": True,
            "instant": False,
            "max_tickets": 5000,
            "tickets_sold": 3200,
            "sold_override": 64,
            "end_datetime": end_date,
            "tags": ["jackpot", "all"],
            "instant_wins": [],
            "prize_value": "2,400",
            "benefits": [
                "£400 monthly rent contribution",
                "Direct payment to landlord available",
                "Coverage for 6 consecutive months",
                "No restrictions on property type"
            ],
            "product_id": "prod-001",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "comp-002",
            "title": "LUXURY HOLIDAY PACKAGE",
            "subtitle": "All-inclusive 5-star resort getaway",
            "description": "Win an amazing 7-day luxury holiday for 2 at a 5-star resort with all meals and activities included!",
            "price": 1.99,
            "video": "",
            "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
            "hot": False,
            "instant": True,
            "max_tickets": 10000,
            "tickets_sold": 4500,
            "sold_override": 45,
            "end_datetime": end_date,
            "tags": ["spin", "instawins", "all"],
            "instant_wins": [
                {
                    "name": "£50 Site Credit",
                    "qty": 10,
                    "numbers": "123,456,789,1234,5678",
                    "amount": 50.0,
                    "wallet_type": "site_credit"
                }
            ],
            "prize_value": "5,000",
            "benefits": [
                "7 nights at 5-star resort",
                "All meals and drinks included",
                "Spa treatments included",
                "Airport transfers provided"
            ],
            "product_id": "prod-002",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "comp-003",
            "title": "CASH JACKPOT £10,000",
            "subtitle": "Life-changing cash prize",
            "description": "Win £10,000 in cash - no restrictions, spend it however you want!",
            "price": 4.99,
            "video": "",
            "image": "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800",
            "hot": True,
            "instant": True,
            "max_tickets": 8000,
            "tickets_sold": 6400,
            "sold_override": 80,
            "end_datetime": end_date,
            "tags": ["jackpot", "rolling", "instawins", "all"],
            "instant_wins": [
                {
                    "name": "£100 Cash",
                    "qty": 5,
                    "numbers": "111,222,333,444,555",
                    "amount": 100.0,
                    "wallet_type": "cash"
                }
            ],
            "prize_value": "10,000",
            "benefits": [
                "£10,000 cash prize",
                "No restrictions on usage",
                "Instant bank transfer",
                "Tax-free winnings"
            ],
            "product_id": "prod-003",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "comp-004",
            "title": "DREAM CAR GIVEAWAY",
            "subtitle": "Win a brand new luxury vehicle",
            "description": "Take home the keys to a stunning brand new car worth £35,000!",
            "price": 3.49,
            "video": "",
            "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
            "hot": False,
            "instant": False,
            "max_tickets": 15000,
            "tickets_sold": 9000,
            "sold_override": 60,
            "end_datetime": end_date,
            "tags": ["vip", "all"],
            "instant_wins": [],
            "prize_value": "35,000",
            "benefits": [
                "Brand new luxury car",
                "Full insurance for 1 year",
                "Free servicing for 2 years",
                "Cash alternative available"
            ],
            "product_id": "prod-004",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "comp-005",
            "title": "TECH BUNDLE BONANZA",
            "subtitle": "Latest gadgets worth £3,000",
            "description": "Win the ultimate tech bundle including laptop, phone, tablet, and smartwatch!",
            "price": 0.99,
            "video": "",
            "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
            "hot": False,
            "instant": True,
            "max_tickets": 20000,
            "tickets_sold": 12000,
            "sold_override": 60,
            "end_datetime": end_date,
            "tags": ["spin", "instawins", "all"],
            "instant_wins": [
                {
                    "name": "£25 Site Credit",
                    "qty": 20,
                    "numbers": "100,200,300,400,500,600,700,800,900,1000",
                    "amount": 25.0,
                    "wallet_type": "site_credit"
                }
            ],
            "prize_value": "3,000",
            "benefits": [
                "Latest laptop included",
                "Flagship smartphone",
                "Premium tablet",
                "Luxury smartwatch"
            ],
            "product_id": "prod-005",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "comp-006",
            "title": "VIP CONCERT EXPERIENCE",
            "subtitle": "Meet & greet with backstage access",
            "description": "Win VIP tickets to see your favorite artist with exclusive backstage access!",
            "price": 1.49,
            "video": "",
            "image": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800",
            "hot": False,
            "instant": False,
            "max_tickets": 7500,
            "tickets_sold": 3000,
            "sold_override": 40,
            "end_datetime": end_date,
            "tags": ["vip", "rolling", "all"],
            "instant_wins": [],
            "prize_value": "1,500",
            "benefits": [
                "2 VIP tickets included",
                "Meet & greet with artist",
                "Backstage access pass",
                "Hotel and travel included"
            ],
            "product_id": "prod-006",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # Clear existing competitions
    await db.competitions.delete_many({})
    await db.competitions.insert_many(competitions)
    print(f"✅ Created {len(competitions)} sample competitions")
    
    # Create default theme settings
    theme = {
        "id": "theme_settings",
        "bg_gradient_start": "#2d1b3e",
        "bg_gradient_mid": "#1a0f26",
        "bg_gradient_end": "#0f0618",
        "card_bg": "rgba(22,13,33,0.85)",
        "card_border": "rgba(138,43,226,0.3)",
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await db.theme_settings.update_one(
        {"id": "theme_settings"},
        {"$set": theme},
        upsert=True
    )
    print("✅ Created default theme settings")
    
    # Create sample coupons
    coupons = [
        {
            "id": "coupon-001",
            "code": "WELCOME10",
            "discount_amount": 10.0,
            "is_active": True,
            "max_uses": 0,
            "times_used": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "coupon-002",
            "code": "SAVE5",
            "discount_amount": 5.0,
            "is_active": True,
            "max_uses": 100,
            "times_used": 25,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    await db.coupons.delete_many({})
    await db.coupons.insert_many(coupons)
    print(f"✅ Created {len(coupons)} sample coupons")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📝 Login credentials:")
    print("   Admin: admin@decus.com / admin123")
    print("   Test User: test@decus.com / test123")
    print("   Coupons: WELCOME10 (£10 off), SAVE5 (£5 off)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
