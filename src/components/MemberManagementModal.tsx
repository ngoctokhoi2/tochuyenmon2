import React, { useState } from 'react';
import { TeacherMember } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Download, 
  Upload 
} from 'lucide-react';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeacherMember[];
  onUpdateMembers: (newMembers: TeacherMember[]) => void;
  settings: {
    headerTitle: string;
    schoolName: string;
    teamName: string;
    academicYear: string;
    communeName: string;
  };
  onUpdateSettings: (newSettings: any) => void;
  onResetToDefault: () => void;
}

export const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  members,
  onUpdateMembers,
  settings,
  onUpdateSettings,
  onResetToDefault
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Editable settings copy
  const [tempSettings, setTempSettings] = useState(settings);

  // New member form
  const [newMember, setNewMember] = useState<Partial<TeacherMember>>({
    name: '',
    birthDate: '',
    isPartyMember: false,
    campus: 'Trường chính',
    assignedClass: 'Lớp 2/1',
    totalStudents: 32,
    femaleStudents: 16,
    yearJoined: 2020,
    isLeader: false
  });
  const [showAddRow, setShowAddRow] = useState<boolean>(false);

  const handleMemberChange = (id: string, field: keyof TeacherMember, val: any) => {
    const updated = members.map(m => {
      if (m.id === id) {
        return { ...m, [field]: val };
      }
      return m;
    });
    onUpdateMembers(updated);
  };

  const handleToggleLeader = (id: string) => {
    const updated = members.map(m => ({
      ...m,
      isLeader: m.id === id
    }));
    onUpdateMembers(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa thành viên này khỏi tổ chuyên môn?')) {
      onUpdateMembers(members.filter(m => m.id !== id));
    }
  };

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name?.trim()) return;

    const added: TeacherMember = {
      id: 'gv-' + Date.now(),
      stt: members.length + 1,
      name: newMember.name.trim(),
      birthDate: newMember.birthDate || '01/01/1990',
      isPartyMember: Boolean(newMember.isPartyMember),
      campus: newMember.campus || 'Trường chính',
      assignedClass: newMember.assignedClass || 'Lớp 5',
      totalStudents: Number(newMember.totalStudents) || 0,
      femaleStudents: Number(newMember.femaleStudents) || 0,
      yearJoined: Number(newMember.yearJoined) || 2024,
      isLeader: Boolean(newMember.isLeader)
    };

    onUpdateMembers([...members, added]);
    setNewMember({
      name: '',
      birthDate: '',
      isPartyMember: false,
      campus: 'Trường chính',
      assignedClass: '5A',
      totalStudents: 35,
      femaleStudents: 18,
      yearJoined: 2024,
      isLeader: false
    });
    setShowAddRow(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    alert('Đã cập nhật thông tin tên Trường, Tên Tổ và Tiêu đề app!');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      settings: tempSettings,
      members
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DuLieu_ToKhoi2_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-amber-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-300" />
              Quản Lý Thành Viên Tổ & Cài Đặt Tên Trường
            </h3>
            <p className="text-xs text-red-200">
              Có thể đổi tên Giáo viên, chuyển lớp, đổi tên Tổ và Tên Trường theo thực tế
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-red-600 text-red-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Danh sách Thành viên Tổ ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-red-600 text-red-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đổi Tên Tổ / Trường / Tiêu đề
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'members' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Căn cứ danh sách năm học 2026-2027. Nhấp vào các ô để sửa trực tiếp:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRow(!showAddRow)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm giáo viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Khôi phục lại danh sách thành viên gốc theo văn bản quét ban đầu?')) {
                        onResetToDefault();
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Khôi phục gốc</span>
                  </button>
                </div>
              </div>

              {/* Add form */}
              {showAddRow && (
                <form onSubmit={handleAddNewMember} className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase">Thêm thành viên mới vào tổ:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Họ và tên GV *"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="border border-slate-300 rounded p-1.5 bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Ngày sinh (dd/mm/yyyy)"
                      value={newMember.birthDate}
                      onChange={(e) => setNewMember({ ...newMember, birthDate: e.target.value })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <select
                      value={newMember.campus}
                      onChange={(e) => setNewMember({ ...newMember, campus: e.target.value })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    >
                      <option value="Trường chính">Trường chính</option>
                      <option value="Kiến Bình">Kiến Bình</option>
                      <option value="Tân Bình">Tân Bình</option>
                      <option value="Tân Hòa">Tân Hòa</option>
                      <option value="Đinh Văn Phu">Đinh Văn Phu</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Lớp phụ trách (VD: Lớp 2/1)"
                      value={newMember.assignedClass}
                      onChange={(e) => setNewMember({ ...newMember, assignedClass: e.target.value })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="number"
                      placeholder="Sĩ số HS"
                      value={newMember.totalStudents}
                      onChange={(e) => setNewMember({ ...newMember, totalStudents: Number(e.target.value) })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Trong đó Nữ"
                      value={newMember.femaleStudents}
                      onChange={(e) => setNewMember({ ...newMember, femaleStudents: Number(e.target.value) })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Năm vào ngành"
                      value={newMember.yearJoined}
                      onChange={(e) => setNewMember({ ...newMember, yearJoined: Number(e.target.value) })}
                      className="border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMember.isPartyMember}
                          onChange={(e) => setNewMember({ ...newMember, isPartyMember: e.target.checked })}
                          className="rounded text-red-600"
                        />
                        <span>Đảng viên</span>
                      </label>
                      <button
                        type="submit"
                        className="bg-emerald-600 text-white font-bold px-3 py-1 rounded shadow text-xs ml-auto"
                      >
                        Lưu GV
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Members Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-2 text-center w-8">TT</th>
                      <th className="py-2.5 px-3">Họ và tên GV</th>
                      <th className="py-2.5 px-2">Ngày sinh</th>
                      <th className="py-2.5 px-2 text-center">ĐV</th>
                      <th className="py-2.5 px-3">Phân hiệu</th>
                      <th className="py-2.5 px-2">Lớp</th>
                      <th className="py-2.5 px-2 text-center">Sĩ số/Nữ</th>
                      <th className="py-2.5 px-2 text-center">Vào ngành</th>
                      <th className="py-2.5 px-2 text-center">Vai trò</th>
                      <th className="py-2.5 px-2 text-center w-8">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => handleMemberChange(m.id, 'name', e.target.value)}
                            className="w-full font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-red-500 bg-transparent outline-none px-1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={m.birthDate}
                            onChange={(e) => handleMemberChange(m.id, 'birthDate', e.target.value)}
                            className="w-24 text-slate-600 border-b border-transparent hover:border-slate-300 bg-transparent outline-none px-1"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={m.isPartyMember}
                            onChange={(e) => handleMemberChange(m.id, 'isPartyMember', e.target.checked)}
                            className="rounded text-red-600"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={m.campus}
                            onChange={(e) => handleMemberChange(m.id, 'campus', e.target.value)}
                            className="text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 outline-none"
                          >
                            <option value="Trường chính">Trường chính</option>
                            <option value="Kiến Bình">Kiến Bình</option>
                            <option value="Tân Bình">Tân Bình</option>
                            <option value="Tân Hòa">Tân Hòa</option>
                            <option value="Đinh Văn Phu">Đinh Văn Phu</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={m.assignedClass}
                            onChange={(e) => handleMemberChange(m.id, 'assignedClass', e.target.value)}
                            className="w-24 font-semibold text-blue-800 border-b border-transparent hover:border-slate-300 bg-transparent outline-none px-1"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono">
                            <input
                              type="number"
                              value={m.totalStudents}
                              onChange={(e) => handleMemberChange(m.id, 'totalStudents', Number(e.target.value))}
                              className="w-10 text-center border-b border-transparent hover:border-slate-300 bg-transparent outline-none"
                            />
                            <span>/</span>
                            <input
                              type="number"
                              value={m.femaleStudents}
                              onChange={(e) => handleMemberChange(m.id, 'femaleStudents', Number(e.target.value))}
                              className="w-10 text-center text-pink-600 border-b border-transparent hover:border-slate-300 bg-transparent outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            value={m.yearJoined}
                            onChange={(e) => handleMemberChange(m.id, 'yearJoined', Number(e.target.value))}
                            className="w-14 text-center text-slate-600 border-b border-transparent hover:border-slate-300 bg-transparent outline-none font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLeader(m.id)}
                            title={m.isLeader ? 'Đang là Tổ trưởng' : 'Bấm để đặt làm Tổ trưởng'}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.isLeader
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {m.isLeader ? '★ Tổ trưởng' : 'Tổ viên'}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="text-slate-300 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Settings Tab */
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tựa đề chính của ứng dụng
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.headerTitle}
                  onChange={(e) => setTempSettings({ ...tempSettings, headerTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-[11px] text-slate-400">
                  Mặc định theo yêu cầu: UBND Xã Mỹ Lạc – Trường Tiểu Học Mỹ Lạc – Tổ Khối 2
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên trường</label>
                  <input
                    type="text"
                    value={tempSettings.schoolName}
                    onChange={(e) => setTempSettings({ ...tempSettings, schoolName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tổ Chuyên Môn</label>
                  <input
                    type="text"
                    value={tempSettings.teamName}
                    onChange={(e) => setTempSettings({ ...tempSettings, teamName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cơ quan chủ quản (UBND Xã)</label>
                  <input
                    type="text"
                    value={tempSettings.communeName}
                    onChange={(e) => setTempSettings({ ...tempSettings, communeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={tempSettings.academicYear}
                    onChange={(e) => setTempSettings({ ...tempSettings, academicYear: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-300"
                >
                  <Download className="w-4 h-4" />
                  <span>Sao lưu dữ liệu (JSON)</span>
                </button>

                <button
                  type="submit"
                  className="bg-red-700 hover:bg-red-800 text-white font-bold px-5 py-2 rounded-xl text-sm shadow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
