import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const API_BASE = "http://localhost:8000";

function App() {
  const [detections, setDetections] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState({ year: new Date().getFullYear(), month: '', day: '' });
  const [today, setToday] = useState({ date: '', count: 0 });
  const [activeTab, setActiveTab] = useState('daily'); // daily, monthly, yearly
  const [filteredData, setFilteredData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchAllDetections();
    fetchTodayDetection();
    fetchCountByDate(date.year, date.month, date.day);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    processDataForTab();
  }, [detections, activeTab]);

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

  const processDataForTab = () => {
    if (!detections.length) {
      setFilteredData([]);
      return;
    }

    const sortedDetections = [...detections].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    switch (activeTab) {
      case 'daily':
        setFilteredData(sortedDetections);
        break;
      case 'monthly':
        const monthlyData = aggregateByMonth(sortedDetections);
        console.log('Monthly data:', monthlyData);
        setFilteredData(monthlyData);
        break;
      case 'yearly':
        const yearlyData = aggregateByYear(sortedDetections);
        console.log('Yearly data:', yearlyData);
        setFilteredData(yearlyData);
        break;
      default:
        setFilteredData(sortedDetections);
    }
  };

  const aggregateByMonth = (data) => {
    const monthlyMap = new Map();
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      
      if (monthlyMap.has(monthKey)) {
        monthlyMap.get(monthKey).count += item.count;
      } else {
        monthlyMap.set(monthKey, { 
          date: monthName, 
          count: item.count,
          sortKey: monthKey // Thêm sortKey để sắp xếp
        });
      }
    });
    
    // Sắp xếp theo thứ tự thời gian
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({ date: item.date, count: item.count })); // Loại bỏ sortKey
  };

  const aggregateByYear = (data) => {
    const yearlyMap = new Map();
    
    data.forEach(item => {
      const date = new Date(item.date);
      const yearKey = date.getFullYear().toString();
      
      if (yearlyMap.has(yearKey)) {
        yearlyMap.get(yearKey).count += item.count;
      } else {
        yearlyMap.set(yearKey, { 
          date: yearKey, 
          count: item.count,
          sortKey: yearKey // Thêm sortKey để sắp xếp
        });
      }
    });
    
    // Sắp xếp theo thứ tự thời gian
    return Array.from(yearlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({ date: item.date, count: item.count })); // Loại bỏ sortKey
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDate(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCountByDate(date.year, date.month, date.day);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Chart data
  const labels = filteredData.map(item => item.date);
  const dataCounts = filteredData.map(item => item.count);

  console.log('Chart data:', { activeTab, labels, dataCounts, filteredData });

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Số người đi qua',
        data: dataCounts,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
          gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
          return gradient;
        },
        borderColor: '#667eea',
        pointBackgroundColor: '#764ba2',
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  const histogramData = {
    labels,
    datasets: [
      {
        label: 'Số người đi qua',
        data: dataCounts,
        backgroundColor: (context) => {
          const value = context.parsed.y;
          const max = Math.max(...dataCounts);
          const ratio = value / max;
          
          // Gradient từ tím nhạt đến đậm dựa trên giá trị
          const alpha = 0.3 + (ratio * 0.5); // 0.3 đến 0.8
          return `rgba(118, 75, 162, ${alpha})`;
        },
        borderColor: '#764ba2',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(102, 126, 234, 0.8)',
        hoverBorderColor: '#667eea',
        hoverBorderWidth: 2,
      },
    ],
  };

  const getChartTitle = () => {
    switch (activeTab) {
      case 'daily': return 'Thống kê số người đi qua theo ngày';
      case 'monthly': return 'Thống kê số người đi qua theo tháng';
      case 'yearly': return 'Thống kê số người đi qua theo năm';
      default: return 'Thống kê số người đi qua';
    }
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: getChartTitle(), 
        font: { size: 20, weight: 'bold' },
        color: '#667eea'
      },
      tooltip: { 
        mode: 'index', 
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#667eea',
        bodyColor: '#333',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        grid: { 
          display: false,
          color: 'rgba(102, 126, 234, 0.1)'
        },
        title: { 
          display: true, 
          text: 'Ngày',
          color: '#667eea',
          font: { weight: 'bold' }
        },
        ticks: {
          color: '#667eea',
          font: { weight: '500' }
        }
      },
      y: {
        beginAtZero: true,
        title: { 
          display: true, 
          text: 'Số người đi qua',
          color: '#667eea',
          font: { weight: 'bold' }
        },
        grid: {
          color: 'rgba(102, 126, 234, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#667eea',
          font: { weight: '500' }
        }
      }
    }
  };

  const histogramOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: getChartTitle(), 
        font: { size: 20, weight: 'bold' },
        color: '#764ba2'
      },
      tooltip: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#764ba2',
        bodyColor: '#333',
        borderColor: '#764ba2',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Số người đi qua: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { 
          display: false,
          color: 'rgba(118, 75, 162, 0.1)'
        },
        title: { 
          display: true, 
          text: activeTab === 'monthly' ? 'Tháng' : 'Năm',
          color: '#764ba2',
          font: { weight: 'bold' }
        },
        ticks: {
          color: '#764ba2',
          font: { weight: '500' }
        }
      },
      y: {
        beginAtZero: true,
        title: { 
          display: true, 
          text: 'Số người đi qua',
          color: '#764ba2',
          font: { weight: 'bold' }
        },
        grid: {
          color: 'rgba(118, 75, 162, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#764ba2',
          font: { weight: '500' }
        }
      }
    }
  };

  const getTotalCount = () => {
    return filteredData.reduce((sum, item) => sum + item.count, 0);
  };

  const getAverageCount = () => {
    return filteredData.length > 0 ? Math.round(getTotalCount() / filteredData.length) : 0;
  };

  return (
    <div className="gradient-bg">
      {/* Floating particles */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6 fade-in">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight pop-in mb-2">
              People Counter
            </h1>
            <p className="text-xl text-white/80 font-medium">Dashboard Analytics</p>
          </div>
          
          <form className="search-form flex flex-wrap gap-4 items-end pop-in" onSubmit={handleSubmit}>
            <div className="w-24">
              <label className="block text-xs font-medium mb-2 text-white/90">Năm</label>
              <input 
                type="number" 
                name="year" 
                min="2020" 
                max="2100" 
                value={date.year} 
                onChange={handleChange} 
                className="form-input w-full" 
                required 
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-2 text-white/90">Tháng</label>
              <input 
                type="number" 
                name="month" 
                min="1" 
                max="12" 
                value={date.month} 
                onChange={handleChange} 
                className="form-input w-full" 
                placeholder="MM"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-2 text-white/90">Ngày</label>
              <input 
                type="number" 
                name="day" 
                min="1" 
                max="31" 
                value={date.day} 
                onChange={handleChange} 
                className="form-input w-full" 
                placeholder="DD"
              />
            </div>
            <button type="submit" className="search-button">
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Xem thống kê'
              )}
            </button>
          </form>
        </header>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 fade-in">
          <div className="stat-card pop-in">
            <div className="stat-number pulse">{count !== null ? count : '...'}</div>
            <div className="text-sm text-gray-600 font-medium">Số người đi qua theo thời gian chọn</div>
          </div>
          
          <div className="stat-card pop-in">
            <div className="stat-number pulse">{today.count}</div>
            <div className="text-sm text-gray-600 font-medium">Số người đi qua hôm nay</div>
            <div className="text-xs text-gray-500 mt-1">{today.date}</div>
          </div>
          
          <div className="stat-card pop-in">
            <div className="stat-number pulse">{getTotalCount()}</div>
            <div className="text-sm text-gray-600 font-medium">Tổng số người đi qua</div>
          </div>
          
          <div className="stat-card pop-in">
            <div className="stat-number pulse">{getAverageCount()}</div>
            <div className="text-sm text-gray-600 font-medium">
              Trung bình mỗi {activeTab === 'daily' ? 'ngày' : activeTab === 'monthly' ? 'tháng' : 'năm'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 fade-in">
          <div className="tab-container flex space-x-1">
            <button
              onClick={() => handleTabChange('daily')}
              className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
            >
              📅 Theo ngày
            </button>
            <button
              onClick={() => handleTabChange('monthly')}
              className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            >
              📊 Theo tháng
            </button>
            <button
              onClick={() => handleTabChange('yearly')}
              className={`tab-button ${activeTab === 'yearly' ? 'active' : ''}`}
            >
              📈 Theo năm
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold mb-4 text-white">{getChartTitle()}:</h2>
          <div className="chart-container">
            {activeTab === 'daily' ? (
              <Line 
                key={activeTab}
                ref={chartRef} 
                data={lineChartData} 
                options={lineChartOptions} 
                height={400} 
              />
            ) : (
              <Bar 
                key={activeTab}
                ref={chartRef} 
                data={histogramData} 
                options={histogramOptions} 
                height={300} 
              />
            )}
          </div>
        </div>

        {/* Table */}
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Tổng hợp số người đi qua {activeTab === 'daily' ? 'theo ngày' : activeTab === 'monthly' ? 'theo tháng' : 'theo năm'}:
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-white/80">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="data-table overflow-x-auto">
              <table className="min-w-full text-sm md:text-base">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">
                      {activeTab === 'daily' ? 'Ngày' : activeTab === 'monthly' ? 'Tháng' : 'Năm'}
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-700">Số người đi qua</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className="table-row pop-in" style={{ animationDelay: `${0.1 * idx}s` }}>
                      <td className="px-6 py-4 font-medium text-gray-800">{item.date}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-800">{item.count}</td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📊</div>
                        Không có dữ liệu
                      </td>
                    </tr>
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