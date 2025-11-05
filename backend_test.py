import requests
import sys
import json
from datetime import datetime

class CagnotteAPITester:
    def __init__(self, base_url="https://expenseshare-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "eric.savary@lausanne.ch"
        self.admin_password = "admin123"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
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

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            print(f"   Is Admin: {response.get('is_admin', False)}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_config(self):
        """Test get configuration"""
        success, response = self.run_test(
            "Get Configuration",
            "GET",
            "config",
            200
        )
        return success

    def test_get_participants(self):
        """Test get all participants (admin only)"""
        success, response = self.run_test(
            "Get All Participants",
            "GET",
            "participants",
            200
        )
        return success

    def test_create_participant(self):
        """Test create new participant"""
        test_participant = {
            "nom": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test.user.{datetime.now().strftime('%H%M%S')}@test.ch",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Create New Participant",
            "POST",
            "participants",
            200,
            data=test_participant
        )
        
        if success:
            self.test_participant_id = response.get('id')
            print(f"   Created participant ID: {self.test_participant_id}")
        
        return success

    def test_get_paiements(self):
        """Test get user's payments"""
        success, response = self.run_test(
            "Get User Payments",
            "GET",
            "paiements",
            200
        )
        return success

    def test_get_all_paiements(self):
        """Test get all payments (admin only)"""
        success, response = self.run_test(
            "Get All Payments",
            "GET",
            "paiements/all",
            200
        )
        return success

    def test_create_paiement(self):
        """Test create new payment"""
        current_month = datetime.now().strftime("%Y-%m")
        test_paiement = {
            "mois": current_month,
            "montant": 50.0,
            "methode": "TWINT",
            "raison": "Test payment"
        }
        
        success, response = self.run_test(
            "Create New Payment",
            "POST",
            "paiements",
            200,
            data=test_paiement
        )
        
        if success:
            self.test_paiement_id = response.get('id')
            print(f"   Created payment ID: {self.test_paiement_id}")
        
        return success

    def test_duplicate_paiement(self):
        """Test anti-duplicate functionality"""
        current_month = datetime.now().strftime("%Y-%m")
        test_paiement = {
            "mois": current_month,
            "montant": 25.0,
            "methode": "VIREMENT",
            "raison": "Duplicate test"
        }
        
        success, response = self.run_test(
            "Test Anti-Duplicate Payment",
            "POST",
            "paiements",
            400,  # Should fail with 400
            data=test_paiement
        )
        return success

    def test_get_participant_kpi(self):
        """Test get participant KPIs"""
        success, response = self.run_test(
            "Get Participant KPIs",
            "GET",
            "kpi/participant",
            200
        )
        return success

    def test_get_admin_kpi(self):
        """Test get admin KPIs"""
        success, response = self.run_test(
            "Get Admin KPIs",
            "GET",
            "kpi/admin",
            200
        )
        return success

    def test_create_depense(self):
        """Test create shared expense"""
        # First get participants to use in expense
        success, participants = self.run_test(
            "Get Participants for Expense",
            "GET",
            "participants",
            200
        )
        
        if not success or not participants:
            print("   Cannot test expense creation - no participants found")
            return False
        
        # Use first two active participants
        active_participants = [p for p in participants if p.get('actif', True)]
        if len(active_participants) < 1:
            print("   Cannot test expense creation - no active participants")
            return False
        
        participant_ids = [p['id'] for p in active_participants[:2]]
        
        test_depense = {
            "participants": participant_ids,
            "montant_total": 100.0,
            "raison": "Test shared expense",
            "repartition": "egale"
        }
        
        success, response = self.run_test(
            "Create Shared Expense",
            "POST",
            "depenses",
            200,
            data=test_depense
        )
        return success

    def test_confirm_month(self):
        """Test confirm month payments"""
        current_month = datetime.now().strftime("%Y-%m")
        
        success, response = self.run_test(
            "Confirm Month Payments",
            "POST",
            f"paiements/confirm-month?mois={current_month}",
            200
        )
        return success

    def test_export_csv(self):
        """Test CSV export"""
        if not self.user_id:
            print("   Cannot test CSV export - no user ID")
            return False
        
        success, response = self.run_test(
            "Export CSV",
            "GET",
            f"export/csv/{self.user_id}",
            200
        )
        
        if success and 'csv' in response:
            print(f"   CSV data length: {len(response['csv'])} characters")
        
        return success

def main():
    print("🚀 Starting Cagnotte API Tests")
    print("=" * 50)
    
    tester = CagnotteAPITester()
    
    # Test sequence
    tests = [
        ("Login", tester.test_login),
        ("Get Me", tester.test_get_me),
        ("Get Config", tester.test_get_config),
        ("Get Participants", tester.test_get_participants),
        ("Create Participant", tester.test_create_participant),
        ("Get User Payments", tester.test_get_paiements),
        ("Get All Payments", tester.test_get_all_paiements),
        ("Create Payment", tester.test_create_paiement),
        ("Test Anti-Duplicate", tester.test_duplicate_paiement),
        ("Get Participant KPIs", tester.test_get_participant_kpi),
        ("Get Admin KPIs", tester.test_get_admin_kpi),
        ("Create Shared Expense", tester.test_create_depense),
        ("Confirm Month", tester.test_confirm_month),
        ("Export CSV", tester.test_export_csv),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())