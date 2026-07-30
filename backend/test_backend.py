import requests
import time
import os

BASE_URL = "http://localhost:8000/api"
TEST_EMAIL = f"tester_{int(time.time())}@medlaw.ai"
TEST_PASSWORD = "testpassword123"

def run_tests():
    print("=" * 60)
    print("STARTING MEDLAW AI INTEGRATION TESTS")
    print("=" * 60)
    
    session = requests.Session()
    
    # 1. Register User
    print("\n1. Testing User Registration...")
    reg_payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    reg_res = session.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if reg_res.status_code == 200:
        print("  [PASS] Registration successful!")
    else:
        print(f"  [FAIL] Registration failed: {reg_res.status_code} - {reg_res.text}")
        return

    # 2. Login User
    print("\n2. Testing User Login...")
    login_payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    login_res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("  [PASS] Login successful! Token received.")
    else:
        print(f"  [FAIL] Login failed: {login_res.status_code} - {login_res.text}")
        return

    # 3. Verify Profile
    print("\n3. Testing Get Profile (/auth/me)...")
    me_res = session.get(f"{BASE_URL}/auth/me")
    if me_res.status_code == 200 and me_res.json()["email"] == TEST_EMAIL:
        print(f"  [PASS] Profile validation successful: {me_res.json()['email']}")
    else:
        print(f"  [FAIL] Profile retrieval failed: {me_res.status_code} - {me_res.text}")
        return

    # Create dummy files for uploads
    med_file_path = "temp_medical_report.txt"
    leg_file_path = "temp_legal_contract.txt"
    
    with open(med_file_path, "w") as f:
        f.write("Patient: John Doe. Lab tests: Hemoglobin is 10.5 g/dL. Vitamin D is 15.0 ng/mL. Cholesterol is 235 mg/dL. Fasting glucose is 92 mg/dL. TSH is 2.4.")
    with open(leg_file_path, "w") as f:
        f.write("This Employment Agreement is entered on August 1, 2026. The employee shall give 60 days written notice before resigning. Non-compete clause applies for 12 months in a 50-mile radius. Compensation is 90,000 USD per annum. Delaware jurisdiction.")

    doc1_id = None
    doc2_id = None

    try:
        # 4. Upload Medical Report
        print("\n4. Testing Medical Document Upload & Analysis...")
        with open(med_file_path, "rb") as f:
            files = {"file": (med_file_path, f, "text/plain")}
            data = {"file_type": "medical"}
            med_res = session.post(f"{BASE_URL}/documents/upload", files=files, data=data)
            
        if med_res.status_code == 200:
            doc_data = med_res.json()
            doc1_id = doc_data["id"]
            print(f"  [PASS] Medical report uploaded successfully! ID: {doc1_id}")
            print(f"  [INFO] Extracted {len(doc_data['medical_tests'])} medical tests.")
            for t in doc_data["medical_tests"]:
                print(f"    - {t['test_name']}: {t['result_val']} {t['unit']} ({t['status']})")
        else:
            print(f"  [FAIL] Medical upload failed: {med_res.status_code} - {med_res.text}")

        # 4b. Upload Second Medical Report (for Comparison tests)
        print("\n4b. Testing Second Medical Document Upload (for Comparison)...")
        # Let's create an updated report where Hemoglobin improves to 12.5 (Normal) and Vitamin D remains low
        med2_file_path = "temp_medical_report_followup.txt"
        with open(med2_file_path, "w") as f:
            f.write("Followup Lab tests: Hemoglobin is 12.5 g/dL (improved!). Vitamin D is 18.0 ng/mL (still low). Cholesterol is 235 mg/dL. Glucose is 92. TSH is 2.4.")
            
        with open(med2_file_path, "rb") as f:
            files = {"file": (med2_file_path, f, "text/plain")}
            data = {"file_type": "medical"}
            med2_res = session.post(f"{BASE_URL}/documents/upload", files=files, data=data)
            
        if med2_res.status_code == 200:
            doc2_id = med2_res.json()["id"]
            print(f"  [PASS] Second medical report uploaded! ID: {doc2_id}")
        else:
            print(f"  [FAIL] Second medical report upload failed: {med2_res.status_code}")
        
        if os.path.exists(med2_file_path):
            os.remove(med2_file_path)

        # 5. Upload Legal Contract
        print("\n5. Testing Legal Document Upload & Analysis...")
        with open(leg_file_path, "rb") as f:
            files = {"file": (leg_file_path, f, "text/plain")}
            data = {"file_type": "legal"}
            leg_res = session.post(f"{BASE_URL}/documents/upload", files=files, data=data)
            
        if leg_res.status_code == 200:
            doc_data = leg_res.json()
            leg_doc_id = doc_data["id"]
            print(f"  [PASS] Legal contract uploaded successfully! ID: {leg_doc_id}")
            print(f"  [INFO] Extracted {len(doc_data['legal_clauses'])} legal clauses.")
            for c in doc_data["legal_clauses"]:
                print(f"    - {c['clause_title']} (Risk: {c['risk_level']})")
        else:
            print(f"  [FAIL] Legal upload failed: {leg_res.status_code} - {leg_res.text}")

        # 6. Compare Medical Reports
        if doc1_id and doc2_id:
            print("\n6. Testing Medical Report Comparison Engine...")
            comp_res = session.get(f"{BASE_URL}/documents/compare/{doc1_id}/{doc2_id}")
            if comp_res.status_code == 200:
                comp_data = comp_res.json()
                print("  [PASS] Report comparison succeeded!")
                print(f"  [INFO] Improvements: {len(comp_data['improvements'])}")
                for item in comp_data['improvements']:
                    print(f"    - {item['test_name']}: was {item['report1_val']} {item['unit']}, now {item['report2_val']} ({item['change_type']})")
                print(f"  [INFO] Worsenings: {len(comp_data['worsenings'])}")
                print(f"  [INFO] Stables: {len(comp_data['stables'])}")
            else:
                print(f"  [FAIL] Report comparison failed: {comp_res.status_code} - {comp_res.text}")

        # 7. RAG Chat Session
        if doc1_id:
            print("\n7. Testing RAG Chat Session Creation...")
            sess_res = session.post(f"{BASE_URL}/chat/session?document_id={doc1_id}")
            if sess_res.status_code == 200:
                sess_data = sess_res.json()
                session_id = sess_data["id"]
                print(f"  [PASS] Chat session created successfully! ID: {session_id}")
                
                # Send Question
                print("  Sending RAG query: 'Why is my Vitamin D low?'...")
                msg_payload = {"message_text": "Why is my Vitamin D low?"}
                msg_res = session.post(f"{BASE_URL}/chat/session/{session_id}/message", json=msg_payload)
                if msg_res.status_code == 200:
                    ai_reply = msg_res.json()["message_text"]
                    print("    [PASS] AI RAG Answer received:")
                    print(f"    AI Reply: {ai_reply}")
                else:
                    print(f"    [FAIL] Message failed: {msg_res.status_code} - {msg_res.text}")
            else:
                print(f"  [FAIL] Chat session creation failed: {sess_res.status_code}")

    finally:
        # Cleanup temp files
        if os.path.exists(med_file_path):
            os.remove(med_file_path)
        if os.path.exists(leg_file_path):
            os.remove(leg_file_path)

    print("\n" + "=" * 60)
    print("MEDLAW AI INTEGRATION TESTS COMPLETED")
    print("" + "=" * 60)

if __name__ == "__main__":
    # Wait for uvicorn to start if executed externally, or test immediately
    run_tests()
