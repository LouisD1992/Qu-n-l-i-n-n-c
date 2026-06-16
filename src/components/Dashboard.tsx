import React, { useState, useMemo } from 'react';
import { MemberUnit, Reading, AlertLog } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Droplet, 
  AlertTriangle, 
  DollarSign, 
  Building2, 
  ChevronRight, 
  Percent, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  X,
  Trash2
} from 'lucide-react';

interface DashboardProps {
  units: MemberUnit[];
  readings: Reading[];
  alerts: AlertLog[];
  onDeleteAlert: (id: string) => void;
  onClearAllAlerts: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ units, readings, alerts, onDeleteAlert, onClearAllAlerts, onNavigateToTab }: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to latest May
  const [isClearAlertsModalOpen, setIsClearAlertsModalOpen] = useState<boolean>(false);

  // Available months and years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(readings.map(r => r.year)));
    return years.length > 0 ? years : [2026];
  }, [readings]);

  const availableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Helper formater for currencies (VND)
  const formatVND = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' Trđ';
    }
    return value.toLocaleString('vi-VN') + ' đ';
  };

  // 1. Current Month's Statistics
  const monthStats = useMemo(() => {
    const currentReadings = readings.filter(r => r.month === selectedMonth && r.year === selectedYear);
    
    let totalElec = 0;
    let totalWater = 0;
    let totalElecCost = 0;
    let totalWaterCost = 0;
    let elecWarningsCount = 0;
    let waterWarningsCount = 0;

    currentReadings.forEach(r => {
      totalElec += r.elecConsumed;
      totalWater += r.waterConsumed;
      totalElecCost += r.elecCost;
      totalWaterCost += r.waterCost;
      if (r.isElecWarning) elecWarningsCount++;
      if (r.isWaterWarning) waterWarningsCount++;
    });

    // Previous month stats for comparison
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevReadings = readings.filter(r => r.month === prevMonth && r.year === prevYear);

    let prevTotalElec = 0;
    let prevTotalWater = 0;
    prevReadings.forEach(r => {
      prevTotalElec += r.elecConsumed;
      prevTotalWater += r.waterConsumed;
    });

    const elecTrend = prevTotalElec > 0 ? ((totalElec - prevTotalElec) / prevTotalElec) * 100 : 0;
    const waterTrend = prevTotalWater > 0 ? ((totalWater - prevTotalWater) / prevTotalWater) * 100 : 0;

    return {
      elec: totalElec,
      water: totalWater,
      elecCost: totalElecCost,
      waterCost: totalWaterCost,
      totalCost: totalElecCost + totalWaterCost,
      warnings: elecWarningsCount + waterWarningsCount,
      elecWarningsCount,
      waterWarningsCount,
      elecTrend,
      waterTrend,
    };
  }, [readings, selectedMonth, selectedYear]);

  // 2. Chart data for Monthly Trends
  const monthlyTrendsData = useMemo(() => {
    const data: any[] = [];
    // Sort months 1-5 or whatever is available in the current year
    const months = Array.from(new Set(readings.filter(r => r.year === selectedYear).map(r => r.month))).sort((a,b) => a-b);
    
    months.forEach(m => {
      const monthReadings = readings.filter(r => r.month === m && r.year === selectedYear);
      let elec = 0;
      let water = 0;
      let cost = 0;

      monthReadings.forEach(r => {
        elec += r.elecConsumed;
        water += r.waterConsumed;
        cost += (r.elecCost + r.waterCost);
      });

      data.push({
        name: `Tháng ${m}`,
        'Điện (kWh)': elec,
        'Nước (m³)': water,
        'Chi phí (Trđ)': Math.round(cost / 1000000 * 100) / 100,
      });
    });

    return data;
  }, [readings, selectedYear]);

  // 3. Chart data: Comparison between Units for the selected month
  const unitComparisonData = useMemo(() => {
    const currentReadings = readings.filter(r => r.month === selectedMonth && r.year === selectedYear);
    
    return currentReadings.map(r => {
      const unit = units.find(u => u.id === r.unitId);
      return {
        name: unit ? unit.name : 'Unknown',
        code: unit ? unit.code : '??',
        'Điện tiêu thụ': r.elecConsumed,
        'Ngưỡng điện': unit ? unit.electricityThreshold : 0,
        'Nước tiêu thụ': r.waterConsumed,
        'Ngưỡng nước': unit ? unit.waterThreshold : 0,
        'Tổng chi phí (Trđ)': Math.round((r.elecCost + r.waterCost) / 1000000 * 100) / 100,
      };
    });
  }, [readings, units, selectedMonth, selectedYear]);

  // 4. Over-threshold Units List
  const overThresholdUnits = useMemo(() => {
    const currentReadings = readings.filter(r => r.month === selectedMonth && r.year === selectedYear);
    const list: any[] = [];

    currentReadings.forEach(r => {
      const unit = units.find(u => u.id === r.unitId);
      if (!unit) return;

      const elecExceeded = r.elecConsumed > unit.electricityThreshold;
      const waterExceeded = r.waterConsumed > unit.waterThreshold;

      if (elecExceeded || waterExceeded) {
        list.push({
          unit,
          r,
          elecExceeded,
          waterExceeded,
          elecPct: Math.round(((r.elecConsumed - unit.electricityThreshold) / unit.electricityThreshold) * 100),
          waterPct: Math.round(((r.waterConsumed - unit.waterThreshold) / unit.waterThreshold) * 100),
        });
      }
    });

    return list;
  }, [readings, units, selectedMonth, selectedYear]);

  // 5. Recent notifications
  const recentAlerts = useMemo(() => {
    return alerts
      .filter(a => a.year === selectedYear && a.month === selectedMonth)
      .slice(0, 4);
  }, [alerts, selectedMonth, selectedYear]);

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* Filters & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Tổng hợp Điện & Nước</h2>
          <p className="text-sm text-slate-500">Thống kê chỉ số, theo dõi hiệu năng và phát hiện hao phí toàn tập đoàn</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <span>Năm:</span>
            <select 
              id="year-select"
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <span>Tháng:</span>
            <select 
              id="month-select"
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>Tháng {month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Electricity */}
        <div id="metric-electricity" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            {monthStats.elecTrend !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                monthStats.elecTrend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {monthStats.elecTrend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(monthStats.elecTrend).toFixed(1)}% so T.{selectedMonth === 1 ? 12 : selectedMonth - 1}
              </span>
            )}
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">Tổng Điện tiêu thụ</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {monthStats.elec.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">kWh</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span>Đơn vị ghi nhận: {readings.filter(r => r.month === selectedMonth && r.year === selectedYear).length}</span>
              <span className="text-amber-600 font-medium">Chi điện: {formatVND(monthStats.elecCost)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Water */}
        <div id="metric-water" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
              <Droplet className="h-5 w-5" />
            </div>
            {monthStats.waterTrend !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                monthStats.waterTrend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {monthStats.waterTrend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(monthStats.waterTrend).toFixed(1)}% so T.{selectedMonth === 1 ? 12 : selectedMonth - 1}
              </span>
            )}
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">Tổng Nước tiêu thụ</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {monthStats.water.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">m³</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span>Đơn vị ghi nhận: {readings.filter(r => r.month === selectedMonth && r.year === selectedYear).length}</span>
              <span className="text-blue-600 font-medium">Chi nước: {formatVND(monthStats.waterCost)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Cost */}
        <div id="metric-cost" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Tổng chi phí
            </span>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">Tổng Ngân sách Tiêu thụ</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {formatVND(monthStats.totalCost)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span>Tỷ trọng chi điện: {monthStats.totalCost > 0 ? Math.round((monthStats.elecCost / monthStats.totalCost) * 100) : 0}%</span>
              <span>Nước: {monthStats.totalCost > 0 ? Math.round((monthStats.waterCost / monthStats.totalCost) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Warnings */}
        <div id="metric-warnings" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className={`p-2.5 rounded-lg ${monthStats.warnings > 0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {monthStats.warnings > 0 ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              monthStats.warnings > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {monthStats.warnings > 0 ? 'Phát hiện cảnh báo' : 'Vận hành tối ưu'}
            </span>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">Đơn vị Vượt định mức</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {monthStats.warnings} <span className="text-sm font-normal text-slate-500">vụ việc</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span className="text-amber-500 font-semibold">Điện: {monthStats.elecWarningsCount}</span>
              <span className="text-blue-500 font-semibold">Nước: {monthStats.waterWarningsCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts & Warnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Company Trend Line Dashboard */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Xu hướng tiêu thụ trong năm {selectedYear}</h3>
              <p className="text-xs text-slate-400">Tổng hợp lượng điện (kWh) và nước (m³) theo chu kỳ các tháng</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span>Điện (kWh)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>Nước (m³)</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {monthlyTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#d97706" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Điện (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#d97706', fontSize:9 }, offset: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#2563eb" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Nước (m³)', angle: 90, position: 'insideRight', style: { fill: '#2563eb', fontSize:9 }, offset: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#334155' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="Điện (kWh)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorElec)" />
                  <Area yAxisId="right" type="monotone" dataKey="Nước (m³)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWater)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu thống kê cho năm {selectedYear}</div>
            )}
          </div>
        </div>

        {/* Over-threshold lists & Warnings in Selected Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Vấn đề Đột biến (Tháng {selectedMonth}/{selectedYear})</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${overThresholdUnits.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {overThresholdUnits.length} vụ vượt ngưỡng
              </span>
            </div>

            {overThresholdUnits.length > 0 ? (
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {overThresholdUnits.map(({ unit, r, elecExceeded, waterExceeded, elecPct, waterPct }) => (
                  <div key={unit.id} className="p-3 bg-rose-50/40 rounded-lg border border-rose-100 hover:bg-rose-50 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-sm">{unit.name}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 rounded uppercase">{unit.code}</span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-xs">
                      {elecExceeded && (
                        <div className="flex items-center justify-between text-rose-600">
                          <span className="flex items-center gap-1 font-medium"><Zap className="h-3 w-3 fill-amber-100" /> Vượt điện:</span>
                          <span className="font-bold">+{elecPct}% ({r.elecConsumed.toLocaleString()} / {unit.electricityThreshold.toLocaleString()} kWh)</span>
                        </div>
                      )}
                      
                      {waterExceeded && (
                        <div className="flex items-center justify-between text-blue-600">
                          <span className="flex items-center gap-1 font-medium"><Droplet className="h-3 w-3 fill-blue-50" /> Vượt nước:</span>
                          <span className="font-bold text-rose-600">+{waterPct}% ({r.waterConsumed.toLocaleString()} / {unit.waterThreshold.toLocaleString()} m³)</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between bg-white px-2 py-1 rounded">
                      <span>Phụ trách: {unit.headOfUnit}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Hệ thống đã gửi SMS/Email</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-500">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Tất cả an toàn!</p>
                <p className="text-xs text-slate-400 max-w-[200px]">Mức tiêu thụ toàn bộ các thành viên thuộc công ty tổng đều nằm trong hạn mức cho phép.</p>
              </div>
            )}
          </div>

          <button 
            id="view-alerts-btn"
            onClick={() => onNavigateToTab('alerts')}
            className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold py-2.5 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1 shadow-sm"
          >
            Xem lịch sử gửi cảnh báo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Grid comparing consumption sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Compare Chart Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base">So sánh chỉ số các đơn vị</h3>
              <p className="text-xs text-slate-400">Lượng điện và nước tiêu thụ so với ngưỡng an toàn quy hoạch (Tháng {selectedMonth}/{selectedYear})</p>
            </div>
          </div>

          <div className="h-80 w-full">
            {unitComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} />
                  <Bar dataKey="Điện tiêu thụ" fill="#fbbf24" name="Điện sử dụng (kWh)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ngưỡng điện" fill="#fef3c7" name="Hạn mức Điện (kWh)" stroke="#fbbf24" strokeDasharray="3 3" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Nước tiêu thụ" fill="#3b82f6" name="Nước sử dụng (m³)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ngưỡng nước" fill="#dbeafe" name="Hạn mức Nước (m³)" stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có chỉ số của đơn vị nào ghi nhận trong tháng này</div>
            )}
          </div>
        </div>

        {/* Quick summary of highest spending and action log */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Hoạt động Cảnh báo gần đây</h3>
              <div className="flex items-center gap-1.5">
                {recentAlerts.length > 0 && (
                  <button
                    onClick={() => setIsClearAlertsModalOpen(true)}
                    className="text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded font-bold transition flex items-center gap-0.5 cursor-pointer"
                    title="Xóa toàn bộ cảnh báo"
                  >
                    <Trash2 className="h-2.5 w-2.5" /> Xóa sạch
                  </button>
                )}
                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                  <Activity className="h-3 w-3" /> Realtime logs
                </span>
              </div>
            </div>

            {recentAlerts.length > 0 ? (
              <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="text-xs space-y-1.5 border-l-2 border-amber-400 pl-3 py-0.5 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{alert.unitName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400">{new Date(alert.sentAt).toLocaleTimeString('vi-VN')}</span>
                        <button
                          onClick={() => onDeleteAlert(alert.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                          title="Tắt / Xóa cảnh báo này"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed pr-4">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-amber-500/10 text-amber-700 px-1 py-0.2 rounded-md font-semibold">Tháng {alert.month}/{alert.year}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-md">SMS & Email</span>
                      <span className="ml-auto text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Đã gửi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3.5 bg-slate-50 rounded-full text-slate-400">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Chưa ghi nhận thông báo nào cho kỳ này</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-3 rounded-lg border border-teal-100/60 mt-4 font-sans">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Hệ thống Cảnh báo tự động hoạt động
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal animate-pulse">
              Khi bạn ghi nhận chỉ số mới vượt ngưỡng tại tab Nhập chỉ số, hệ thống sẽ tự động phát sinh Email/SMS gửi thẳng tới Trưởng Đơn vị thành viên quản lý.
            </p>
          </div>
        </div>

      </div>

      {/* Confirmation modal for clearing all alerts */}
      <ConfirmationModal
        isOpen={isClearAlertsModalOpen}
        title="Xác nhận xóa sạch nhật ký cảnh báo"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử gửi thông tin cảnh báo trên hệ thống? Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục."
        confirmText="Đồng ý xóa sạch"
        cancelText="Quay lại"
        onConfirm={() => {
          onClearAllAlerts();
          setIsClearAlertsModalOpen(false);
        }}
        onCancel={() => setIsClearAlertsModalOpen(false)}
        type="danger"
      />

    </div>
  );
}
