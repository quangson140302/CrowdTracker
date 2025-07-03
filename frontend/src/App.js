import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './App.css'; // Thêm file CSS cho animation

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE = "http://localhost:8000"; // Sửa lại nếu backend chạy ở host khác

function App() {
  const [detections, setDetections] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState({ year: new Date().getFullYear(), month: '', day: '' });
  const [today, setToday] = useState({ date: '', count: 0 });
  const chartRef = useRef(null);

  // Lấy danh sách tổng hợp theo ngày khi load trang
  useEffect(() => {
    fetchAllDetections();
    fetchTodayDetection();
    fetchCountByDate(date.year, date.month, date.day);
    // eslint-disable-next-line
  }, []);

  const fetchAllDetections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/detections`);
      setDetections(res.data);
    } catch (err) {
      setDetections([]);
    }
    setLoading(false);
  };

  const fetchTodayDetection = async () => {
    try {
      const res = await axios.get(`${API_BASE}/detections/today`);
      setToday(res.data);
    } catch (err) {
      setToday({ date: '', count: 0 });
    }
  };

  const fetchCountByDate = async (year, month, day) => {
    if (!year) return;
    let url = `${API_BASE}/detections/count/by-date?year=${year}`;
    if (month) url += `&month=${month}`;
    if (day) url += `&day=${day}`;
    try {
      const res = await axios.get(url);
      setCount(res.data.count);
    } catch (err) {
      setCount(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDate(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCountByDate(date.year, date.month, date.day);
  };

  // Sắp xếp theo ngày tăng dần
  const sortedDetections = [...detections].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedDetections.map(item => item.date);
  const dataCounts = sortedDetections.map(item => item.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Số lượt phát hiện',
        data: dataCounts,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(245, 158, 66, 0.3)'); // secondary
          gradient.addColorStop(1, 'rgba(245, 158, 66, 0.05)');
          return gradient;
        },
        borderColor: '#f59e42', // secondary
        pointBackgroundColor: '#2563eb', // primary
        pointRadius: 5,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Thống kê số lượt phát hiện theo ngày', font: { size: 20 } },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Ngày' }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Số lượt phát hiện' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center py-8 px-2">
      <main className="w-full max-w-6xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 fade-in">
          <h1 className="text-4xl font-extrabold text-heading dark:text-heading-dark tracking-tight pop-in">People Counter Dashboard</h1>
          <form className="flex flex-wrap gap-4 items-end pop-in" onSubmit={handleSubmit}>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Năm</label>
              <input type="number" name="year" min="2020" max="2100" value={date.year} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
            </div>
            <div className="w-16">
              <label className="block text-xs font-medium mb-1">Tháng</label>
              <input type="number" name="month" min="1" max="12" value={date.month} onChange={handleChange} className="border rounded px-2 py-1 w-full" placeholder="" />
            </div>
            <div className="w-16">
              <label className="block text-xs font-medium mb-1">Ngày</label>
              <input type="number" name="day" min="1" max="31" value={date.day} onChange={handleChange} className="border rounded px-2 py-1 w-full" placeholder="" />
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition pop-in">Xem thống kê</button>
          </form>
        </header>
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 fade-in">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center pop-in border-t-4 border-primary">
            <div className="text-5xl font-bold text-primary mb-2">{count !== null ? count : '...'}</div>
            <div className="text-sm text-primary-dark">Số lượt phát hiện theo thời gian chọn</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center pop-in border-t-4 border-secondary">
            <div className="text-5xl font-bold text-secondary mb-2">{today.count}</div>
            <div className="text-sm text-primary-dark">Số lượt phát hiện hôm nay</div>
            <div className="text-xs text-primary mt-1">{today.date}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center pop-in border-t-4 border-primary-light">
            <div className="text-5xl font-bold text-primary-light mb-2">{detections.length}</div>
            <div className="text-sm text-primary-dark">Số ngày có dữ liệu</div>
          </div>
        </div>
        {/* Chart */}
        <div className="mb-8 fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold mb-2 text-white">Biểu đồ số lượt phát hiện theo ngày:</h2>
          <div className="bg-white p-2 md:p-6 rounded-2xl shadow-lg">
            <Line ref={chartRef} data={chartData} options={chartOptions} height={320} />
          </div>
        </div>
        {/* Table */}
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-semibold mb-2 text-white">Tổng hợp số lượt phát hiện theo ngày:</h2>
          {loading ? (
            <div>Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm md:text-base rounded-xl overflow-hidden">
                <thead className="bg-primary-light/30">
                  <tr>
                    <th className="px-2 md:px-4 py-2 border">Ngày</th>
                    <th className="px-2 md:px-4 py-2 border">Số lượt phát hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDetections.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-secondary-light/30 pop-in">
                      <td className="px-2 md:px-4 py-2 border">{item.date}</td>
                      <td className="px-2 md:px-4 py-2 border text-center">{item.count}</td>
                    </tr>
                  ))}
                  {sortedDetections.length === 0 && (
                    <tr><td colSpan={2} className="text-center py-4">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 