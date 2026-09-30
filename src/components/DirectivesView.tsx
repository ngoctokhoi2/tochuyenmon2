/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolDirective, TeacherMember } from '../types';
import { 
  FileText, 
  PlusCircle, 
  Trash2, 
  Download, 
  Search, 
  Calendar, 
  Building2, 
  AlertCircle
} from 'lucide-react';
import { FileUploadInput } from './FileUploadInput';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { downloadFile, detectFileType } from '../utils/fileHelpers';
import { isHostServerDevice } from '../utils/onlineSync';

interface DirectivesViewProps {
  directives: SchoolDirective[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  userEmail?: string;
  isHostServer?: boolean;
  onSaveDirective: (directive: SchoolDirective) => void;
  onDeleteDirective: (id: string) => void;
}

export const DirectivesView: React.FC<DirectivesViewProps> = ({
  directives,
  members,
  currentUser,
  userEmail,
  isHostServer: propIsHostServer,
  onSaveDirective,
  onDeleteDirective
}) => {
  const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
  // STRICT RULE: Only host machine with account ngoctokhoi2@gmail.com can delete. Shared machines cannot delete!
  const isHostServer = typeof propIsHostServer === 'boolean'
    ? propIsHostServer
    : isHostServerDevice(userEmail);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const [deletingDirective, setDeletingDirective] = useState<SchoolDirective | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    title: string;
    issuingAuthority: string;
    category: SchoolDirective['category'];
    content: string;
    effectiveDate: string;
    signerName: string;
    senderName: string;
    isUrgent: boolean;
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    code: '',
    title: '',
    issuingAuthority: 'Phòng GD&ĐT Mỹ Thạnh',
    category: 'Công văn chỉ đạo',
    content: '',
    effectiveDate: new Date().toLocaleDateString('vi-VN'),
    signerName: '',
    senderName: `Tổ trưởng ${leaderName}`,
    isUrgent: false,
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  const filteredDirectives = directives.filter(d => {
    const matchesCategory = categoryFilter === 'Tất cả' || d.category === categoryFilter;
    const matchesSearch = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.issuingAuthority && d.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập trích yếu tiêu đề và nội dung công văn!');
      return;
    }

    const newDirective: SchoolDirective = {
      id: 'dir-' + Date.now(),
      code: formData.code.trim() || `CV-${Date.now().toString().slice(-4)}/PGD`,
      title: formData.title.trim(),
      issuingAuthority: formData.issuingAuthority.trim() || 'Phòng GD&ĐT',
      category: formData.category,
      content: formData.content.trim(),
      effectiveDate: formData.effectiveDate || new Date().toLocaleDateString('vi-VN'),
      signerName: formData.signerName.trim(),
      senderName: formData.senderName.trim() || `Tổ trưởng ${leaderName}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      isUrgent: formData.isUrgent,
      attachedFileName: formData.attachedFileName || undefined,
      attachedFileSize: formData.attachedFileSize || undefined,
      attachedFileDataUrl: formData.attachedFileDataUrl
    };

    onSaveDirective(newDirective);
    setShowModal(false);
    setFormData({
      code: '',
      title: '',
      issuingAuthority: 'Phòng GD&ĐT Mỹ Thạnh',
      category: 'Công văn chỉ đạo',
      content: '',
      effectiveDate: new Date().toLocaleDateString('vi-VN'),
      signerName: '',
      senderName: `Tổ trưởng ${leaderName}`,
      isUrgent: false,
      attachedFileName: '',
      attachedFileSize: '',
      attachedFileDataUrl: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh: Công văn chỉ đạo
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tổ trưởng điều hành: <strong>Cô {leaderName}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">
              Văn Bản &amp; Công Văn Chỉ Đạo Chuyên Môn
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Lưu trữ công văn của Sở GD&amp;ĐT, Phòng GD&amp;ĐT, Ban Giám hiệu nhà trường và Tổ chuyên môn. Tài liệu được lưu trữ lâu dài.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Tải Công Văn Mới</span>
          </button>
        </div>

        {/* Thông báo quyền quản trị cho máy chia sẻ */}
        {!isHostServer && (
          <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Chế độ máy chia sẻ:</strong> Bạn có quyền xem và tải về công văn. Các máy chia sẻ <strong>không có chức năng xóa tài liệu</strong>, chỉ có nút tải xuống. Chỉ có máy chủ Tài khoản <strong>ngoctokhoi2@gmail.com</strong> mới xóa được.</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['Tất cả', 'Công văn chỉ đạo', 'Hướng dẫn chuyên môn', 'Kế hoạch năm học', 'Thông tư - Quyết định'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo số hiệu, tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* List of Directives */}
      {filteredDirectives.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Chưa Có Công Văn Nào Được Tải Lên</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Hệ thống không chứa công văn mẫu giả định. Giáo viên hoặc Tổ trưởng bấm nút dưới đây để tải lên công văn chỉ đạo chính thức và lưu trữ lâu dài.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tải Lên Công Văn Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDirectives.map((d) => (
            <div
              key={d.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                d.isUrgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {d.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                    {d.isUrgent && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        KHẨN
                      </span>
                    )}
                  </div>

                  {isHostServer && (
                    <button
                      type="button"
                      onClick={() => setDeletingDirective(d)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Xóa công văn (Chỉ máy chủ ngoctokhoi2@gmail.com)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">
                  {d.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  {d.issuingAuthority && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.issuingAuthority}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ban hành: {d.effectiveDate || d.createdAt}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-4">
                  {d.content}
                </p>
              </div>

              {/* Attachment download */}
              {d.attachedFileName && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                      {d.attachedFileName}
                    </span>
                    {d.attachedFileSize && (
                      <span className="text-[10px] text-slate-400 shrink-0">({d.attachedFileSize})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(d.attachedFileName!, d.attachedFileDataUrl, 'application/pdf')}
                    className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Directive */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="bg-indigo-800 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Đăng Tải Công Văn Chỉ Đạo Mới</h3>
                <p className="text-xs text-indigo-200">Lưu trữ công văn chuyên môn của Tổ Khối 2</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số hiệu công văn *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CV-142/PGD-TH"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cơ quan ban hành</label>
                  <input
                    type="text"
                    placeholder="VD: Phòng GD&ĐT, BGH..."
                    value={formData.issuingAuthority}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trích yếu / Tiêu đề công văn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: V/v tăng cường phụ đạo học sinh chưa đạt chuẩn và hỗ trợ học sinh hòa nhập..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân loại văn bản</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Công văn chỉ đạo">Công văn chỉ đạo</option>
                    <option value="Hướng dẫn chuyên môn">Hướng dẫn chuyên môn</option>
                    <option value="Kế hoạch năm học">Kế hoạch năm học</option>
                    <option value="Thông tư - Quyết định">Thông tư - Quyết định</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày ban hành</label>
                  <input
                    type="text"
                    placeholder="VD: 20/09/2026"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tóm tắt nội dung chỉ đạo *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi nội dung chỉ đạo trọng tâm, các mốc thời gian và yêu cầu giáo viên thực hiện..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 leading-relaxed"
                />
              </div>

              {/* File upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Đính kèm tệp công văn (Word, PDF, Excel)</label>
                <FileUploadInput
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setFormData({
                      ...formData,
                      attachedFileName: fileName,
                      attachedFileSize: fileSize,
                      attachedFileDataUrl: fileDataUrl
                    });
                  }}
                />
                {formData.attachedFileName && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                    ✓ Đã đính kèm: {formData.attachedFileName} ({formData.attachedFileSize})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="isUrgent" className="font-semibold text-slate-700 text-xs cursor-pointer">
                  Đánh dấu là văn bản khẩn / cần triển khai ngay
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu &amp; Đăng Tải
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deletingDirective && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeletingDirective(null)}
          onConfirm={() => {
            onDeleteDirective(deletingDirective.id);
            setDeletingDirective(null);
          }}
          title="Xác nhận xóa công văn"
          itemName={`${deletingDirective.title} (${deletingDirective.code})`}
          description="Công văn này sẽ bị xóa khỏi hệ thống lưu trữ của Tổ Khối 2."
        />
      )}
    </div>
  );
};
