import redis
import json
import time

# Kết nối tới Redis Server local
r = redis.Redis(host='localhost', port=6379, db=0)

CHANNEL = 'judge_results'

def send_result(user_id, submission_id, test_case_id, status, stdout=""):
    payload = {
        "userId": user_id,
        "submissionId": submission_id,
        "status": status,
        "executionTime": 15,
        "memoryUsed": 5,
        "score": 100 if status == "AC" else 0,
        "compileMessage": "",
        "testCaseResults": [
            {
                "testCaseNumber": test_case_id,
                "passed": True if status == "AC" else False,
                "message": status,
                "executionTime": 15,
                "memoryUsed": 5,
                "userOutput": stdout
            }
        ]
    }
    
    r.publish(CHANNEL, json.dumps(payload))
    print(f"✅ Đã gửi phản hồi {status} cho Submission {submission_id} (Test Case {test_case_id})")

if __name__ == "__main__":
    print("🚀 BỘ CHẤM ĐIỂM GIẢ LẬP (MOCK JUDGE ENGINE) CỦA CODE ARENA 🚀")
    print("Hướng dẫn: Bạn điền User ID và Submission ID vào lúc nộp bài để bắn kết quả về Frontend.")
    
    try:
        user_id = int(input("👉 Nhập ID của bạn (Tìm trong bảng users): "))
        sub_id = int(input("👉 Nhập Submission ID vừa nộp (nhìn Console Spring Boot): "))
        
        print("\n--- KỊCH BẢN CHẤM ĐIỂM ---")
        print("1. Đánh trượt (WA) - Không cộng Penalty")
        print("2. Đánh đỗ (AC) - Có cộng Penalty")
        choice = input("👉 Chọn kịch bản (1 hoặc 2): ")
        
        if choice == '1':
            send_result(user_id, sub_id, 1, "WA", "Kết quả sai rồi")
        elif choice == '2':
            send_result(user_id, sub_id, 1, "AC", "Kết quả đúng y chóc")
        else:
            print("❌ Lựa chọn không hợp lệ!")
            
    except ValueError:
        print("❌ Vui lòng nhập số nguyên hợp lệ!")
    except redis.exceptions.ConnectionError:
        print("❌ Không thể kết nối tới Redis! Hãy bật Redis Desktop Manager hoặc start redis-server lên.")
