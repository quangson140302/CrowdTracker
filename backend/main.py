from fastapi import FastAPI, Query
from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Kết nối MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["people_counter_db"]
collection = db["detections"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "People Counter API"}

@app.get("/detections")
def get_all_detections():
    # Lấy tất cả record, sắp xếp theo ngày mới nhất
    detections = list(collection.find().sort("date", -1))
    for d in detections:
        d["_id"] = str(d["_id"])
        d["date"] = d["date"].strftime("%Y-%m-%d")
    return detections

@app.get("/detections/today")
def get_today_detection():
    now = datetime.now()
    start = datetime(now.year, now.month, now.day)
    end = start + timedelta(days=1)
    record = collection.find_one({"date": {"$gte": start, "$lt": end}})
    if record:
        record["_id"] = str(record["_id"])
        record["date"] = record["date"].strftime("%Y-%m-%d")
        return record
    return {"date": start.strftime("%Y-%m-%d"), "count": 0}

@app.get("/detections/count/today")
def get_today_count():
    now = datetime.now()
    start = datetime(now.year, now.month, now.day)
    end = start + timedelta(days=1)
    record = collection.find_one({"date": {"$gte": start, "$lt": end}})
    count = record["count"] if record else 0
    return {"count": count}

@app.get("/detections/count/by-date")
def get_count_by_date(
    year: int = Query(..., description="Năm"),
    month: int = Query(None, description="Tháng"),
    day: int = Query(None, description="Ngày")
):
    # Nếu chỉ có year: thống kê theo năm
    # Nếu có year, month: thống kê theo tháng
    # Nếu có year, month, day: thống kê theo ngày
    if day and month:
        start = datetime(year, month, day)
        end = start + timedelta(days=1)
        record = collection.find_one({"date": {"$gte": start, "$lt": end}})
        count = record["count"] if record else 0
        return {"count": count}
    elif month:
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)
        total = 0
        for rec in collection.find({"date": {"$gte": start, "$lt": end}}):
            total += rec.get("count", 0)
        return {"count": total}
    else:
        start = datetime(year, 1, 1)
        end = datetime(year + 1, 1, 1)
        total = 0
        for rec in collection.find({"date": {"$gte": start, "$lt": end}}):
            total += rec.get("count", 0)
        return {"count": total} 