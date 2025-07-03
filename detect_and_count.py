import cv2
from ultralytics import YOLO
from pymongo import MongoClient
from datetime import datetime

# Kết nối MongoDB (localhost, port mặc định 27017)
client = MongoClient("mongodb://localhost:27017/")
db = client["people_counter_db"]
collection = db["detections"]

# Load YOLOv8 model (dùng model 'yolov8n' cho nhẹ)
model = YOLO('yolov8n.pt')

# Mở video (0 là webcam, hoặc thay bằng đường dẫn file video)
cap = cv2.VideoCapture(0)

last_has_person = False  # Trạng thái trước đó

def get_today_range():
    now = datetime.now()
    start = datetime(now.year, now.month, now.day)
    end = datetime(now.year, now.month, now.day, 23, 59, 59)
    return start, end

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Dự đoán với YOLOv8
    results = model(frame)

    # Lọc ra các object là 'person'
    person_count = 0
    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            if model.names[cls] == 'person':
                person_count += 1
                # Vẽ bounding box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(frame, 'person', (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    has_person = person_count > 0

    # Chỉ lưu khi trạng thái chuyển từ không có người sang có người
    if has_person and not last_has_person:
        # Xác định ngày hiện tại
        start, end = get_today_range()
        # Tìm record của ngày hôm nay
        record = collection.find_one({"date": {"$gte": start, "$lte": end}})
        if record:
            # Nếu đã có, cộng dồn biến count
            collection.update_one({"_id": record["_id"]}, {"$inc": {"count": 1}})
        else:
            # Nếu chưa có, tạo mới
            doc = {
                "date": start,
                "count": 1
            }
            collection.insert_one(doc)

    last_has_person = has_person

    # Hiển thị số lượng người trên frame
    cv2.putText(frame, f'Persons: {person_count}', (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
    cv2.imshow('People Counter', frame)

    # Nhấn 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
