#!/usr/bin/env python3
"""
Email Listener Service for ERP Ticketing System
Monitors incoming emails and automatically creates tickets
"""

import imaplib
import email
from email.header import decode_header
import time
import os
from dotenv import load_dotenv
import requests
from datetime import datetime
import re

load_dotenv()

# Email Configuration
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "erpkalsofte@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
IMAP_SERVER = os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com")
CHECK_INTERVAL = 60  # Check every 60 seconds
API_URL = "http://localhost:8001"

# Admin credentials for API authentication
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def get_auth_token():
    """Get authentication token for API calls"""
    try:
        response = requests.post(
            f"{API_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"Failed to authenticate: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {str(e)}")
        return None

def parse_email_subject(subject):
    """
    Parse email subject in format:
    Customer | Module | CRType | Issue Type | Description
    
    Returns dict or None if format is invalid
    """
    parts = [part.strip() for part in subject.split("|")]
    
    if len(parts) >= 5:
        return {
            "customer": parts[0],
            "module": parts[1],
            "cr_type": parts[2],
            "issue_type": parts[3],
            "description": " | ".join(parts[4:])
        }
    else:
        print(f"Invalid subject format (expected 5+ parts, got {len(parts)}): {subject}")
        return None

def create_ticket_from_email(subject, body, token):
    """Create ticket via API"""
    parsed = parse_email_subject(subject)
    
    if not parsed:
        print(f"Skipping email with invalid subject format: {subject}")
        return False
    
    # Prepare ticket data
    ticket_data = {
        "customer": parsed["customer"],
        "module": parsed["module"],
        "cr_type": parsed["cr_type"],
        "issue_type": parsed["issue_type"],
        "description": f"{parsed['description']}\n\n--- Original Email Body ---\n{body}",
        "priority": "Medium",
        "remarks": f"Auto-created from email. Subject: {subject}"
    }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{API_URL}/api/tickets",
            json=ticket_data,
            headers=headers
        )
        
        if response.status_code == 200:
            ticket = response.json()
            print(f"✓ Created ticket {ticket['ticket_number']} from email")
            print(f"  Customer: {parsed['customer']}")
            print(f"  Module: {parsed['module']}")
            print(f"  Assigned to: {ticket['developer']}")
            return True
        else:
            print(f"✗ Failed to create ticket: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error creating ticket: {str(e)}")
        return False

def decode_email_subject(subject):
    """Decode email subject"""
    decoded_parts = []
    for part, encoding in decode_header(subject):
        if isinstance(part, bytes):
            decoded_parts.append(part.decode(encoding or 'utf-8', errors='ignore'))
        else:
            decoded_parts.append(part)
    return ''.join(decoded_parts)

def get_email_body(msg):
    """Extract email body"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            body = str(msg.get_payload())
    
    return body.strip()

def check_new_emails():
    """Check for new emails and create tickets"""
    
    # Check if email credentials are configured
    if not EMAIL_PASSWORD or EMAIL_PASSWORD == "your-app-password-here":
        print("⚠ Email credentials not configured. Email listener is in standby mode.")
        print("  To enable: Set EMAIL_PASSWORD in /app/backend/.env")
        return
    
    try:
        # Get authentication token
        token = get_auth_token()
        if not token:
            print("✗ Failed to authenticate with API")
            return
        
        # Connect to IMAP server
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        mail.select("inbox")
        
        # Search for unread emails
        status, messages = mail.search(None, "UNSEEN")
        
        if status != "OK":
            print("✗ Failed to search emails")
            return
        
        email_ids = messages[0].split()
        
        if len(email_ids) == 0:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] No new emails")
            mail.logout()
            return
        
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Found {len(email_ids)} new email(s)")
        
        # Process each email
        for email_id in email_ids:
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                
                if status != "OK":
                    continue
                
                # Parse email
                msg = email.message_from_bytes(msg_data[0][1])
                subject = decode_email_subject(msg["Subject"] or "")
                sender = msg["From"]
                body = get_email_body(msg)
                
                print(f"\nProcessing email:")
                print(f"  From: {sender}")
                print(f"  Subject: {subject}")
                
                # Create ticket
                if create_ticket_from_email(subject, body, token):
                    # Mark as read only if ticket creation was successful
                    mail.store(email_id, '+FLAGS', '\\Seen')
                
            except Exception as e:
                print(f"✗ Error processing email {email_id}: {str(e)}")
        
        mail.logout()
        
    except imaplib.IMAP4.error as e:
        print(f"✗ IMAP Error: {str(e)}")
        print("  Please verify email credentials in .env file")
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")

def main():
    """Main loop"""
    print("=" * 70)
    print("ERP TICKETING SYSTEM - EMAIL LISTENER SERVICE")
    print("=" * 70)
    print(f"Monitoring: {EMAIL_ADDRESS}")
    print(f"IMAP Server: {IMAP_SERVER}")
    print(f"Check Interval: {CHECK_INTERVAL} seconds")
    print("=" * 70)
    print("\nExpected Email Subject Format:")
    print("Customer | Module | CRType | Issue Type | Description")
    print("\nExample:")
    print("Sky Cotex | PPC | Customer CR | Operational Issue | Rate Master Issue")
    print("=" * 70)
    print("\nService started. Press Ctrl+C to stop.\n")
    
    while True:
        try:
            check_new_emails()
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print("\n\nEmail listener service stopped.")
            break
        except Exception as e:
            print(f"✗ Error in main loop: {str(e)}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
