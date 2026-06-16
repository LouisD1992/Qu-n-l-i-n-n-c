import React, { useState, useMemo } from 'react';
import { MemberUnit, AlertLog, SystemConfig } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Bell, 
  Send, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Search, 
  AlertTriangle, 
  Mail, 
  Smartphone, 
  Building, 
  Info, 
  Sliders, 
  Play,
  Clock,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';

interface AlertsTabProps {
  units: MemberUnit[];
  alerts: AlertLog[];
  config: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  onAddAlert: (alert: AlertLog) => void;
  onDeleteAlert: (id: string) => void;
  onDeleteMultipleAlerts: (ids: string[]) => void;
}

export default function AlertsTab({ units, alerts, config, onUpdateConfig, onAddAlert, onDeleteAlert, onDeleteMultipleAlerts }: AlertsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<'logs' | 'settings'>('logs');

  // Selection states
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<AlertLog | null>(null);

  // Sandbox testing variables
  const [testUnitId, setTestUnitId] = useState('');
  const [testUtilityType, setTestUtilityType] = useState<'electricity' | 'water'>('electricity');
  const [testValue, setTestValue] = useState<string>('');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Alert Config State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'danger' | 'warning' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  // Toggle helpers
  const handleToggleAutoAlert = () => {
    onUpdateConfig({
      ...config,
      automaticAlertEnabled: !config.automaticAlertEnabled
    });
  };

  const handleToggleNotifyHead = () => {
    onUpdateConfig({
      ...config,
      notifyHeadOfUnit: !config.notifyHeadOfUnit
    });
  };

  // Search filter logs
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(a => {
        const matchSearch = a.unitName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()); // Newest first
  }, [alerts, searchTerm]);

  // Dispatch statistics
  const alertStats = useMemo(() => {
    const total = alerts.length;
    const emailCount = alerts.filter(a => a.methods.includes('email')).length;
    const smsCount = alerts.filter(a => a.methods.includes('sms')).length;
    
    // Group monthly
    let powerAlerts = alerts.filter(a => a.type === 'electricity' || a.type === 'both').length;
    let waterAlerts = alerts.filter(a => a.type === 'water' || a.type === 'both').length;

    return {
      total,
      emailCount,
      smsCount,
      powerAlerts,
      waterAlerts,
      successRate: total > 0 ? 100 : 0 // Since it is mock simulated, all are 100% delivered status
    };
  }, [alerts]);

  // Sandbox simulation execution
  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUnitId || !testValue) {
      setAlertConfig({
        isOpen: true,
        title: 'Thiếu thông số thử nghiệm',
        message: 'Vui lòng chọn đơn vị thành viên và điền giá trị tiêu thụ giả định trước khi chạy thử nghiệm!',
        type: 'warning'
      });
      return;
    }

    const unit = units.find(u => u.id === testUnitId);
    if (!unit) return;

    const valStr = Number(testValue);
    if (isNaN(valStr) || valStr <= 0) {
      setAlertConfig({
        isOpen: true,
        title: 'Giá trị không hợp lệ',
        message: 'Vui lòng điền giá trị đo tiêu thụ là số hữu dụng lớn hơn 0!',
        type: 'warning'
      });
      return;
    }

    const electricityThreshold = unit.electricityThreshold;
    const waterThreshold = unit.waterThreshold;

    const isElectricity = testUtilityType === 'electricity';
    const limit = isElectricity ? electricityThreshold : waterThreshold;
    const unitSymbol = isElectricity ? 'kWh' : 'm³';
    const label = isElectricity ? 'Điện' : 'Nước';

    const exceededValue = valStr - limit;
    const percentage = Math.round((exceededValue / limit) * 100);

    let finalMessage = '';
    let isWarning = valStr > limit;

    if (isWarning) {
      finalMessage = `CẢNH BÁO THỬ NGHIỆM: Mức tiêu thụ ${label} của đơn vị "${unit.name}" mô phỏng đạt ${valStr.toLocaleString()} ${unitSymbol}, vượt quá hạn mức ${limit.toLocaleString()} ${unitSymbol} (+${percentage}%).`;
    } else {
      finalMessage = `THỐNG TIN THỬ NGHIỆM: Tiêu thụ ${label} của đơn vị "${unit.name}" đạt ${valStr.toLocaleString()} ${unitSymbol}, nằm trong hạn mức an toàn ${limit.toLocaleString()} ${unitSymbol} (Đạt ${Math.round((valStr/limit)*100)}%).`;
    }

    // Prepare list of alert log record
    const newLog: AlertLog = {
      id: `sim-alert-${Date.now()}`,
      unitId: unit.id,
      unitName: unit.name,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      type: isElectricity ? 'electricity' : 'water',
      consumedValue: valStr,
      thresholdValue: limit,
      percentageExceeded: isWarning ? percentage : 0,
      methods: isWarning ? ['email', 'sms', 'system'] : ['system'],
      sentAt: new Date().toISOString(),
      status: 'sent',
      message: finalMessage
    };

    onAddAlert(newLog);

    // Prompt detailed response animation
    setTestSuccessMessage(`Hệ thống đã kích hoạt tiến trình xử lý thông tin! 
    - ${isWarning ? '⚠️ Đã gửi khẩn cấp SMS/Email tới Trưởng đơn vị ' + unit.headOfUnit + ' do chỉ số vượt hạn mức.' : '✅ Chỉ số an toàn, hệ thống ghi sổ bình thường.'}
    Thử nghiệm thành công! Bản ghi đã được cập nhật vào Nhật ký.`);

    // Clear simulation inputs
    setTestValue('');
    setTestUnitId('');
    
    setTimeout(() => {
      setTestSuccessMessage(null);
    }, 9000);
  };

  return (
    <div id="alerts-view" className="space-y-6">
      
      {/* Tab Header & Quick Navigation Segment Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Trung tâm Cảnh báo Thống kê</h2>
          <p className="text-sm text-slate-500">Giám sát kịch bản tự động gửi thông báo SMS, Email và tùy biến tham số ngưỡng</p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 self-start sm:self-auto text-sm">
          <button 
            id="show-logs-tab"
            onClick={() => setActiveSegment('logs')}
            className={`px-4 py-1.8 font-semibold rounded-md transition-all cursor-pointer ${
              activeSegment === 'logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            Nhật ký Gửi cảnh báo
          </button>
          <button 
            id="show-settings-tab"
            onClick={() => setActiveSegment('settings')}
            className={`px-4 py-1.8 font-semibold rounded-md transition-all cursor-pointer ${
              activeSegment === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            Cấu hình Toàn cục
          </button>
        </div>
      </div>

      {/* Conditionally render Tab Segment Content */}
      {activeSegment === 'logs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Panel: Stats and Sandbox Alert Simulator */}
          <div className="space-y-5 lg:col-span-1">
            
            {/* Quick Metrics */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <Info className="h-4.5 w-4.5 text-indigo-500" /> Bản đồ hóa Thông báo
              </h3>
              
              <div className="grid grid-cols-2 gap-3.5 pt-1 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-slate-800">{alertStats.total}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Đã tự động gửi</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-2xl font-bold text-emerald-600">{alertStats.successRate}%</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Giao nhận SMS/Mail</p>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-1.5 text-slate-600 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" /> Qua thư điện tử (Email):
                  </span>
                  <span className="font-bold">{alertStats.emailCount} lượt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Smartphone className="h-3.5 w-3.5 text-teal-600" /> Qua di động (SMS):
                  </span>
                  <span className="font-bold">{alertStats.smsCount} lượt</span>
                </div>
              </div>
            </div>

            {/* Warning Sandbox simulator */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl shadow-lg border border-indigo-950 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-3 translate-y-3">
                <Sparkles className="h-44 w-44" />
              </div>
              
              <div>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Cảnh báo Sandbox / Simulator</span>
                <h3 className="font-bold text-white text-base mt-1.5 flex items-center gap-1.5">
                  <Play className="h-4 w-4 fill-white text-indigo-400" /> Chạy thử Nghiệm Hạn mức
                </h3>
                <p className="text-indigo-250 text-xs mt-1">Vận hành quy trình kiểm thử gửi thông báo thủ công để nghiệm thu trạng thái hệ thống.</p>
              </div>

              {testSuccessMessage ? (
                <div className="bg-indigo-950/60 p-4 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 animate-in fade-in duration-300 whitespace-pre-line">
                  {testSuccessMessage}
                  <button 
                    onClick={() => setTestSuccessMessage(null)}
                    className="w-full mt-3 bg-indigo-600 text-white font-bold text-[10px] py-1.5 rounded hover:bg-slate-700 cursor-pointer text-center"
                  >
                    Tiếp tục chạy thử nghiệm khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRunSimulation} className="space-y-3 pt-2">
                  {/* Select unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-indigo-200">Đơn vị muốn gửi thử nghiệm</label>
                    <select 
                      id="sim-unit-select"
                      value={testUnitId}
                      onChange={(e) => setTestUnitId(e.target.value)}
                      className="w-full bg-indigo-950 border border-indigo-800 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 select-white"
                      required
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} (Đ.mức Điện:{u.electricityThreshold}kWh)</option>
                      ))}
                    </select>
                  </div>

                  {/* Select type */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-indigo-200">Chỉ số muốn mô phỏng</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button 
                        type="button"
                        onClick={() => setTestUtilityType('electricity')}
                        className={`py-1.5 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                          testUtilityType === 'electricity' 
                            ? 'bg-amber-500 text-white border-amber-500 shadow'
                            : 'border-indigo-800 bg-indigo-954 text-indigo-300 hover:bg-indigo-900'
                        }`}
                      >
                        ⚡ Điện năng (kWh)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setTestUtilityType('water')}
                        className={`py-1.5 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                          testUtilityType === 'water' 
                            ? 'bg-blue-550 text-white border-blue-550 shadow'
                            : 'border-indigo-800 bg-indigo-954 text-indigo-300 hover:bg-indigo-900'
                        }`}
                      >
                        💧 Nước sạch (m³)
                      </button>
                    </div>
                  </div>

                  {/* Utility value */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-indigo-200">Giá trị đo lường nhập vào</label>
                    <input 
                      type="number"
                      id="sim-value-input"
                      placeholder="Mức đo, ví dụ: 17500"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      className="w-full bg-indigo-950 border border-indigo-800 text-white text-xs px-3 py-1.8 rounded-lg placeholder:text-indigo-400 focus:outline-none"
                      required
                    />
                    <p className="text-[9px] text-indigo-300/80">
                      * Nhập cao hơn định mức của đơn vị để xem kịch bản kích hoạt thông báo khẩn cấp SMS/Email.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2.5 bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-xs py-2 rounded-lg hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Gửi Thử nghiệm Cảnh báo
                  </button>

                </form>
              )}
            </div>

          </div>

          {/* Right Panel: Alert Logs */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search tool */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  id="alert-search"
                  placeholder="Kiểm tra bộ lọc nhật ký..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.8 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <span className="text-slate-400 text-xs">Phát hiện: {filteredAlerts.length} bản ghi</span>
            </div>

            {/* List log container */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filteredAlerts.length > 0 && filteredAlerts.every(log => selectedAlertIds.includes(log.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAlertIds(prev => {
                          const newSet = new Set([...prev, ...filteredAlerts.map(l => l.id)]);
                          return Array.from(newSet);
                        });
                      } else {
                        setSelectedAlertIds(prev => {
                          const filteredIds = filteredAlerts.map(l => l.id);
                          return prev.filter(id => !filteredIds.includes(id));
                        });
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    title="Chọn tất cả"
                  />
                  <h3 className="font-bold text-slate-800 text-sm">Lịch sử hệ thống phát cảnh báo tự động</h3>
                </div>
                {selectedAlertIds.length > 0 ? (
                  <button
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm shadow-rose-600/10 cursor-pointer transition-all"
                  >
                    <Trash2 className="h-3 w-3" /> Xóa nhanh ({selectedAlertIds.length})
                  </button>
                ) : (
                  <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Chu kỳ 2026 realtime
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map(log => (
                    <div 
                      key={log.id} 
                      className={`p-4.5 hover:bg-slate-50/50 transition-all space-y-2.5 relative group ${
                        selectedAlertIds.includes(log.id) ? 'bg-indigo-50/20 hover:bg-indigo-50/35' : ''
                      }`}
                    >
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedAlertIds.includes(log.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAlertIds(prev => [...prev, log.id]);
                              } else {
                                setSelectedAlertIds(prev => prev.filter(id => id !== log.id));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{log.unitName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            log.type === 'electricity' 
                              ? 'bg-amber-100 text-amber-700' 
                              : (log.type === 'water' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700')
                          }`}>
                            {log.type === 'electricity' ? 'Điện năng' : (log.type === 'water' ? 'Nước sạch' : 'Cả hai')}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 flex items-center gap-3 justify-between sm:justify-start">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.sentAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <button
                            onClick={() => setAlertToDelete(log)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Xóa cảnh báo này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 border border-slate-200/50 rounded-lg leading-relaxed font-mono">
                        {log.message}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-medium">Hình thức:</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            {log.methods.map(method => (
                              <span key={method} className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5 whitespace-nowrap">
                                {method === 'email' && <Mail className="h-2.5 w-2.5 text-indigo-500" />}
                                {method === 'sms' && <Smartphone className="h-2.5 w-2.5 text-teal-600" />}
                                {method === 'system' && <Building className="h-2.5 w-2.5 text-slate-500" />}
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>

                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Đã thông báo
                        </span>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Info className="h-8 w-8 mx-auto text-slate-350" />
                    <p className="text-sm font-semibold">Chưa tìm thấy nhật ký cảnh báo nào</p>
                    <p className="text-xs text-slate-450">Các thông báo tự động vượt định mức sẽ tự sinh ra ở đây.</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Configuration Parameters panel */
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm max-w-4xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" /> Cài đặt hệ thống Cảnh báo tự động
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Điều chỉnh các thông số và hành vi khi phát hiện lượng hao phí vượt quá giới hạn thiết lập của từng đơn vị
            </p>
          </div>

          <div className="space-y-5">
            
            {/* Control 1: Auto switch toggle alerts */}
            <div className="flex items-start justify-between gap-4 p-4.5 bg-slate-50 rounded-lg border border-slate-100/60">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Bật kịch bản viễn thông tự động (SMS / Email)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Khi người vận hành ghi nhận chỉ số điện/nước cuối kỳ, hệ thống sẽ chạy chương trình so sánh lập quy. Nếu vượt định mức cho phép, máy chủ tự phát đi Email & SMS lập tức đến người đại diện đơn vị đó.
                </p>
              </div>

              <button 
                id="toggle-auto-alert"
                onClick={handleToggleAutoAlert}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.automaticAlertEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.automaticAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Control 2: Notify Heads */}
            <div className="flex items-start justify-between gap-4 p-4.5 bg-slate-50 rounded-lg border border-slate-100/60">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Kèm luồng thông báo cho Thư ký văn phòng công ty Tổng</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ngăn chặn tình trạng thất thoát kéo dài bằng việc đồng thời gửi email cảnh báo tới Ban Kiểm Soát năng lượng tại văn phòng tổng công ty để theo dõi trực tiếp.
                </p>
              </div>

              <button 
                id="toggle-notify-head"
                onClick={handleToggleNotifyHead}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.notifyHeadOfUnit ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.notifyHeadOfUnit ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Default prices info config fields */}
            <div className="space-y-3.5 pt-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sliders className="h-4 w-4" /> Đơn giá Điện Nước mặc định khi Khởi tạo mới
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Điện năng gốc mặc định (VND/kWh)</label>
                  <input 
                    type="number"
                    value={config.defaultElectricityPrice}
                    onChange={(e) => onUpdateConfig({ ...config, defaultElectricityPrice: Number(e.target.value) })}
                    className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Nước sạch gốc mặc định (VND/m³)</label>
                  <input 
                    type="number"
                    value={config.defaultWaterPrice}
                    onChange={(e) => onUpdateConfig({ ...config, defaultWaterPrice: Number(e.target.value) })}
                    className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Note about actual implementation integration */}
          <div className="bg-amber-50 p-4 border border-amber-200/50 rounded-lg flex gap-3 text-xs text-amber-855">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Lưu ý tích hợp viễn thông trong vận hành thực tế:</p>
              <p className="leading-relaxed">
                Để triển khai gửi Email thật, hệ thống cần cấu hình thông số SMTP hoặc SendGrid API. Với đường truyền SMS tự động, hệ thống sử dụng kết nối SMS Gateway (như Twilio, ESMS hoặc SpeedSMS) để phát đi tin nhắn trực tiếp đến chiếc điện thoại cá nhân của Trưởng đơn vị.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modal xác nhận xóa một nhật ký cảnh báo */}
      <ConfirmationModal
        isOpen={alertToDelete !== null}
        title="Xác nhận xóa nhật ký cảnh báo"
        message={`Bạn có chắc muốn xóa nhật ký cảnh báo gửi tới ${alertToDelete?.unitName} vào lúc ${alertToDelete ? new Date(alertToDelete.sentAt).toLocaleString('vi-VN') : ''} không? \nDữ liệu nhật ký này sẽ bị xóa khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          if (alertToDelete) {
            onDeleteAlert(alertToDelete.id);
            setSelectedAlertIds(prev => prev.filter(id => id !== alertToDelete.id));
            setAlertToDelete(null);
          }
        }}
        onCancel={() => setAlertToDelete(null)}
        type="danger"
      />

      {/* Modal xác nhận xóa hàng loạt nhật ký cảnh báo */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        title="Xác nhận xóa nhiều nhật ký"
        message={`Bạn có chắc muốn xóa ${selectedAlertIds.length} nhật ký cảnh báo đã chọn không? \nThao tác này không thể khôi phục.`}
        confirmText="Xác nhận xóa sạch"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          onDeleteMultipleAlerts(selectedAlertIds);
          setSelectedAlertIds([]);
          setIsBulkDeleteModalOpen(false);
        }}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        type="danger"
      />

      {/* Modal cảnh báo và thông tin */}
      <ConfirmationModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="Đồng ý"
        onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
      />

    </div>
  );
}
