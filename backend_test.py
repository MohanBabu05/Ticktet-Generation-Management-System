import requests
import sys
import json
from datetime import datetime

class ERPTicketingAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.current_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            f"Login ({username})",
            "POST",
            "api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user', {})
            print(f"   Logged in as: {self.current_user.get('full_name')} ({self.current_user.get('role')})")
            return True
        return False

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"username": "invalid", "password": "wrong"}
        )
        return success

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        return success

    def test_create_ticket(self, ticket_data):
        """Create a ticket"""
        success, response = self.run_test(
            "Create Ticket",
            "POST",
            "api/tickets",
            200,
            data=ticket_data
        )
        if success:
            ticket_number = response.get('ticket_number')
            print(f"   Created ticket: {ticket_number}")
            return ticket_number
        return None

    def test_get_tickets(self):
        """Get all tickets"""
        success, response = self.run_test(
            "Get All Tickets",
            "GET",
            "api/tickets",
            200
        )
        if success:
            print(f"   Found {len(response)} tickets")
        return success, response

    def test_get_tickets_with_filters(self):
        """Test ticket filtering"""
        success, response = self.run_test(
            "Get Tickets (Status=Assigned)",
            "GET",
            "api/tickets?status=Assigned",
            200
        )
        if success:
            print(f"   Found {len(response)} assigned tickets")
        return success

    def test_get_ticket_details(self, ticket_number):
        """Get ticket by ID"""
        success, response = self.run_test(
            f"Get Ticket Details ({ticket_number})",
            "GET",
            f"api/tickets/{ticket_number}",
            200
        )
        return success, response

    def test_update_ticket_status(self, ticket_number, new_status):
        """Update ticket status"""
        success, response = self.run_test(
            f"Update Status to {new_status}",
            "PUT",
            f"api/tickets/{ticket_number}/status",
            200,
            data={"status": new_status}
        )
        return success, response

    def test_update_ticket(self, ticket_number, update_data):
        """Update ticket details"""
        success, response = self.run_test(
            "Update Ticket Details",
            "PUT",
            f"api/tickets/{ticket_number}",
            200,
            data=update_data
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "api/dashboard/stats",
            200
        )
        if success:
            print(f"   Total tickets: {response.get('total_tickets', 0)}")
            print(f"   Status counts: {response.get('status_counts', {})}")
        return success

    def test_get_modules(self):
        """Test get modules endpoint"""
        success, response = self.run_test(
            "Get Modules",
            "GET",
            "api/modules",
            200
        )
        if success:
            modules = response.get('modules', [])
            print(f"   Found {len(modules)} modules")
        return success

    def test_get_developers(self):
        """Test get developers endpoint"""
        success, response = self.run_test(
            "Get Developers",
            "GET",
            "api/developers",
            200
        )
        return success

    def test_get_support_engineers(self):
        """Test get support engineers endpoint"""
        success, response = self.run_test(
            "Get Support Engineers",
            "GET",
            "api/support-engineers",
            200
        )
        return success

def main():
    print("🚀 Starting ERP Ticketing Management System API Tests")
    print("=" * 60)
    
    # Initialize tester
    tester = ERPTicketingAPITester("http://localhost:8001")
    
    # Test 1: Health Check
    print("\n📋 BASIC CONNECTIVITY TESTS")
    if not tester.test_health_check():
        print("❌ Health check failed - Backend may not be running")
        return 1

    # Test 2: Authentication Tests
    print("\n🔐 AUTHENTICATION TESTS")
    
    # Test invalid login
    tester.test_invalid_login()
    
    # Test valid logins for different roles
    test_users = [
        ("admin", "admin123"),
        ("seenivasan", "support123"),
        ("annamalai", "dev123"),
        ("manager", "manager123")
    ]
    
    login_results = {}
    for username, password in test_users:
        if tester.test_login(username, password):
            login_results[username] = True
            tester.test_get_me()
        else:
            login_results[username] = False
    
    # Use admin for remaining tests
    if not tester.test_login("admin", "admin123"):
        print("❌ Admin login failed - Cannot continue with tests")
        return 1

    # Test 3: Ticket Management
    print("\n🎫 TICKET MANAGEMENT TESTS")
    
    # Get existing tickets
    success, existing_tickets = tester.test_get_tickets()
    if success:
        print(f"   Existing tickets in system: {len(existing_tickets)}")
    
    # Test filtering
    tester.test_get_tickets_with_filters()
    
    # Create a new ticket
    test_ticket = {
        "customer": "Test Customer Ltd",
        "cr_type": "Enhancement",
        "issue_type": "New Feature",
        "module": "PPC",
        "description": "Test ticket created by automated testing system",
        "priority": "High",
        "remarks": "Created for API testing purposes"
    }
    
    new_ticket_number = tester.test_create_ticket(test_ticket)
    if not new_ticket_number:
        print("❌ Ticket creation failed")
        return 1
    
    # Test ticket details
    success, ticket_details = tester.test_get_ticket_details(new_ticket_number)
    if success:
        print(f"   Auto-assigned SE: {ticket_details.get('se_name')}")
        print(f"   Auto-assigned Developer: {ticket_details.get('developer')}")
    
    # Test status updates
    print("\n📊 STATUS WORKFLOW TESTS")
    
    # Test status progression: Assigned → In Progress → Completed
    status_flow = ["In Progress", "Completed"]
    for status in status_flow:
        success, updated_ticket = tester.test_update_ticket_status(new_ticket_number, status)
        if success and status == "Completed":
            print(f"   Completion details:")
            print(f"     Completed by: {updated_ticket.get('completed_by')}")
            print(f"     Completed on: {updated_ticket.get('completed_on')}")
            print(f"     Time duration: {updated_ticket.get('time_duration')}")
    
    # Test ticket update
    update_data = {"remarks": "Updated by automated test - ticket completed"}
    tester.test_update_ticket(new_ticket_number, update_data)

    # Test 4: Dashboard and Metadata
    print("\n📈 DASHBOARD & METADATA TESTS")
    tester.test_dashboard_stats()
    tester.test_get_modules()
    tester.test_get_developers()
    tester.test_get_support_engineers()

    # Test 5: Role-based Access (Quick test with different users)
    print("\n👥 ROLE-BASED ACCESS TESTS")
    
    # Test developer access
    if tester.test_login("annamalai", "dev123"):
        tester.test_get_tickets()
        tester.test_dashboard_stats()
    
    # Test manager access (read-only)
    if tester.test_login("manager", "manager123"):
        tester.test_get_tickets()
        tester.test_dashboard_stats()

    # Final Results
    print("\n" + "=" * 60)
    print(f"📊 FINAL TEST RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())