from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


class InstantWin(BaseModel):
    name: str
    qty: int
    numbers: str = ""  # Comma-separated winning ticket numbers
    amount: float = 0.0
    wallet_type: str = "site_credit"  # "site_credit" or "cash"


class Competition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str = ""
    description: str = ""
    price: float
    sale_price: Optional[float] = None
    video: str = ""
    image: str = ""
    hot: bool = False
    instant: bool = False
    max_tickets: int
    max_tickets_per_user: Optional[int] = None
    tickets_sold: int = 0
    sold_override: int = 0  # Manual override for sold %
    end_datetime: str = ""  # ISO format
    category: str = "all"  # jackpot, spin, instawin, rolling, vip, all
    tags: List[str] = []  # ["jackpot", "spin", "instawins", "rolling", "vip"]
    instant_wins: List[InstantWin] = []
    instant_win_image: str = ""
    instant_win_type: str = "site_credit"  # cash or site_credit
    instant_win_ticket_numbers: List[int] = []
    instant_wins_found: int = 0
    prize_value: str = "0"
    benefits: List[str] = []
    product_id: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CompetitionCreate(BaseModel):
    title: str
    subtitle: str = ""
    description: str = ""
    price: float
    video: str = ""
    image: str = ""
    hot: bool = False
    instant: bool = False
    max_tickets: int
    tickets_sold: int = 0
    sold_override: int = 0
    end_datetime: str = ""
    tags: List[str] = []
    instant_wins: List[InstantWin] = []
    prize_value: str = "0"
    benefits: List[str] = []


class ThemeSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "theme_settings"
    # Background colors
    bg_gradient_start: str = "#2d1b3e"
    bg_gradient_mid: str = "#1a0f26"
    bg_gradient_end: str = "#0f0618"
    # Card colors
    card_bg: str = "rgba(22,13,33,0.85)"
    card_border: str = "rgba(138,43,226,0.3)"
    card_border_hover: str = "rgba(255,215,0,0.5)"
    card_glow: str = "rgba(138,43,226,0.4)"
    # Navigation colors
    nav_bg: str = "rgba(20,10,40,0.98)"
    nav_border: str = "rgba(255,215,0,0.2)"
    tab_text: str = "rgba(255,255,255,0.6)"
    tab_text_active: str = "#ffd700"
    tab_underline: str = "#ffd700"
    # Title colors
    title_text: str = "#ffd700"
    title_outline: str = "#8a2be2"
    # Badge colors
    badge_hot_start: str = "#ff0080"
    badge_hot_end: str = "#ff6b00"
    badge_hot_glow: str = "rgba(255,0,128,0.6)"
    badge_instant_start: str = "#00ffff"
    badge_instant_end: str = "#0099ff"
    badge_instant_border: str = "#00ffff"
    badge_instant_glow: str = "rgba(0,255,255,0.6)"
    # Price colors
    price_bg: str = "rgba(255,215,0,0.05)"
    price_border: str = "rgba(255,215,0,0.3)"
    price_label: str = "rgba(255,215,0,0.7)"
    price_value: str = "#ffd700"
    # Button colors
    qty_btn_bg: str = "rgba(0,255,255,0.05)"
    qty_btn_border: str = "rgba(0,255,255,0.3)"
    qty_btn_hover_bg: str = "rgba(0,255,255,0.15)"
    qty_btn_hover_border: str = "#00ffff"
    qty_display_bg: str = "rgba(0,255,255,0.08)"
    qty_display_border: str = "rgba(0,255,255,0.3)"
    qty_display_text: str = "#00ffff"
    # Total colors
    total_bg: str = "rgba(0,0,0,0.3)"
    total_text: str = "rgba(255,255,255,0.6)"
    total_value: str = "#ffd700"
    # Countdown colors
    countdown_ring_bg: str = "rgba(0,255,255,0.15)"
    countdown_ring_fg: str = "#00ffff"
    countdown_text: str = "#00ffff"
    countdown_label: str = "rgba(255,255,255,0.4)"
    # Progress bar colors
    progress_bg: str = "rgba(0,255,255,0.1)"
    progress_fill_start: str = "#00ffff"
    progress_fill_end: str = "#ffd700"
    # Enter button colors
    enter_btn_bg_start: str = "#ffd700"
    enter_btn_bg_end: str = "#ffaa00"
    enter_btn_text: str = "#000"
    enter_btn_glow: str = "rgba(255,215,0,0.6)"
    enter_btn_cart_bg_start: str = "#00ffff"
    enter_btn_cart_bg_end: str = "#0099ff"
    enter_btn_cart_text: str = "#000"
    enter_btn_cart_glow: str = "rgba(0,255,255,0.7)"
    enter_badge_bg: str = "#ff0080"
    enter_badge_text: str = "#fff"
    # Animations
    anim_card_hover: bool = True
    anim_hot_pulse: bool = True
    anim_instant_electric: bool = True
    anim_enter_glow: bool = True
    anim_countdown_ring: bool = True
    # Postal entry settings
    postal_enabled: bool = True
    postal_toggle_label: str = "Free Entry Route"
    postal_intro_text: str = "Enter for free by sending your details on a postcard or in a sealed envelope."
    postal_send_to_label: str = "SEND TO:"
    postal_address: str = "Prize Nation Competitions\n123 Competition House\nLondon, W1A 1AA"
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    competition_id: str
    title: str
    price: float
    quantity: int
    image: str = ""


class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    discount: float = 0.0
    coupon_code: str = ""
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    user_id: str
    competition_id: str
    ticket_number: int
    is_instant_win: bool = False
    win_label: str = ""
    win_amount: float = 0.0
    wallet_type: str = "site_credit"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: int = 0
    user_id: str
    user_email: str = ""
    user_name: str = ""
    total: float
    discount: float = 0.0
    payment_method: str = "site_credit"  # "site_credit", "cash", "card"
    payment_status: str = "pending"  # "pending", "completed", "failed"
    ticket_count: int
    tickets: List[Dict[str, Any]] = []  # [{competition_id, title, numbers: []}]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str = ""
    password_hash: str
    site_credit_balance: float = 0.0
    cash_balance: float = 0.0
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_amount: float
    is_active: bool = True
    max_uses: int = 0  # 0 = unlimited
    times_used: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PaymentJobRequest(BaseModel):
    amount: float
    order_ref: str
    customer_email: str
    customer_name: str


class CheckoutRequest(BaseModel):
    payment_method: str  # "site_credit", "cash", "card"
