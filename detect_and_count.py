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

# Lưu trạng thái tracking đơn giản
tracked_objects = {}  # {id: {'bbox': [x1,y1,x2,y2], 'class': class_name, 'frames': 0, 'counted': False}}
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

def find_nearest_object(center_x, center_y, class_name, tracked_objects, threshold=150):
    """Tìm object gần nhất trong tracked_objects"""
    for obj_id, obj_data in tracked_objects.items():
        if obj_data['class'] != class_name:  # Only match objects of same class
            continue
        obj_center_x = (obj_data['bbox'][0] + obj_data['bbox'][2]) // 2
        obj_center_y = (obj_data['bbox'][1] + obj_data['bbox'][3]) // 2
        distance = np.sqrt((center_x - obj_center_x)**2 + (center_y - obj_center_y)**2)
        if distance < threshold:
            return obj_id
    return None

def is_inside(boxA, boxB):
    # box = [x1, y1, x2, y2]
    return (boxA[0] >= boxB[0] and boxA[1] >= boxB[1] and
            boxA[2] <= boxB[2] and boxA[3] <= boxB[3])

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
            cls = int(box.cls[0])
            class_name = model.names[cls]
            if class_name in ['person', 'car', 'motorcycle']:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                center_x = (x1 + x2) // 2
                center_y = (y1 + y2) // 2
                current_detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'center': [center_x, center_y],
                    'class': class_name,
                    'conf': conf
                })
    # Lọc: chỉ count vehicle nếu person nằm trong vehicle
    persons = [d for d in current_detections if d['class'] == 'person']
    vehicles = [d for d in current_detections if d['class'] in ['car', 'motorcycle']]
    filtered_persons = []
    for p in persons:
        inside_vehicle = False
        for v in vehicles:
            if is_inside(p['bbox'], v['bbox']):
                inside_vehicle = True
                break
        if not inside_vehicle:
            filtered_persons.append(p)
    filtered_detections = vehicles + filtered_persons
    # Tracking đơn giản dựa trên khoảng cách
    new_tracked_objects = {}
    new_objects_count = 0
    for detection in filtered_detections:
        center_x, center_y = detection['center']
        bbox = detection['bbox']
        class_name = detection['class']
        nearest_id = find_nearest_object(center_x, center_y, class_name, tracked_objects)
        if nearest_id is not None:
            # Update existing object
            new_tracked_objects[nearest_id] = {
                'bbox': bbox,
                'center': [center_x, center_y],
                'class': class_name,
                'frames': tracked_objects[nearest_id]['frames'] + 1,
                'counted': tracked_objects[nearest_id]['counted']
            }
            # If object has been tracked for enough frames and not counted yet, count it
            if new_tracked_objects[nearest_id]['frames'] > 5 and not new_tracked_objects[nearest_id]['counted']:
                total_count += 1
                new_objects_count += 1
                new_tracked_objects[nearest_id]['counted'] = True
                print(f"Counted new {class_name}")
        else:
            # Create new tracked object
            obj_id = f"obj_{frame_count}_{len(new_tracked_objects)}"
            new_tracked_objects[obj_id] = {
                'bbox': bbox,
                'center': [center_x, center_y],
                'class': class_name,
                'frames': 1,
                'counted': False
            }

    tracked_objects = new_tracked_objects
    
    # Vẽ bounding boxes và thông tin
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        class_name = obj_data['class']
        
        # Vẽ bounding box
        color = (0, 255, 0) if obj_data['counted'] else (0, 0, 255)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f'{class_name} {obj_id}', (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    # Hiển thị số đếm
    cv2.putText(frame, f'Total Objects Counted: {total_count}', (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    cv2.imshow('Object Counter', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    # Update database for new objects
    if new_objects_count > 0:
        for _ in range(new_objects_count):
            update_counts()

cap.release()
cv2.destroyAllWindows()