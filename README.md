# CrowdTracker
# 🚶‍♂️ People Counter Dashboard

> Hệ thống đếm người thông minh sử dụng YOLOv8 và OpenCV với giao diện dashboard hiện đại

![People Counter](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-18.0+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green)

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử dụng)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [API Endpoints](#-api-endpoints)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Demo](#-demo)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

## 🎯 Tổng quan

People Counter Dashboard là một hệ thống hoàn chỉnh để đếm và theo dõi số lượng người đi qua một khu vực cụ thể. Hệ thống sử dụng YOLOv8 để phát hiện người, OpenCV để xử lý video, và cung cấp giao diện dashboard hiện đại với các biểu đồ thống kê trực quan.

### 🌟 Điểm nổi bật

- **AI-Powered Detection**: Sử dụng YOLOv8 để phát hiện người chính xác
- **Real-time Tracking**: Theo dõi người đi qua đường đếm theo thời gian thực
- **Modern Dashboard**: Giao diện React với animations và glass morphism
- **Multi-view Analytics**: Thống kê theo ngày, tháng, năm
- **Responsive Design**: Tương thích với mọi thiết bị
- **Performance Optimized**: Tối ưu hóa hiệu suất và animations

## ✨ Tính năng

### 🔍 Detection & Tracking
- Phát hiện người sử dụng YOLOv8
- Tracking người đi qua đường đếm
- Đếm tổng số người đi qua (không phân biệt hướng)
- Tránh đếm trùng lặp

### 📊 Analytics Dashboard
- **Thống kê theo ngày**: Line chart với gradient fill
- **Thống kê theo tháng**: Histogram chart với màu sắc động
- **Thống kê theo năm**: Histogram chart cho so sánh
- **Cards thông tin**: Số liệu tổng hợp và trung bình
- **Bảng dữ liệu**: Chi tiết theo thời gian

### 🎨 UI/UX Features
- **Glass Morphism**: Hiệu ứng kính mờ hiện đại
- **Gradient Backgrounds**: Nền gradient động
- **Floating Particles**: Hiệu ứng hạt bay
- **Smooth Animations**: Animations mượt mà
- **Dark Theme**: Giao diện tối với màu sắc đẹp mắt
- **Responsive**: Tương thích mobile/desktop

### 🔧 Technical Features
- **FastAPI Backend**: API RESTful hiệu suất cao
- **MongoDB Storage**: Lưu trữ dữ liệu linh hoạt
- **Real-time Updates**: Cập nhật dữ liệu theo thời gian thực
- **Performance Optimized**: Tối ưu hóa animations và rendering

## 🛠 Công nghệ sử dụng

### Backend
- **Python 3.8+**: Ngôn ngữ chính
- **FastAPI**: Web framework hiệu suất cao
- **OpenCV**: Xử lý video và computer vision
- **YOLOv8**: Object detection model
- **MongoDB**: Database NoSQL
- **Pymongo**: MongoDB driver
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: UI framework
- **Chart.js**: Biểu đồ tương tác
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Animations**: Custom animations

### AI/ML
- **YOLOv8n**: Lightweight object detection
- **OpenCV**: Computer vision library
- **NumPy**: Numerical computing

## 📦 Cài đặt

### Yêu cầu hệ thống
- Python 3.8+
- Node.js 16+
- MongoDB 5.0+
- Webcam hoặc video file

### 1. Clone repository
```bash
git clone https://github.com/your-username/people-counter.git
cd people-counter
```

### 2. Cài đặt Backend
```bash
# Tạo virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# hoặc
.venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Tải YOLOv8 model (nếu chưa có)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
```

### 4. Cấu hình MongoDB
```bash
# Khởi động MongoDB
mongod

# Hoặc sử dụng MongoDB Atlas (cloud)
# Cập nhật connection string trong backend/main.py
```

## 🚀 Sử dụng

### 1. Khởi động Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Khởi động Frontend
```bash
cd frontend
npm start
```

### 3. Chạy Detection
```bash
# Sử dụng webcam
python detect_and_count.py

# Hoặc sử dụng video file
python detect_and_count.py --video path/to/video.mp4
```

### 4. Truy cập Dashboard
Mở trình duyệt và truy cập: `http://localhost:3000`

## 🔌 API Endpoints

### Detections
- `GET /detections` - Lấy tất cả detections
- `GET /detections/today` - Lấy detection hôm nay
- `GET /detections/count/by-date` - Lấy count theo ngày/tháng/năm

### Parameters
- `year` (required): Năm
- `month` (optional): Tháng (1-12)
- `day` (optional): Ngày (1-31)

### Response Format
```json
{
  "date": "2024-12-20",
  "count": 150
}
```

## 📁 Cấu trúc dự án

```
people_counter/
├── backend/
│   ├── main.py              # FastAPI server
│   └── __pycache__/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Styles và animations
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── detect_and_count.py      # YOLOv8 detection script
├── requirements.txt         # Python dependencies
├── yolov8n.pt              # YOLOv8 model
└── README.md
```

## 🎥 Demo

### Screenshots
- **Dashboard Overview**: Giao diện tổng quan với cards thống kê
- **Daily Chart**: Line chart với gradient fill
- **Monthly Histogram**: Bar chart với màu sắc động
- **Responsive Design**: Giao diện mobile-friendly

### Video Demo
[Link video demo sẽ được thêm sau]

## 🔧 Cấu hình

### Environment Variables
```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/people_counter

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# Frontend Settings
REACT_APP_API_BASE=http://localhost:8000
```

### Customization
- **Colors**: Thay đổi trong `frontend/src/App.css`
- **Charts**: Cấu hình trong `frontend/src/App.js`
- **Detection**: Điều chỉnh trong `detect_and_count.py`

## 🚀 Deployment

### Backend (Railway/Render)
```bash
# Railway
railway login
railway init
railway up

# Render
# Tạo service từ GitHub repository
```

### Frontend (Vercel)
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Setup
```bash
# Backend
MONGODB_URI=your_mongodb_atlas_uri
API_HOST=0.0.0.0
API_PORT=$PORT

# Frontend
REACT_APP_API_BASE=your_backend_url
```

## 🤝 Đóng góp

Chúng tôi rất hoan nghênh mọi đóng góp! Hãy:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Guidelines
- Tuân thủ coding standards
- Thêm tests cho tính năng mới
- Cập nhật documentation
- Kiểm tra performance

## 📝 License

Dự án này được phân phối dưới giấy phép MIT. Xem `LICENSE` để biết thêm chi tiết.

## 📞 Liên hệ

- **Author**: [Your Name]
- **Email**: your.email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/your-profile)

## 🙏 Acknowledgments

- [Ultralytics](https://github.com/ultralytics/ultralytics) cho YOLOv8
- [OpenCV](https://opencv.org/) cho computer vision
- [Chart.js](https://www.chartjs.org/) cho biểu đồ
- [Tailwind CSS](https://tailwindcss.com/) cho styling

---

⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star trên GitHub!
