import random
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Ticket


async def allocate_tickets(
    db: AsyncIOMotorDatabase,
    competition_id: str,
    quantity: int,
    order_id: str,
    user_id: str,
    instant_wins: List[Dict[str, Any]],
    max_tickets: int
) -> List[int]:
    """
    Allocate random ticket numbers for a competition.
    Checks for instant wins and credits user wallets.
    Returns list of allocated ticket numbers.
    """
    if max_tickets <= 0:
        return []
    
    allocated = []
    attempts = 0
    max_attempts = quantity * 50
    
    while len(allocated) < quantity and attempts < max_attempts:
        attempts += 1
        ticket_number = random.randint(1, max_tickets)
        
        # Check if ticket already allocated
        existing = await db.tickets.find_one({
            "competition_id": competition_id,
            "ticket_number": ticket_number
        })
        
        if existing:
            continue
        
        # Check for instant win
        win_info = check_instant_win(ticket_number, instant_wins)
        
        # Create ticket record
        ticket = Ticket(
            order_id=order_id,
            user_id=user_id,
            competition_id=competition_id,
            ticket_number=ticket_number,
            is_instant_win=win_info["is_win"],
            win_label=win_info["label"],
            win_amount=win_info["amount"],
            wallet_type=win_info["wallet_type"]
        )
        
        # Insert ticket
        ticket_dict = ticket.model_dump()
        ticket_dict["created_at"] = ticket_dict["created_at"].isoformat()
        await db.tickets.insert_one(ticket_dict)
        
        allocated.append(ticket_number)
        
        # Credit wallet if instant win
        if win_info["is_win"] and win_info["amount"] > 0:
            meta_key = "cash_balance" if win_info["wallet_type"] == "cash" else "site_credit_balance"
            user = await db.users.find_one({"id": user_id})
            if user:
                current_balance = user.get(meta_key, 0.0)
                new_balance = current_balance + win_info["amount"]
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {meta_key: new_balance}}
                )
    
    if len(allocated) != quantity:
        # Rollback: delete allocated tickets for this order
        await db.tickets.delete_many({"order_id": order_id})
        return []
    
    allocated.sort()
    return allocated


def check_instant_win(ticket_number: int, instant_wins: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check if a ticket number is an instant winner.
    Returns win information.
    """
    result = {
        "is_win": False,
        "label": "",
        "amount": 0.0,
        "wallet_type": "site_credit"
    }
    
    if not instant_wins:
        return result
    
    for win in instant_wins:
        name = win.get("name", "")
        numbers_str = win.get("numbers", "")
        
        # Parse winning numbers (comma-separated)
        if not numbers_str:
            continue
        
        try:
            winning_numbers = [int(n.strip()) for n in numbers_str.split(",") if n.strip()]
        except ValueError:
            continue
        
        if ticket_number in winning_numbers:
            result["is_win"] = True
            result["label"] = name
            result["amount"] = float(win.get("amount", 0))
            result["wallet_type"] = win.get("wallet_type", "site_credit")
            break
    
    return result
