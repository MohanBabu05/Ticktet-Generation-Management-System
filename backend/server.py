from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, ASCENDING, DESCENDING
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import imaplib
import email
from email.header import decode_header
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
import threading
import time
import uuid

load_dotenv()

app = FastAPI(title="ERP Ticketing Management System")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/erp_ticketing")
client = MongoClient(MONGO_URL)
db = client.get_database()

# Collections
users_collection = db["users"]
tickets_collection = db["tickets"]
ticket_counter_collection = db["ticket_counter"]
audit_logs_collection = db["audit_logs"]

# Create indexes
tickets_collection.create_index([("ticket_number", ASCENDING)], unique=True)
tickets_collection.create_index([("status", ASCENDING)])
tickets_collection.create_index([("module", ASCENDING)])
users_collection.create_index([("username", ASCENDING)], unique=True)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# Module Mappings (AS-IS from requirements)
supportModuleMap = {
    "PO": "Seenivasan", "Invy": "Seenivasan", "RMI": "Seenivasan",
    "Paper RMI": "Muthuvel", "HT RMI": "Seenivasan", "WVG Yinvy": "Seenivasan",
    "Knitting Yinvy": "Seenivasan", "Import": "Seenivasan", "Paper Import": "Seenivasan",
    "PPC": "Vignesh", "Pre Spg": "Vignesh", "Spg": "Vignesh",
    "Post Spg": "Vignesh", "QC": "Vignesh", "Knitting Prodn": "Vignesh",
    "WVG Prep": "Vignesh", "WVG Prodn": "Vignesh", "Paper Prodn": "Vignesh",
    "HT Prodn": "Vignesh", "MMS": "Mariyaiya", "EMS": "Mariyaiya",
    "Power": "Mariyaiya", "DSales": "Seenivasan", "Paper Sales": "Seenivasan",
    "WSales": "Seenivasan", "SSales": "Seenivasan", "ESales": "Seenivasan",
    "WVG ESales": "Seenivasan", "Knitting Sales": "Seenivasan", "WVG Sales": "Seenivasan",
    "HT Sales": "Seenivasan", "Payroll": "Palanivel", "HR": "Palanivel",
    "Canteen": "Seenivasan", "GMS": "Seenivasan", "FA": "Palanivel",
    "FAD": "Palanivel", "Costing": "Palanivel", "MIS": "Palanivel",
    "WVG MIS": "Palanivel", "Txn Approval": "Seenivasan", "Web Reports": "Seenivasan",
    "System Admin": "Seenivasan", "User Rights": "Palanivel", "Automail": "Seenivasan"
}

developerModuleMap = {
    "PO": "Mariyaiya", "Invy": "Mariyaiya", "RMI": "Mariyaiya",
    "Paper RMI": "Mariyaiya", "HT RMI": "Mariyaiya", "WVG Yinvy": "Mariyaiya",
    "Knitting Yinvy": "Mariyaiya", "Import": "Sasi", "Paper Import": "Sasi",
    "PPC": "Annamalai", "Pre Spg": "Annamalai", "Spg": "Annamalai",
    "Post Spg": "Annamalai", "QC": "Annamalai", "Knitting Prodn": "Annamalai",
    "WVG Prep": "Annamalai", "WVG Prodn": "Annamalai", "Paper Prodn": "Annamalai",
    "HT Prodn": "Mariya", "MMS": "Mariyaiya", "EMS": "Mariyaiya",
    "Power": "Mariyaiya", "DSales": "Annamalai", "Paper Sales": "Annamalai",
    "WSales": "Annamalai", "SSales": "Annamalai", "ESales": "Annamalai",
    "WVG ESales": "Annamalai", "Knitting Sales": "Annamalai", "WVG Sales": "Annamalai",
    "HT Sales": "Mariya", "Payroll": "Sasi", "HR": "Sasi",
    "Canteen": "Mariyaiya", "GMS": "Mariyaiya", "FA": "Sasi",
    "FAD": "Sasi", "Costing": "Sasi", "MIS": "Mariya",
    "WVG MIS": "Sasi", "PO Approval": "Mohan Babu", "Txn Approval": "Mohan Babu",
    "Web Reports": "Mohan Babu", "System Admin": "Sasi", "User Rights": "Mariya",
    "Automail": "Mohan Babu", "All Modules Report": "Udhay", "FGI": "Annamalai",
    "PPS": "Mariya", "CSM": "Mohan Babu"
}

developerEmailMap = {
    "Mariyaiya": "mariyaiya.m@kalsofte.com",
    "Annamalai": "annamalai.s@kalsofte.com",
    "Sasi": "sasikumar.r@kalsofte.com",
    "Mariya": "maria@kalsofte.com",
    "Mohan Babu": "mohanbabuvn@kalsofte.com",
    "Udhay": "udhay@kalsofte.com"
}

# Pydantic Models
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # Admin, Support Engineer, Developer, Manager

class TicketCreate(BaseModel):
    customer: str
    cr_type: str
    issue_type: str
    type: Optional[str] = None
    module: str
    description: str
    amc_cost: Optional[str] = None
    pr_approval: Optional[str] = None
    priority: Optional[str] = "Medium"
    planned_date: Optional[str] = None
    commitment_date: Optional[str] = None
    remarks: Optional[str] = None

class TicketUpdate(BaseModel):
    customer: Optional[str] = None
    cr_type: Optional[str] = None
    issue_type: Optional[str] = None
    type: Optional[str] = None
    module: Optional[str] = None
    description: Optional[str] = None
    amc_cost: Optional[str] = None
    pr_approval: Optional[str] = None
    priority: Optional[str] = None
    planned_date: Optional[str] = None
    commitment_date: Optional[str] = None
    remarks: Optional[str] = None
    exe_sent: Optional[str] = None
    reason_for_issue: Optional[str] = None
    customer_call: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str
    completed_by: Optional[str] = None
    resolution_type: Optional[str] = None
    completion_remarks: Optional[str] = None

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = users_collection.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def generate_ticket_number() -> str:
    """Generate ticket number in YYYY-00001 format"""
    current_year = datetime.now().year
    counter_doc = ticket_counter_collection.find_one({"year": current_year})
    
    if counter_doc is None:
        # Create new counter for the year
        ticket_counter_collection.insert_one({"year": current_year, "counter": 1})
        return f"{current_year}-00001"
    else:
        # Increment counter
        new_counter = counter_doc["counter"] + 1
        ticket_counter_collection.update_one(
            {"year": current_year},
            {"$set": {"counter": new_counter}}
        )
        return f"{current_year}-{str(new_counter).zfill(5)}"

def auto_assign_ticket(module: str) -> dict:
    """Auto-assign Support Engineer and Developer based on module"""
    support_engineer = supportModuleMap.get(module, "Unassigned")
    developer = developerModuleMap.get(module, "Unassigned")
    developer_email = developerEmailMap.get(developer, "")
    
    return {
        "support_engineer": support_engineer,
        "developer": developer,
        "developer_email": developer_email
    }

def send_assignment_email(ticket_data: dict):
    """Send email to assigned developer"""
    try:
        email_address = os.getenv("EMAIL_ADDRESS")
        email_password = os.getenv("EMAIL_PASSWORD")
        smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("EMAIL_SMTP_PORT", 587))
        cc_email = os.getenv("DEVELOPMENT_CC_EMAIL", "development@kalsofte.com")
        
        if not email_password or email_password == "your-app-password-here":
            print("Email credentials not configured. Skipping email notification.")
            return
        
        developer_email = ticket_data.get("developer_email")
        if not developer_email:
            print(f"No email found for developer: {ticket_data.get('developer')}")
            return
        
        # Create email
        msg = MIMEMultipart()
        msg['From'] = email_address
        msg['To'] = developer_email
        msg['Cc'] = cc_email
        msg['Subject'] = f"New CR Assigned - Ticket {ticket_data['ticket_number']}"
        
        body = f"""Dear Team,

A new Change Request (CR) has been received and assigned.
Please find the details below:

Ticket No: {ticket_data['ticket_number']}
Customer: {ticket_data['customer']}
Module: {ticket_data['module']}
Subject: {ticket_data.get('email_subject', 'N/A')}

Original Message:
{ticket_data['description']}

Please review the request and take appropriate action at the earliest.

Regards,
CR Automation System"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_address, email_password)
            recipients = [developer_email, cc_email]
            server.send_message(msg, to_addrs=recipients)
        
        print(f"Assignment email sent to {developer_email}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")

def parse_email_subject(subject: str) -> Optional[dict]:
    """Parse email subject: Customer | Module | CRType | Issue Type | Description"""
    parts = [part.strip() for part in subject.split("|")]
    if len(parts) >= 5:
        return {
            "customer": parts[0],
            "module": parts[1],
            "cr_type": parts[2],
            "issue_type": parts[3],
            "description": " | ".join(parts[4:])
        }
    return None

def create_audit_log(ticket_id: str, action: str, user: str, changes: dict):
    """Create audit log entry"""
    audit_logs_collection.insert_one({
        "ticket_id": ticket_id,
        "action": action,
        "user": user,
        "changes": changes,
        "timestamp": datetime.utcnow().isoformat()
    })

# Initialize default users
def init_default_users():
    """Create default users if they don't exist"""
    default_users = [
        {"username": "admin", "password": "admin123", "full_name": "System Admin", "role": "Admin"},
        {"username": "seenivasan", "password": "support123", "full_name": "Seenivasan", "role": "Support Engineer"},
        {"username": "vignesh", "password": "support123", "full_name": "Vignesh", "role": "Support Engineer"},
        {"username": "mariyaiya_se", "password": "support123", "full_name": "Mariyaiya", "role": "Support Engineer"},
        {"username": "palanivel", "password": "support123", "full_name": "Palanivel", "role": "Support Engineer"},
        {"username": "muthuvel", "password": "support123", "full_name": "Muthuvel", "role": "Support Engineer"},
        {"username": "mariyaiya_dev", "password": "dev123", "full_name": "Mariyaiya", "role": "Developer"},
        {"username": "annamalai", "password": "dev123", "full_name": "Annamalai", "role": "Developer"},
        {"username": "sasi", "password": "dev123", "full_name": "Sasi", "role": "Developer"},
        {"username": "mariya", "password": "dev123", "full_name": "Mariya", "role": "Developer"},
        {"username": "mohan", "password": "dev123", "full_name": "Mohan Babu", "role": "Developer"},
        {"username": "udhay", "password": "dev123", "full_name": "Udhay", "role": "Developer"},
        {"username": "manager", "password": "manager123", "full_name": "Manager", "role": "Manager"}
    ]
    
    for user_data in default_users:
        if not users_collection.find_one({"username": user_data["username"]}):
            users_collection.insert_one({
                "username": user_data["username"],
                "password": hash_password(user_data["password"]),
                "full_name": user_data["full_name"],
                "role": user_data["role"],
                "created_at": datetime.utcnow().isoformat()
            })
            print(f"Created user: {user_data['username']}")

# API Endpoints
@app.on_event("startup")
async def startup_event():
    init_default_users()
    print("ERP Ticketing System started successfully")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ERP Ticketing Management System"}

@app.post("/api/auth/login")
async def login(user_login: UserLogin):
    user = users_collection.find_one({"username": user_login.username})
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str

@app.post("/api/auth/register")
async def register(user_register: UserRegister):
    """Self-registration - First user gets Admin, rest get Manager role"""
    
    # Check if username already exists
    if users_collection.find_one({"username": user_register.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Validate username (alphanumeric and underscore only)
    if not re.match(r'^[a-zA-Z0-9_]+$', user_register.username):
        raise HTTPException(status_code=400, detail="Username must contain only letters, numbers, and underscores")
    
    # Validate password length
    if len(user_register.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if this is the first user
    user_count = users_collection.count_documents({})
    
    if user_count == 0:
        # First user gets Admin role
        role = "Admin"
    else:
        # Subsequent users get Manager role (read-only)
        role = "Manager"
    
    # Create user
    user_doc = {
        "username": user_register.username,
        "password": hash_password(user_register.password),
        "full_name": user_register.full_name,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": "self_registration"
    }
    
    users_collection.insert_one(user_doc)
    
    # Generate token for immediate login
    access_token = create_access_token(data={"sub": user_register.username})
    
    return {
        "message": f"Account created successfully with {role} role",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user_register.username,
            "full_name": user_register.full_name,
            "role": role
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/api/tickets")
async def create_ticket(
    ticket: TicketCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    # Generate ticket number
    ticket_number = generate_ticket_number()
    
    # Auto-assign based on module
    assignment = auto_assign_ticket(ticket.module)
    
    # Get current date and time
    now = datetime.utcnow()
    cr_date = now.strftime("%Y-%m-%d")
    cr_time = now.strftime("%H:%M:%S")
    
    # Create ticket document
    ticket_doc = {
        "ticket_number": ticket_number,
        "customer": ticket.customer,
        "cr_type": ticket.cr_type,
        "issue_type": ticket.issue_type,
        "type": ticket.type,
        "cr_date": cr_date,
        "cr_time": cr_time,
        "module": ticket.module,
        "description": ticket.description,
        "amc_cost": ticket.amc_cost,
        "pr_approval": ticket.pr_approval,
        "priority": ticket.priority,
        "status": "New",
        "se_name": assignment["support_engineer"],
        "developer": assignment["developer"],
        "developer_email": assignment["developer_email"],
        "planned_date": ticket.planned_date,
        "commitment_date": ticket.commitment_date,
        "completed_on": None,
        "completed_by": None,
        "completed_time": None,
        "time_duration": None,
        "exe_sent": None,
        "reason_for_issue": None,
        "customer_call": None,
        "remarks": ticket.remarks,
        "created_by": current_user["username"],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    # Insert ticket
    result = tickets_collection.insert_one(ticket_doc)
    ticket_doc["_id"] = str(result.inserted_id)
    
    # Update status to Assigned
    tickets_collection.update_one(
        {"ticket_number": ticket_number},
        {"$set": {"status": "Assigned"}}
    )
    ticket_doc["status"] = "Assigned"
    
    # Create audit log
    create_audit_log(ticket_doc["_id"], "created", current_user["username"], ticket_doc)
    
    # Send assignment email in background
    background_tasks.add_task(send_assignment_email, ticket_doc)
    
    return ticket_doc

@app.get("/api/tickets")
async def get_tickets(
    status: Optional[str] = None,
    module: Optional[str] = None,
    customer: Optional[str] = None,
    developer: Optional[str] = None,
    se_name: Optional[str] = None,
    cr_type: Optional[str] = None,
    issue_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if status:
        query["status"] = status
    if module:
        query["module"] = module
    if customer:
        query["customer"] = {"$regex": customer, "$options": "i"}
    if developer:
        query["developer"] = developer
    if se_name:
        query["se_name"] = se_name
    if cr_type:
        query["cr_type"] = cr_type
    if issue_type:
        query["issue_type"] = issue_type
    if from_date:
        query["cr_date"] = {"$gte": from_date}
    if to_date:
        if "cr_date" in query:
            query["cr_date"]["$lte"] = to_date
        else:
            query["cr_date"] = {"$lte": to_date}
    
    tickets = list(tickets_collection.find(query).sort("cr_date", DESCENDING))
    for ticket in tickets:
        ticket["_id"] = str(ticket["_id"])
    
    return tickets

@app.get("/api/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = tickets_collection.find_one({"ticket_number": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket["_id"] = str(ticket["_id"])
    return ticket

@app.put("/api/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    ticket_update: TicketUpdate,
    current_user: dict = Depends(get_current_user)
):
    ticket = tickets_collection.find_one({"ticket_number": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if ticket is completed (locked)
    if ticket["status"] == "Completed" and current_user["role"] not in ["Admin"]:
        # Only remarks can be updated
        if ticket_update.remarks:
            tickets_collection.update_one(
                {"ticket_number": ticket_id},
                {"$set": {"remarks": ticket_update.remarks, "updated_at": datetime.utcnow().isoformat()}}
            )
            return {"message": "Remarks updated successfully"}
        else:
            raise HTTPException(status_code=403, detail="Ticket is completed and locked")
    
    update_data = {k: v for k, v in ticket_update.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    tickets_collection.update_one({"ticket_number": ticket_id}, {"$set": update_data})
    
    # Create audit log
    create_audit_log(str(ticket["_id"]), "updated", current_user["username"], update_data)
    
    updated_ticket = tickets_collection.find_one({"ticket_number": ticket_id})
    updated_ticket["_id"] = str(updated_ticket["_id"])
    return updated_ticket

@app.put("/api/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status_update: StatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    ticket = tickets_collection.find_one({"ticket_number": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Validate status flow: New → Assigned → In Progress → Completed → Closed
    valid_statuses = ["New", "Assigned", "In Progress", "Completed", "Closed", "Pending"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Enforce: Cannot close ticket unless it's already completed
    if status_update.status == "Closed" and ticket["status"] != "Completed":
        raise HTTPException(
            status_code=400, 
            detail="Cannot close ticket. Status must be 'Completed' first before closing."
        )
    
    # Enforce: Completed status requires Resolution Type and Completion Remarks
    if status_update.status == "Completed":
        if not status_update.resolution_type:
            raise HTTPException(
                status_code=400,
                detail="Resolution Type is mandatory when marking ticket as Completed"
            )
        if not status_update.completion_remarks or not status_update.completion_remarks.strip():
            raise HTTPException(
                status_code=400,
                detail="Completion Remarks are mandatory when marking ticket as Completed"
            )
        
        # Validate resolution type
        valid_resolution_types = [
            "Fixed",
            "Enhancement Implemented",
            "Configuration Change",
            "Data Correction",
            "Duplicate / Not Required",
            "User Error",
            "Deferred",
            "Cannot Reproduce"
        ]
        if status_update.resolution_type not in valid_resolution_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid Resolution Type. Must be one of: {', '.join(valid_resolution_types)}"
            )
    
    update_data = {"status": status_update.status, "updated_at": datetime.utcnow().isoformat()}
    
    # If status is Completed, capture completion details
    if status_update.status == "Completed":
        now = datetime.utcnow()
        completed_on = now.strftime("%Y-%m-%d")
        completed_time = now.strftime("%H:%M:%S")
        completed_by = status_update.completed_by or current_user["full_name"]
        
        # Calculate time duration
        cr_date_str = ticket["cr_date"]
        cr_date = datetime.strptime(cr_date_str, "%Y-%m-%d")
        time_duration = (now - cr_date).days
        
        update_data.update({
            "completed_on": completed_on,
            "completed_time": completed_time,
            "completed_by": completed_by,
            "time_duration": f"{time_duration} days",
            "resolution_type": status_update.resolution_type,
            "completion_remarks": status_update.completion_remarks
        })
    
    tickets_collection.update_one({"ticket_number": ticket_id}, {"$set": update_data})
    
    # Create audit log
    create_audit_log(str(ticket["_id"]), "status_updated", current_user["username"], update_data)
    
    updated_ticket = tickets_collection.find_one({"ticket_number": ticket_id})
    updated_ticket["_id"] = str(updated_ticket["_id"])
    return updated_ticket

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Total tickets
    total_tickets = tickets_collection.count_documents({})
    
    # Status-wise count
    status_counts = {}
    for status in ["New", "Assigned", "In Progress", "Completed", "Closed", "Pending"]:
        status_counts[status] = tickets_collection.count_documents({"status": status})
    
    # Issue type wise count
    issue_types = tickets_collection.distinct("issue_type")
    issue_type_counts = {}
    for issue_type in issue_types:
        issue_type_counts[issue_type] = tickets_collection.count_documents({"issue_type": issue_type})
    
    # Module wise pending
    modules = tickets_collection.distinct("module")
    module_pending = {}
    for module in modules:
        module_pending[module] = tickets_collection.count_documents({
            "module": module,
            "status": {"$in": ["New", "Assigned", "In Progress", "Pending"]}
        })
    
    # Developer wise pending
    developers = tickets_collection.distinct("developer")
    developer_pending = {}
    for developer in developers:
        developer_pending[developer] = tickets_collection.count_documents({
            "developer": developer,
            "status": {"$in": ["New", "Assigned", "In Progress", "Pending"]}
        })
    
    # Support Engineer wise pending
    support_engineers = tickets_collection.distinct("se_name")
    se_pending = {}
    for se in support_engineers:
        se_pending[se] = tickets_collection.count_documents({
            "se_name": se,
            "status": {"$in": ["New", "Assigned", "In Progress", "Pending"]}
        })
    
    # CR Type wise
    cr_types = tickets_collection.distinct("cr_type")
    cr_type_counts = {}
    for cr_type in cr_types:
        cr_type_counts[cr_type] = tickets_collection.count_documents({"cr_type": cr_type})
    
    return {
        "total_tickets": total_tickets,
        "status_counts": status_counts,
        "issue_type_counts": issue_type_counts,
        "module_pending": module_pending,
        "developer_pending": developer_pending,
        "se_pending": se_pending,
        "cr_type_counts": cr_type_counts
    }

@app.get("/api/modules")
async def get_modules(current_user: dict = Depends(get_current_user)):
    """Get list of all modules"""
    return {"modules": list(supportModuleMap.keys())}

@app.get("/api/developers")
async def get_developers(current_user: dict = Depends(get_current_user)):
    """Get list of all developers"""
    return {"developers": list(set(developerModuleMap.values()))}

@app.get("/api/support-engineers")
async def get_support_engineers(current_user: dict = Depends(get_current_user)):
    """Get list of all support engineers"""
    return {"support_engineers": list(set(supportModuleMap.values()))}

# User Management APIs
@app.post("/api/users")
async def create_user(
    user_create: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new user (Admin only)"""
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    # Check if user already exists
    if users_collection.find_one({"username": user_create.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Validate role
    valid_roles = ["Admin", "Support Engineer", "Developer", "Manager"]
    if user_create.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Create user
    user_doc = {
        "username": user_create.username,
        "password": hash_password(user_create.password),
        "full_name": user_create.full_name,
        "role": user_create.role,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": current_user["username"]
    }
    
    result = users_collection.insert_one(user_doc)
    
    return {
        "message": "User created successfully",
        "username": user_create.username,
        "role": user_create.role
    }

@app.get("/api/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    """List all users (Admin only)"""
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")
    
    users = list(users_collection.find({}, {"password": 0}))
    for user in users:
        user["_id"] = str(user["_id"])
    
    return users

@app.delete("/api/users/{username}")
async def delete_user(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete user (Admin only)"""
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = users_collection.delete_one({"username": username})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {username} deleted successfully"}

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@app.put("/api/users/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change own password"""
    # Verify current password
    user = users_collection.find_one({"username": current_user["username"]})
    if not verify_password(password_change.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hashed = hash_password(password_change.new_password)
    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": {"password": new_hashed}}
    )
    
    return {"message": "Password changed successfully"}

class RoleUpdate(BaseModel):
    role: str

@app.put("/api/users/{username}/role")
async def update_user_role(
    username: str,
    role_update: RoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user role (Admin only)"""
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can update user roles")
    
    # Validate role
    valid_roles = ["Admin", "Support Engineer", "Developer", "Manager"]
    if role_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update role
    users_collection.update_one(
        {"username": username},
        {"$set": {"role": role_update.role}}
    )
    
    return {"message": f"User {username} role updated to {role_update.role}"}

@app.put("/api/users/{username}/reset-password")
async def reset_user_password(
    username: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """Reset user password (Admin only)"""
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can reset passwords")
    
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_hashed = hash_password(new_password)
    users_collection.update_one(
        {"username": username},
        {"$set": {"password": new_hashed}}
    )
    
    return {"message": f"Password reset successfully for user {username}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
