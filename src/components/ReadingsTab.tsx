import React, { useState, useMemo } from 'react';
import { MemberUnit, Reading } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  Trash2, 
  Search, 
  Zap, 
  Droplet, 
  Calendar, 
  ChevronDown, 
  AlertTriangle, 
  Calculator, 
  HelpCircle,
  FileSpreadsheet,
  Building2,
  BellRing,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface ReadingsTabProps {
  units: MemberUnit[];
  readings: Reading[];
  onAddReading: (reading: Omit<Reading, 'id' | 'elecConsumed' | 'waterConsumed' | 'elecCost' | 'waterCost' | 'isElecWarning' | 'isWaterWarning' | 'submittedAt'>) => void;
  onDeleteReading: (id: string) => void;
  onDeleteMultipleReadings: (ids: string[]) => void;
}

export default function ReadingsTab({ units, readings, onAddReading, onDeleteReading, onDeleteMultipleReadings }: ReadingsTabProps) {
  // Filter variables
  const [filterUnitId, setFilterUnitId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(2026);

  // Form State
  const [unitId, setUnitId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // Current month placeholder
  const [year, setYear] = useState<number>(2026);
  
  const [elecPrev, setElecPct] = useState<string>('');
  const [elecCurrent, setElecCurrent] = useState<string>('');
  const [waterPrev, setWaterPrev] = useState<string>('');
  const [waterCurrent, setWaterCurrent] = useState<string>('');

  // Bulk Selection States
  const [selectedReadingIds, setSelectedReadingIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Confirmation & Alert States
  const [readingToDelete, setReadingToDelete] = useState<Reading | null>(null);
  const [overwriteConfirm, setOverwriteConfirm] = useState<{
    isOpen: boolean;
    duplicateId: string;
    newData: Omit<Reading, 'id' | 'elecConsumed' | 'waterConsumed' | 'elecCost' | 'waterCost' | 'isElecWarning' | 'isWaterWarning' | 'submittedAt'> | null;
  }>({
    isOpen: false,
    duplicateId: '',
    newData: null,
  });
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

  // Toast / Simulation Alert State
  const [simulatedAlert, setSimulatedAlert] = useState<{
    show: boolean;
    unitName: string;
    headOfUnit: string;
    email: string;
    phone: string;
    type: 'electricity' | 'water' | 'both';
    elecVal?: number;
    elecThreshold?: number;
    waterVal?: number;
    waterThreshold?: number;
  } | null>(null);

  // Auto-fill previous readings when user selects a unit
  const handleUnitChange = (selectedId: string) => {
    setUnitId(selectedId);
    if (!selectedId) {
      setElecPct('');
      setWaterPrev('');
      return;
    }

    // Find latest reading for this unit to automatically suggest pre-filled values
    const unitReadings = readings
      .filter(r => r.unitId === selectedId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    if (unitReadings.length > 0) {
      const latest = unitReadings[0];
      setElecPct(latest.elecCurrent.toString());
      setWaterPrev(latest.waterCurrent.toString());
    } else {
      setElecPct('0');
      setWaterPrev('0');
    }
  };

  // Helper formater for currencies (VND)
  const formatVND = (value: number) => {
    return value.toLocaleString('vi-VN') + ' đ';
  };

  // List of filtered readings
  const filteredReadings = useMemo(() => {
    return readings
      .filter(r => {
        const matchUnit = filterUnitId === 'all' || r.unitId === filterUnitId;
        const matchMonth = filterMonth === 'all' || r.month === Number(filterMonth);
        const matchYear = r.year === filterYear;
        return matchUnit && matchMonth && matchYear;
      })
      .sort((a, b) => {
        if (a.month !== b.month) return b.month - a.month; // Month desc
        return a.unitId.localeCompare(b.unitId);
      });
  }, [readings, filterUnitId, filterMonth, filterYear]);

  // Dynamic preview calculations based on inputs
  const currentUnitConfig = useMemo(() => {
    return units.find(u => u.id === unitId) || null;
  }, [units, unitId]);

  const previewCalc = useMemo(() => {
    if (!currentUnitConfig) return null;
    
    const ep = Number(elecPrev) || 0;
    const ec = Number(elecCurrent) || 0;
    const wp = Number(waterPrev) || 0;
    const wc = Number(waterCurrent) || 0;

    const eConsumed = ec >= ep ? ec - ep : 0;
    const wConsumed = wc >= wp ? wc - wp : 0;

    const eCost = eConsumed * currentUnitConfig.electricityPrice;
    const wCost = wConsumed * currentUnitConfig.waterPrice;

    const isElecWarning = eConsumed > currentUnitConfig.electricityThreshold;
    const isWaterWarning = wConsumed > currentUnitConfig.waterThreshold;

    return {
      elecConsumed: eConsumed,
      waterConsumed: wConsumed,
      elecCost: eCost,
      waterCost: wCost,
      totalCost: eCost + wCost,
      isElecWarning,
      isWaterWarning,
      elecError: ec < ep,
      waterError: wc < wp
    };
  }, [currentUnitConfig, elecPrev, elecCurrent, waterPrev, waterCurrent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!unitId) {
      setAlertConfig({
        isOpen: true,
        title: 'Chưa chọn đơn vị',
        message: 'Vui lòng chọn một đơn vị thành viên để tiếp tục ghi nhận chỉ số!',
        type: 'warning'
      });
      return;
    }

    const ep = Number(elecPrev);
    const ec = Number(elecCurrent);
    const wp = Number(waterPrev);
    const wc = Number(waterCurrent);

    if (isNaN(ep) || isNaN(ec) || isNaN(wp) || isNaN(wc)) {
      setAlertConfig({
        isOpen: true,
        title: 'Nhập thiếu số liệu',
        message: 'Vui lòng nhập đầy đủ các chỉ số điện/nước và không bỏ trống!',
        type: 'warning'
      });
      return;
    }

    if (ec < ep) {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi chỉ số điện',
        message: 'LỖI: Chỉ số điện mới nhập không được nhỏ hơn chỉ số kỳ trước!',
        type: 'danger'
      });
      return;
    }

    if (wc < wp) {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi chỉ số nước',
        message: 'LỖI: Chỉ số nước mới nhập không được nhỏ hơn chỉ số kỳ trước!',
        type: 'danger'
      });
      return;
    }

    const newReadingData = {
      unitId,
      month,
      year,
      elecPrev: ep,
      elecCurrent: ec,
      waterPrev: wp,
      waterCurrent: wc,
    };

    const processReadingInsertion = () => {
      onAddReading(newReadingData);

      // Check violation alerts immediately to trigger simulated dispatch popups!
      const unit = units.find(u => u.id === unitId)!;
      const eConsumed = ec - ep;
      const wConsumed = wc - wp;
      const isElecWarning = eConsumed > unit.electricityThreshold;
      const isWaterWarning = wConsumed > unit.waterThreshold;

      if (isElecWarning || isWaterWarning) {
        setSimulatedAlert({
          show: true,
          unitName: unit.name,
          headOfUnit: unit.headOfUnit,
          email: unit.email,
          phone: unit.phone,
          type: isElecWarning && isWaterWarning ? 'both' : (isElecWarning ? 'electricity' : 'water'),
          elecVal: eConsumed,
          elecThreshold: unit.electricityThreshold,
          waterVal: wConsumed,
          waterThreshold: unit.waterThreshold
        });
      }

      // Clean inputs
      setElecPct('');
      setElecCurrent('');
      setWaterPrev('');
      setWaterCurrent('');
    };

    // Check duplicate month/year for the exact unit
    const duplicate = readings.find(r => r.unitId === unitId && r.month === month && r.year === year);
    if (duplicate) {
      setOverwriteConfirm({
        isOpen: true,
        duplicateId: duplicate.id,
        newData: newReadingData,
      });
      return;
    }

    processReadingInsertion();
  };

  return (
    <div id="readings-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Simulation toast of auto warning sent */}
      {simulatedAlert && simulatedAlert.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-rose-100 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                <BellRing className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">Cảnh báo Vượt ngưỡng Tự động</span>
                  <span className="text-[10px] text-zinc-400">Hệ thống gửi tự động</span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-base">Đã kích hoạt & gửi thông báo đến {simulatedAlert.unitName}!</h3>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ngay sau khi chỉ số vượt định mức được lưu ghi, hệ thống viễn thông và máy chủ thư của công ty tổng đã phát tín hiệu cảnh báo tới Trưởng đơn vị:
                </p>

                {/* Warning details template */}
                <div className="bg-rose-50/50 rounded-lg p-3.5 border border-rose-100/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đơn vị nhận:</span>
                    <span className="font-bold text-slate-700">{simulatedAlert.unitName} ({simulatedAlert.headOfUnit})</span>
                  </div>
                  
                  {simulatedAlert.type !== 'water' && (
                    <div className="flex justify-between items-center text-amber-800">
                      <span className="font-medium">⚠️ Lượng điện quá định mức:</span>
                      <span className="font-bold">{simulatedAlert.elecVal?.toLocaleString()} / {simulatedAlert.elecThreshold?.toLocaleString()} kWh</span>
                    </div>
                  )}

                  {simulatedAlert.type !== 'electricity' && (
                    <div className="flex justify-between items-center text-blue-800">
                      <span className="font-medium">💧 Lượng nước quá định mức:</span>
                      <span className="font-bold">{simulatedAlert.waterVal?.toLocaleString()} / {simulatedAlert.waterThreshold?.toLocaleString()} m³</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-rose-100/50 flex flex-col gap-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Đã gửi Email tới: <strong>{simulatedAlert.email || 'hung.nv@congty.com'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Đã gửi SMS tới SĐT: <strong>{simulatedAlert.phone || '0912xxxxxx'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setSimulatedAlert(null)}
                    className="px-4.5 py-1.8 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-rose-600/10"
                  >
                    Xác nhận & Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column 1: Reading Form entry */}
      <div className="lg:col-span-1 space-y-5">
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" /> Ghi nhận số liệu mới
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cần nhập chỉ số của đồng hồ đầu vào hoặc đo đạc của chu kỳ tháng</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Step 1: Select Unit and Cycle */}
            <div className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Đơn vị thành viên <span className="text-rose-500">*</span></label>
                <select 
                  id="entry-unit-select"
                  value={unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer bg-slate-50/50"
                  required
                >
                  <option value="">-- Chọn đơn vị thành viên --</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tháng chu kỳ</label>
                  <select 
                    id="entry-month"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Năm báo cáo</label>
                  <select 
                    id="entry-year"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Step 2: Index Values readings for electricity and water */}
            <div className="space-y-4 pt-1">
              
              {/* Electricity reads */}
              <div className="bg-amber-50/20 border border-amber-100/50 p-3 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-100" /> CHỈ SỐ ĐIỆN NĂNG (kWh)
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-slate-500">Chỉ số CŨ</label>
                    <input 
                      type="number" 
                      id="elec-prev"
                      placeholder="Số cũ"
                      value={elecPrev}
                      onChange={(e) => setElecPct(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-700 border border-slate-200 rounded bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-slate-500">Chỉ số MỚI <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      id="elec-curr"
                      placeholder="Số mới"
                      value={elecCurrent}
                      onChange={(e) => setElecCurrent(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs text-slate-700 border rounded bg-white ${
                        previewCalc?.elecError ? 'border-rose-500 ring-1 ring-rose-500/25' : 'border-slate-200'
                      }`}
                      required
                    />
                  </div>
                </div>
                {previewCalc?.elecError && (
                  <p className="text-[10px] font-medium text-rose-500">⚠️ Số mới nhỏ hơn số cũ!</p>
                )}
              </div>

              {/* Water reads */}
              <div className="bg-blue-50/20 border border-blue-100/50 p-3 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-800">
                  <Droplet className="h-4 w-4 text-blue-500 fill-blue-50" /> CHỈ SỐ NƯỚC SẠCH (m³)
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-slate-500">Chỉ số CŨ</label>
                    <input 
                      type="number" 
                      id="water-prev"
                      placeholder="Số cũ"
                      value={waterPrev}
                      onChange={(e) => setWaterPrev(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-700 border border-slate-200 rounded bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-slate-500">Chỉ số MỚI <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      id="water-curr"
                      placeholder="Số mới"
                      value={waterCurrent}
                      onChange={(e) => setWaterCurrent(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs text-slate-700 border rounded bg-white ${
                        previewCalc?.waterError ? 'border-rose-500 ring-1 ring-rose-500/25' : 'border-slate-200'
                      }`}
                      required
                    />
                  </div>
                </div>
                {previewCalc?.waterError && (
                  <p className="text-[10px] font-medium text-rose-500">⚠️ Số mới nhỏ hơn số cũ!</p>
                )}
              </div>

            </div>

            {/* Calculations Preview Pane */}
            {previewCalc && unitId && (
              <div className="bg-slate-50 rounded-lg p-3.5 space-y-2 border border-slate-200/50 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Tiền lượng ước tính</span>
                  <span className="text-indigo-600">Đơn vị: {currentUnitConfig?.code}</span>
                </div>
                
                {/* Electricity calc preview */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Điện đã dùng (kWh):</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{previewCalc.elecConsumed.toLocaleString()} kWh</span>
                    {previewCalc.isElecWarning && (
                      <span className="bg-rose-500 text-white font-bold text-[9px] px-1 py-0.2 rounded-md flex items-center gap-0.5" title="Vượt ngưỡng cảnh báo">
                        <AlertTriangle className="h-2.5 w-2.5" /> VƯỢT
                      </span>
                    )}
                  </div>
                </div>

                {/* Water calc preview */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nước đã dùng (m³):</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{previewCalc.waterConsumed.toLocaleString()} m³</span>
                    {previewCalc.isWaterWarning && (
                      <span className="bg-rose-500 text-white font-bold text-[9px] px-1 py-0.2 rounded-md flex items-center gap-0.5" title="Vượt ngưỡng cảnh báo">
                        <AlertTriangle className="h-2.5 w-2.5" /> VƯỢT
                      </span>
                    )}
                  </div>
                </div>

                {/* Costs preview */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-800 text-sm">
                  <span>Tổng tiền ước tính:</span>
                  <span className="text-indigo-600">{formatVND(previewCalc.totalCost)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={!unitId || !!previewCalc?.elecError || !!previewCalc?.waterError}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Ghi nhận & Lưu chỉ số
            </button>

          </form>
        </div>

        {/* Guidance and Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/60 text-xs text-slate-650 space-y-1.5">
          <h4 className="font-bold text-slate-800 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-500" /> Quy trình ghi nhận đúng đắn
          </h4>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Chọn đơn vị thành viên đúng với vị trí thực tế cần nhập.</li>
            <li>Hệ thống <strong>tự động lấy số mới kỳ trước</strong> điền vào làm <strong>số cũ kỳ này</strong> để tránh sai lệch của nhân viên nhập.</li>
            <li>Sau khi nhấn nút Lưu, nếu chỉ số sử dụng cuối tháng vượt quá hạn mức, hệ thống sẽ tự động kích hoạt kịch bản cảnh báo.</li>
          </ol>
        </div>

      </div>

      {/* Column 2: Historical list data grid table with filters */}
      <div className="lg:col-span-2 space-y-5">
        
        {/* Table filters */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4.5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter by unit */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span>Đơn vị:</span>
              <select 
                id="filter-unit"
                value={filterUnitId}
                onChange={(e) => setFilterUnitId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 text-xs rounded-md font-semibold focus:outline-none"
              >
                <option value="all">-- Tất cả đơn vị --</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Month */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span>Tháng:</span>
              <select 
                id="filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 text-xs rounded-md font-semibold focus:outline-none"
              >
                <option value="all">-- Tất cả tháng --</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>

            {/* Filter by Year */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span>Năm:</span>
              <select 
                id="filter-year"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 text-xs rounded-md font-semibold focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

          </div>

          {/* Export simulated action */}
          <button 
            id="export-csv-btn"
            onClick={() => setAlertConfig({
              isOpen: true,
              title: 'Xuất số liệu thành công!',
              message: 'Bản sao lưu Excel/CSV đã được chuẩn bị để tải xuống thành công trong hệ thống của bạn.',
              type: 'success'
            })}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs rounded-md border border-emerald-200 transition-all font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Xuất Excel
          </button>
        </div>

        {/* Readings table list */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          
          {selectedReadingIds.length > 0 ? (
            <div className="bg-indigo-50 px-5 py-3.5 border-b border-indigo-100 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-800">Đã chọn {selectedReadingIds.length} bản ghi chỉ số</span>
                <button
                  onClick={() => setSelectedReadingIds([])}
                  className="text-[10px] bg-slate-200 hover:bg-slate-350 text-slate-700 px-2 py-1 rounded font-bold transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-rose-600/10 cursor-pointer transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa hàng loạt ({selectedReadingIds.length})
              </button>
            </div>
          ) : (
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Lịch sử Ghi nhận Chỉ số ({filteredReadings.length} bản ghi)</h3>
              <span className="text-[11px] text-slate-400">Được liệt kê mới nhất lên trước</span>
            </div>
          )}

          <div className="overflow-x-auto">
            {filteredReadings.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={filteredReadings.length > 0 && filteredReadings.every(r => selectedReadingIds.includes(r.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReadingIds(prev => {
                              const newSet = new Set([...prev, ...filteredReadings.map(r => r.id)]);
                              return Array.from(newSet);
                            });
                          } else {
                            setSelectedReadingIds(prev => {
                              const filteredIds = filteredReadings.map(r => r.id);
                              return prev.filter(id => !filteredIds.includes(id));
                            });
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="py-3 px-4">Đơn vị thành viên</th>
                    <th className="py-3 px-3 text-center">Thời kỳ</th>
                    <th className="py-3 px-3 text-right">Điện năng (kWh)</th>
                    <th className="py-3 px-3 text-right">Nước dùng (m³)</th>
                    <th className="py-3 px-3 text-right">Tổng chi phí</th>
                    <th className="py-3 px-4 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 text-slate-650">
                  {filteredReadings.map(reading => {
                    const unit = units.find(u => u.id === reading.unitId);
                    
                    return (
                      <tr 
                        key={reading.id} 
                        className={`hover:bg-slate-50/70 transition-all ${
                          selectedReadingIds.includes(reading.id) ? 'bg-indigo-50/25 hover:bg-indigo-50/40' : ''
                        }`}
                      >
                        {/* Core checkbox to select */}
                        <td className="py-3.5 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedReadingIds.includes(reading.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReadingIds(prev => [...prev, reading.id]);
                              } else {
                                setSelectedReadingIds(prev => prev.filter(id => id !== reading.id));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Unit name */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{unit?.name || 'Đơn vị ẩn'}</div>
                          <div className="text-[10px] text-slate-400 uppercase mt-0.5">{unit?.code} • Trưởng đ.vị: {unit?.headOfUnit}</div>
                        </td>
                        
                        {/* Time period */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                            T.{reading.month}/{reading.year}
                          </span>
                        </td>
 
                        {/* Electricity index and usage */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="space-y-0.5">
                            <span className={`font-bold ${reading.isElecWarning ? 'text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded' : 'text-slate-800'}`}>
                              {reading.elecConsumed.toLocaleString()} kWh
                            </span>
                            <div className="text-[9px] text-slate-400">Số kế: {reading.elecPrev} → {reading.elecCurrent}</div>
                          </div>
                        </td>
 
                        {/* Water index and usage */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="space-y-0.5">
                            <span className={`font-bold ${reading.isWaterWarning ? 'text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded' : 'text-slate-800'}`}>
                              {reading.waterConsumed.toLocaleString()} m³
                            </span>
                            <div className="text-[9px] text-slate-400">Số kế: {reading.waterPrev} → {reading.waterCurrent}</div>
                          </div>
                        </td>
 
                        {/* Cost calculated */}
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                          <div className="space-y-0.5">
                            <span>{formatVND(reading.elecCost + reading.waterCost)}</span>
                            <div className="text-[9px] text-slate-400 font-normal">Điện: {formatVND(reading.elecCost)} • Nước: {formatVND(reading.waterCost)}</div>
                          </div>
                        </td>
 
                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={() => setReadingToDelete(reading)}
                            className="p-1 px-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
 
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Chưa tìm thấy lịch sử ghi nhận nào khớp bộ lọc</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng điều chỉnh năm báo cáo hoặc chọn lại các tiêu chí lọc.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal xác nhận xóa hàng loạt chỉ số */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        title="Xác nhận xóa hàng loạt chỉ số"
        message={`Bạn có chắn chắn muốn xóa ${selectedReadingIds.length} bản ghi chỉ số đã chọn này không? 

        Tất cả dữ liệu tiêu thụ cũ liên quan đến các bản ghi này sẽ bị loại bỏ hoàn toàn và vĩnh viễn.`}
        confirmText="Xác nhận xóa hàng loạt"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          onDeleteMultipleReadings(selectedReadingIds);
          setSelectedReadingIds([]);
          setIsBulkDeleteModalOpen(false);
        }}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        type="danger"
      />

      {/* Modal xác nhận xóa chỉ số */}
      <ConfirmationModal
        isOpen={readingToDelete !== null}
        title="Xác nhận xóa chỉ số"
        message={`Bạn có chắc muốn xóa bản ghi chỉ số Tháng ${readingToDelete?.month}/${readingToDelete?.year} này không? 

        Dữ liệu tiêu thụ và số liệu tiền thanh toán kỳ này sẽ được xóa hoàn toàn khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          if (readingToDelete) {
            onDeleteReading(readingToDelete.id);
            setReadingToDelete(null);
          }
        }}
        onCancel={() => setReadingToDelete(null)}
        type="danger"
      />

      {/* Modal xác nhận ghi đè chỉ số */}
      <ConfirmationModal
        isOpen={overwriteConfirm.isOpen}
        title="Ghi đè số liệu cũ"
        message={`Đơn vị này đã có số liệu cho Tháng ${overwriteConfirm.newData?.month}/${overwriteConfirm.newData?.year}.
        
        Bạn có thực sự muốn ghi đè lên số liệu cũ? Chỉ số tiêu thụ mới sẽ được lưu lại.`}
        confirmText="Ghi đè dữ liệu"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          if (overwriteConfirm.newData) {
            onDeleteReading(overwriteConfirm.duplicateId);
            onAddReading(overwriteConfirm.newData);

            // Propagate warnings logic if any
            const unit = units.find(u => u.id === overwriteConfirm.newData!.unitId)!;
            const eConsumed = overwriteConfirm.newData!.elecCurrent - overwriteConfirm.newData!.elecPrev;
            const wConsumed = overwriteConfirm.newData!.waterCurrent - overwriteConfirm.newData!.waterPrev;
            const isElecWarning = eConsumed > unit.electricityThreshold;
            const isWaterWarning = wConsumed > unit.waterThreshold;

            if (isElecWarning || isWaterWarning) {
              setSimulatedAlert({
                show: true,
                unitName: unit.name,
                headOfUnit: unit.headOfUnit,
                email: unit.email,
                phone: unit.phone,
                type: isElecWarning && isWaterWarning ? 'both' : (isElecWarning ? 'electricity' : 'water'),
                elecVal: eConsumed,
                elecThreshold: unit.electricityThreshold,
                waterVal: wConsumed,
                waterThreshold: unit.waterThreshold
              });
            }

            // Clean inputs
            setElecPct('');
            setElecCurrent('');
            setWaterPrev('');
            setWaterCurrent('');

            setOverwriteConfirm({ isOpen: false, duplicateId: '', newData: null });
          }
        }}
        onCancel={() => setOverwriteConfirm({ isOpen: false, duplicateId: '', newData: null })}
        type="warning"
      />

      {/* Modal báo động cảnh báo và thông tin */}
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
