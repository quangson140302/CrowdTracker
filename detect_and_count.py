import cv2
from ultralytics import YOLO
from pymongo import MongoClient
from datetime import datetime
import numpy as np

# Kết nối MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["people_counter_db"]
collection = db["detections"]

# Load YOLOv8 model
model = YOLO('yolov8n.pt')

# Mở video
cap = cv2.VideoCapture(0)

# Lấy kích thước frame
ret, frame = cap.read()
if ret:
    height, width = frame.shape[:2]
else:
    height, width = 480, 640

# Định nghĩa vùng đếm (counting line) - giữa màn hình
counting_line_y = height // 2
line_margin = 50  # Khoảng cách cho phép để xác định đã qua line

# Lưu trạng thái tracking đơn giản
tracked_objects = {}  # {center_x: {'bbox': [x1,y1,x2,y2], 'direction': None, 'crossed': False, 'frames': 0}}
total_count = 0
frame_count = 0

def get_today_range():
    now = datetime.now()
    start = datetime(now.year, now.month, now.day)
    end = datetime(now.year, now.month, now.day, 23, 59, 59)
    return start, end

def update_counts():
    """Cập nhật số đếm vào database (cộng dồn)"""
    start, end = get_today_range()
    record = collection.find_one({"date": {"$gte": start, "$lte": end}})
    
    if record:
        # Cộng dồn count vào record hiện tại
        collection.update_one(
            {"_id": record["_id"]}, 
            {
                "$inc": {
                    "count": 1
                }
            }
        )
    else:
        # Tạo record mới
        doc = {
            "date": start,
            "count": 1
        }
        collection.insert_one(doc)

def find_nearest_object(center_x, center_y, tracked_objects, threshold=150):
    """Tìm object gần nhất trong tracked_objects"""
    for obj_id, obj_data in tracked_objects.items():
        obj_center_x = (obj_data['bbox'][0] + obj_data['bbox'][2]) // 2
        obj_center_y = (obj_data['bbox'][1] + obj_data['bbox'][3]) // 2
        distance = np.sqrt((center_x - obj_center_x)**2 + (center_y - obj_center_y)**2)
        if distance < threshold:
            return obj_id
    return None

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    
    # YOLO detection
    results = model(frame)
    
    # Xử lý detections
    current_detections = []
    for result in results:
        for box in result.boxes:
            print("box:",box)
            cls = int(box.cls[0])
            if model.names[cls] in ['person', 'car', 'motorbike']:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                center_x = (x1 + x2) // 2
                center_y = (y1 + y2) // 2
                
                current_detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'center': [center_x, center_y],
                    'conf': conf
                })
    
    # Tracking đơn giản dựa trên khoảng cách
    new_tracked_objects = {}
    
    crossed_this_frame = 0

    for detection in current_detections:
        center_x, center_y = detection['center']
        bbox = detection['bbox']
        nearest_id = find_nearest_object(center_x, center_y, tracked_objects, threshold=150)
        
        if nearest_id is not None:
            old_center_y = tracked_objects[nearest_id]['center'][1]
            new_tracked_objects[nearest_id] = {
                'bbox': bbox,
                'center': [center_x, center_y],
                'direction': tracked_objects[nearest_id]['direction'],
                'crossed': tracked_objects[nearest_id]['crossed'],
                'frames': tracked_objects[nearest_id]['frames'] + 1
            }
            if new_tracked_objects[nearest_id]['direction'] is None and new_tracked_objects[nearest_id]['frames'] > 1:
                if center_y < old_center_y - 10:
                    new_tracked_objects[nearest_id]['direction'] = 'up'
                elif center_y > old_center_y + 10:
                    new_tracked_objects[nearest_id]['direction'] = 'down'
            if not new_tracked_objects[nearest_id]['crossed']:
                if (old_center_y < counting_line_y and center_y >= counting_line_y) or \
                   (old_center_y > counting_line_y and center_y <= counting_line_y):
                    total_count += 1
                    crossed_this_frame += 1
                    print(f"Object {nearest_id} crossed the line")
                    new_tracked_objects[nearest_id]['crossed'] = True
        else:
            obj_id = f"obj_{frame_count}_{len(new_tracked_objects)}"
            new_tracked_objects[obj_id] = {
                'bbox': bbox,
                'center': [center_x, center_y],
                'direction': None,
                'crossed': False,
                'frames': 1
            }

    tracked_objects = new_tracked_objects
    
    # Vẽ bounding boxes và thông tin
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        center_x, center_y = obj_data['center']
        
        # Vẽ bounding box
        color = (0, 255, 0) if not obj_data['crossed'] else (0, 0, 255)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f'ID: {obj_id}', (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Vẽ hướng di chuyển
        if obj_data['direction']:
            direction_text = "UP" if obj_data['direction'] == 'up' else "DOWN"
            cv2.putText(frame, direction_text, (x1, y2+20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Vẽ counting line
    cv2.line(frame, (0, counting_line_y), (width, counting_line_y), (255, 0, 0), 2)
    cv2.putText(frame, 'Counting Line', (10, counting_line_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    # Hiển thị số đếm
    cv2.putText(frame, f'Total People Counted: {total_count}', (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    cv2.imshow('People Counter', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    if crossed_this_frame > 0:
        update_counts()

cap.release()
cv2.destroyAllWindows()
