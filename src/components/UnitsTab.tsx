import React, { useState } from 'react';
import { MemberUnit } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Phone, 
  User, 
  X, 
  Zap, 
  Droplet,
  Save,
  DollarSign
} from 'lucide-react';

interface UnitsTabProps {
  units: MemberUnit[];
  onAddUnit: (unit: Omit<MemberUnit, 'id'>) => void;
  onUpdateUnit: (unit: MemberUnit) => void;
  onDeleteUnit: (id: string) => void;
}

export default function UnitsTab({ units, onAddUnit, onUpdateUnit, onDeleteUnit }: UnitsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MemberUnit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<MemberUnit | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'danger' | 'warning' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headOfUnit, setHeadOfUnit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [electricityThreshold, setElectricityThreshold] = useState<number>(10000);
  const [waterThreshold, setWaterThreshold] = useState<number>(300);
  const [electricityPrice, setElectricityPrice] = useState<number>(2800);
  const [waterPrice, setWaterPrice] = useState<number>(14000);

  // Open modal for writing a new unit
  const openAddModal = () => {
    setEditingUnit(null);
    setName('');
    setCode('');
    setHeadOfUnit('');
    setEmail('');
    setPhone('');
    setElectricityThreshold(10000);
    setWaterThreshold(300);
    setElectricityPrice(2800);
    setWaterPrice(14000);
    setIsModalOpen(true);
  };

  // Open modal to update an existing unit
  const openEditModal = (unit: MemberUnit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setCode(unit.code);
    setHeadOfUnit(unit.headOfUnit);
    setEmail(unit.email);
    setPhone(unit.phone);
    setElectricityThreshold(unit.electricityThreshold);
    setWaterThreshold(unit.waterThreshold);
    setElectricityPrice(unit.electricityPrice);
    setWaterPrice(unit.waterPrice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !headOfUnit.trim()) {
      setAlertConfig({
        isOpen: true,
        title: 'Thiếu thông tin bắt buộc',
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc: Tên đơn vị, Mã đơn vị và Trưởng đơn vị.',
        type: 'warning'
      });
      return;
    }

    const unitData = {
      name,
      code: code.toUpperCase().trim(),
      headOfUnit,
      email: email.trim(),
      phone: phone.trim(),
      electricityThreshold: Number(electricityThreshold) || 0,
      waterThreshold: Number(waterThreshold) || 0,
      electricityPrice: Number(electricityPrice) || 0,
      waterPrice: Number(waterPrice) || 0,
    };

    if (editingUnit) {
      onUpdateUnit({ ...unitData, id: editingUnit.id });
    } else {
      onAddUnit(unitData);
    }
    handleCloseModal();
  };

  // Search filter
  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.headOfUnit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="units-view" className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh mục Đơn vị thành viên</h2>
          <p className="text-sm text-slate-500">Quản lý định mức điện nước và đơn giá đặc thù của từng chi nhánh/nhà máy</p>
        </div>
        
        <button 
          id="add-unit-btn"
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" /> Thêm đơn vị mới
        </button>
      </div>

      {/* Search and Information Cards */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            id="unit-search"
            placeholder="Tìm kiếm theo mã, tên, trưởng đơn vị..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Small stats of units */}
        <div className="flex items-center gap-6 text-sm divide-x divide-slate-100 text-slate-500 w-full md:w-auto justify-start md:justify-end">
          <div className="px-3 py-1">
            <span className="font-semibold text-slate-800 text-base mr-1.5">{units.length}</span> Đơn vị tổng số
          </div>
          <div className="px-4 py-1">
            <span className="font-semibold text-slate-800 text-base mr-1.5 flex items-center gap-0.5 inline-flex">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              {(units.reduce((acc, u) => acc + u.electricityThreshold, 0) / (units.length || 1)).toLocaleString('vi-VN', {maximumFractionDigits:0})}
            </span> kWh Đ.mức Điện tb
          </div>
          <div className="px-4 py-1">
            <span className="font-semibold text-slate-800 text-base mr-1.5 flex items-center gap-0.5 inline-flex">
              <Droplet className="h-4 w-4 text-blue-500 fill-blue-50" />
              {(units.reduce((acc, u) => acc + u.waterThreshold, 0) / (units.length || 1)).toLocaleString('vi-VN', {maximumFractionDigits:0})}
            </span> $m^3$ Đ.mức Nước tb
          </div>
        </div>
      </div>

      {/* Grid of Member Units */}
      {filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredUnits.map(unit => (
            <div key={unit.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group flex flex-col justify-between">
              
              <div>
                {/* Visual Unit Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{unit.name}</h3>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded text-slate-500 mt-0.5 uppercase tracking-wide">
                        Mã: {unit.code}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(unit)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                      title="Sửa thông tin"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setUnitToDelete(unit)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Xóa đơn vị"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contact list & Personal Manager */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-50">
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="h-3.5 w-3.5 text-slate-400" /> Trưởng đơn vị:
                    </div>
                    <div className="pl-5 text-slate-600 font-semibold">{unit.headOfUnit}</div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> Email báo động:
                    </div>
                    <div className="pl-5 text-slate-600 font-semibold break-all">{unit.email || 'Chưa thiết lập'}</div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 sm:col-span-2">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> Điện thoại nhận SMS:
                    </div>
                    <div className="pl-5 text-slate-600 font-semibold">{unit.phone || 'Chưa thiết lập'}</div>
                  </div>
                </div>

                {/* Configurations & Limits thresholds */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Electricity limit */}
                  <div className="bg-amber-50/30 p-2.5 rounded-lg border border-amber-100/50 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-100" /> Định mức Điện
                    </div>
                    <p className="text-sm font-bold text-slate-700">{unit.electricityThreshold.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">kWh</span></p>
                    <p className="text-[10px] text-slate-400">Giá: {unit.electricityPrice.toLocaleString()}đ/kWh</p>
                  </div>

                  {/* Water limit */}
                  <div className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
                      <Droplet className="h-3.5 w-3.5 text-blue-500 fill-blue-50" /> Định mức Nước
                    </div>
                    <p className="text-sm font-bold text-slate-700">{unit.waterThreshold.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">m³</span></p>
                    <p className="text-[10px] text-slate-400">Giá: {unit.waterPrice.toLocaleString()}đ/m³</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Tự động cấu hình thông báo</span>
                <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">Hoạt động SMS/Email</span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-slate-50 rounded-full text-slate-400">
            <Building2 className="h-10 w-10" />
          </div>
          <p className="text-slate-600 font-semibold">Chưa tìm thấy đơn vị thành viên nào</p>
          <p className="text-xs text-slate-400 max-w-sm leading-normal">Hãy dùng nút "Thêm đơn vị mới" ở góc trên bên phải hoặc điều chỉnh bộ lọc tìm kiếm của bạn.</p>
        </div>
      )}

      {/* Add / Edit Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                {editingUnit ? 'Cập nhật Đơn vị thành viên' : 'Thêm Đơn vị thành viên mới'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 px-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Part 1: General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thông tin bản bộ</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tên đơn vị thành viên <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Nhà máy Thủy sản Vũng Tàu" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-350"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Mã đơn vị (2-6 ký tự) <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: NMVT" 
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase placeholder:text-slate-350"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tên Trưởng đơn vị <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Hoàng Tuấn Anh" 
                      value={headOfUnit}
                      onChange={(e) => setHeadOfUnit(e.target.value)}
                      className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-350"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Email cảnh báo</label>
                    <input 
                      type="email" 
                      placeholder="email@congtytong.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-350"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Số ĐT nhận cảnh báo SMS</label>
                    <input 
                      type="tel" 
                      placeholder="Ví dụ: 0912xxxxxx" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm text-slate-700 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-350"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Utility Limit Threshold Configurations */}
              <div className="space-y-4 pt-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thiết lập Hạn mức & Giá trị thanh toán</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  
                  {/* Electricity Limits */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Zap className="h-4 w-4 text-amber-500 fill-amber-100" /> ĐỊNH MỨC ĐIỆN & GIÁ
                    </div>
                    
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Ngưỡng điện cảnh báo (kWh/tháng)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={electricityThreshold}
                          onChange={(e) => setElectricityThreshold(Number(e.target.value))}
                          className="w-full text-sm text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Đơn giá điện áp dụng (VND/kWh)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={electricityPrice}
                          onChange={(e) => setElectricityPrice(Number(e.target.value))}
                          className="w-full text-sm text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Water Limits */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Droplet className="h-4 w-4 text-blue-500 fill-blue-50" /> ĐỊNH MỨC NƯỚC & GIÁ
                    </div>
                    
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Ngưỡng nước cảnh báo (m³/tháng)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={waterThreshold}
                          onChange={(e) => setWaterThreshold(Number(e.target.value))}
                          className="w-full text-sm text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Đơn giá nước áp dụng (VND/m³)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={waterPrice}
                          onChange={(e) => setWaterPrice(Number(e.target.value))}
                          className="w-full text-sm text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4.5 py-2 border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" /> 
                  {editingUnit ? 'Lưu cập nhật' : 'Tạo đơn vị mới'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal xác nhận xóa đơn vị */}
      <ConfirmationModal
        isOpen={unitToDelete !== null}
        title="Xác nhận xóa đơn vị"
        message={`Bạn có chắc muốn xóa đơn vị "${unitToDelete?.name}"?
        
        Thao tác này sẽ xóa vĩnh viễn đơn vị thành viên cùng với tất cả lịch sử chỉ số liên quan khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          if (unitToDelete) {
            onDeleteUnit(unitToDelete.id);
            setUnitToDelete(null);
          }
        }}
        onCancel={() => setUnitToDelete(null)}
        type="danger"
      />

      {/* Modal cảnh báo chung */}
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
