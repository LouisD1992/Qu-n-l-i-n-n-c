import React, { useState, useEffect } from 'react';
import { MemberUnit, Reading, AlertLog, SystemConfig } from './types';
import { 
  INITIAL_UNITS, 
  INITIAL_READINGS, 
  INITIAL_ALERTS, 
  DEFAULT_CONFIG 
} from './mockData';
import Dashboard from './components/Dashboard';
import UnitsTab from './components/UnitsTab';
import ReadingsTab from './components/ReadingsTab';
import AlertsTab from './components/AlertsTab';
import { 
  BarChart3, 
  Building2, 
  ClipboardEdit, 
  BellRing, 
  Droplets, 
  Zap, 
  Clock, 
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // --- Core States ---
  const [units, setUnits] = useState<MemberUnit[]>(() => {
    const saved = localStorage.getItem('utility_units');
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  const [readings, setReadings] = useState<Reading[]>(() => {
    const saved = localStorage.getItem('utility_readings');
    return saved ? JSON.parse(saved) : INITIAL_READINGS;
  });

  const [alerts, setAlerts] = useState<AlertLog[]>(() => {
    const saved = localStorage.getItem('utility_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('utility_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  // --- Local Persistence Synchronization ---
  useEffect(() => {
    localStorage.setItem('utility_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('utility_readings', JSON.stringify(readings));
  }, [readings]);

  useEffect(() => {
    localStorage.setItem('utility_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('utility_config', JSON.stringify(config));
  }, [config]);

  // --- Member Units Actions ---
  const handleAddUnit = (newUnitData: Omit<MemberUnit, 'id'>) => {
    const newUnit: MemberUnit = {
      ...newUnitData,
      id: `unit-${Date.now()}`
    };
    setUnits(prev => [...prev, newUnit]);
  };

  const handleUpdateUnit = (updatedUnit: MemberUnit) => {
    setUnits(prev => prev.map(unit => unit.id === updatedUnit.id ? updatedUnit : unit));
  };

  const handleDeleteUnit = (id: string) => {
    // Delete unit profile
    setUnits(prev => prev.filter(unit => unit.id !== id));
    // Cascade-delete index readings for that unit
    setReadings(prev => prev.filter(reading => reading.unitId !== id));
    // Clean related alert logs
    setAlerts(prev => prev.filter(alert => alert.unitId !== id));
  };

  // --- Readings Actions ---
  const handleAddReading = (newReadingData: Omit<Reading, 'id' | 'elecConsumed' | 'waterConsumed' | 'elecCost' | 'waterCost' | 'isElecWarning' | 'isWaterWarning' | 'submittedAt'>) => {
    const unit = units.find(u => u.id === newReadingData.unitId);
    if (!unit) return;

    // Calculations
    const elecConsumed = newReadingData.elecCurrent - newReadingData.elecPrev;
    const waterConsumed = newReadingData.waterCurrent - newReadingData.waterPrev;

    const elecCost = elecConsumed * unit.electricityPrice;
    const waterCost = waterConsumed * unit.waterPrice;

    const isElecWarning = elecConsumed > unit.electricityThreshold;
    const isWaterWarning = waterConsumed > unit.waterThreshold;

    const newReading: Reading = {
      ...newReadingData,
      id: `r-${Date.now()}`,
      elecConsumed,
      waterConsumed,
      elecCost,
      waterCost,
      isElecWarning,
      isWaterWarning,
      submittedAt: new Date().toISOString()
    };

    setReadings(prev => [newReading, ...prev]);

    // Handle automated alert logging if threshold is violated
    if (config.automaticAlertEnabled && (isElecWarning || isWaterWarning)) {
      let alertMsg = '';
      let type: 'electricity' | 'water' | 'both' = 'electricity';

      if (isElecWarning && isWaterWarning) {
        type = 'both';
        alertMsg = `Cảnh báo tự động: Đơn vị thành viên "${unit.name}" đã vượt ngưỡng tiêu thụ năng lượng của Tháng ${newReadingData.month}/${newReadingData.year} trên cả hai hạng mục Điện (${elecConsumed.toLocaleString()} / ${unit.electricityThreshold.toLocaleString()} kWh) và Nước (${waterConsumed.toLocaleString()} / ${unit.waterThreshold.toLocaleString()} m³).`;
      } else if (isElecWarning) {
        type = 'electricity';
        alertMsg = `Cảnh báo tự động: Đơn vị thành viên "${unit.name}" đã vượt ngưỡng tiêu thụ ĐIỆN NĂNG của Tháng ${newReadingData.month}/${newReadingData.year} với mức sử dụng đạt ${elecConsumed.toLocaleString()} kWh (vượt ngưỡng cho phép ${unit.electricityThreshold.toLocaleString()} kWh, tức vượt +${Math.round(((elecConsumed - unit.electricityThreshold) / unit.electricityThreshold)*100)}%).`;
      } else {
        type = 'water';
        alertMsg = `Cảnh báo tự động: Đơn vị thành viên "${unit.name}" đã vượt ngưỡng chỉ tiêu NƯỚC SẠCH của Tháng ${newReadingData.month}/${newReadingData.year} với mức sử dụng đạt ${waterConsumed.toLocaleString()} m³ (vượt ngưỡng cho phép ${unit.waterThreshold.toLocaleString()} m³, tức vượt +${Math.round(((waterConsumed - unit.waterThreshold) / unit.waterThreshold)*100)}%).`;
      }

      const activeMethods: ('email' | 'sms' | 'system')[] = ['system'];
      if (unit.email) activeMethods.push('email');
      if (unit.phone) activeMethods.push('sms');

      const autoAlertLog: AlertLog = {
        id: `auto-alert-${Date.now()}`,
        unitId: unit.id,
        unitName: unit.name,
        month: newReadingData.month,
        year: newReadingData.year,
        type,
        consumedValue: isElecWarning ? elecConsumed : waterConsumed,
        thresholdValue: isElecWarning ? unit.electricityThreshold : unit.waterThreshold,
        percentageExceeded: isElecWarning 
          ? Math.round(((elecConsumed - unit.electricityThreshold) / unit.electricityThreshold) * 100)
          : Math.round(((waterConsumed - unit.waterThreshold) / unit.waterThreshold) * 100),
        methods: activeMethods,
        sentAt: new Date().toISOString(),
        status: 'sent',
        message: alertMsg
      };

      setAlerts(prev => [autoAlertLog, ...prev]);
    }
  };

  const handleDeleteReading = (id: string) => {
    setReadings(prev => prev.filter(reading => reading.id !== id));
  };

  const handleDeleteMultipleReadings = (ids: string[]) => {
    setReadings(prev => prev.filter(reading => !ids.includes(reading.id)));
  };

  // --- Alerts Actions ---
  const handleAddAlert = (newAlert: AlertLog) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const handleDeleteMultipleAlerts = (ids: string[]) => {
    setAlerts(prev => prev.filter(alert => !ids.includes(alert.id)));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  const handleUpdateConfig = (updatedConfig: SystemConfig) => {
    setConfig(updatedConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Upper Navigation Corporate Header */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="h-5.5 w-5.5 text-amber-300 fill-amber-300 absolute -top-1 -right-0.5" />
              <Droplets className="h-6 w-6 text-indigo-100" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest leading-none">Hệ thống Số liệu Tập đoàn</div>
              <h1 className="text-lg font-extrabold tracking-tight mt-1 text-slate-100 leading-snug">
                Quản lý & Thống kê Điện Nước Công ty Tổng
              </h1>
            </div>
          </div>

          {/* Quick status box */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-850 border border-slate-800 rounded-lg py-1.5 px-3.5 hidden sm:block">
              <span className="text-slate-400">Trạng thái phát cảnh báo:</span>
              <span className={`ml-1.5 font-bold ${config.automaticAlertEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                {config.automaticAlertEnabled ? '● Tự động (Active)' : '○ Thủ công (Manual)'}
              </span>
            </div>

            <div className="bg-slate-850 border border-slate-800 rounded-lg py-1.5 px-3.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-200 font-semibold text-center">Chu kỳ giám sát: 2026</span>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Navigation Tabs Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-1 scrollbar-none">
            
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" /> Thống kê Tổng quan
            </button>

            <button
              id="tab-units"
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                activeTab === 'units'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Building2 className="h-4.5 w-4.5" /> Đơn vị Thành viên
            </button>

            <button
              id="tab-readings"
              onClick={() => setActiveTab('readings')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                activeTab === 'readings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <ClipboardEdit className="h-4.5 w-4.5" /> Nhập & Quản lý Chỉ số
            </button>

            <button
              id="tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
                activeTab === 'alerts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <BellRing className="h-4.5 w-4.5 animate-pulse" /> Giám sát Cảnh báo
            </button>

          </div>
        </div>
      </nav>

      {/* Main Container Stage wrapper with transition animations */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                units={units} 
                readings={readings} 
                alerts={alerts} 
                onDeleteAlert={handleDeleteAlert}
                onClearAllAlerts={handleClearAllAlerts}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activeTab === 'units' && (
              <UnitsTab 
                units={units} 
                onAddUnit={handleAddUnit}
                onUpdateUnit={handleUpdateUnit}
                onDeleteUnit={handleDeleteUnit}
              />
            )}

            {activeTab === 'readings' && (
              <ReadingsTab 
                units={units}
                readings={readings}
                onAddReading={handleAddReading}
                onDeleteReading={handleDeleteReading}
                onDeleteMultipleReadings={handleDeleteMultipleReadings}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsTab 
                units={units}
                alerts={alerts}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onAddAlert={handleAddAlert}
                onDeleteAlert={handleDeleteAlert}
                onDeleteMultipleAlerts={handleDeleteMultipleAlerts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Branding Area */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-850 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <div className="space-y-1">
              <div className="font-extrabold text-slate-200">
                ỦY BAN QUẢN LÝ TIẾT KIỆM NĂNG LƯỢNG - TẬP ĐOÀN CÔNG NGHIỆP THÀNH CÔNG
              </div>
              <p className="text-slate-500">
                Giải pháp giám sát hiệu suất điện nước nội bộ, phòng ngừa hao phí hạ tầng, tối ưu hóa ngân sách vận hành tập đoàn.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 select-none">
              <HeartHandshake className="h-4 w-4" />
              <span>An toàn • Tiết kiệm • Hiệu năng</span>
            </div>

          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-850/60 text-slate-500 text-center flex flex-col sm:flex-row justify-between gap-2.5">
            <span>© 2026 Thành Công Group. Hệ thống định tuyến cảnh báo nội bộ SMS/Email.</span>
            <span>Phiên bản 4.3.0 Stable Dashboard</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
