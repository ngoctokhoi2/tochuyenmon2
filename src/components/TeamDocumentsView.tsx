import React, { useState } from 'react';
import { TeamPlanDocument, TeacherMember } from '../types';
import { 
  BookOpen, 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  Eye, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle 
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType } from '../utils/fileHelpers';
import { isHostServerDevice } from '../utils/onlineSync';

interface TeamDocumentsViewProps {
  documents: TeamPlanDocument[];
  currentUser: TeacherMember;
  userEmail?: string;
  isHostServer?: boolean;
  onUploadDocument: (doc: TeamPlanDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

const CATEGORIES = [
  'Tất cả tài liệu',
  'Kế hoạch GD Tổ',
  'Phân phối CT',
  'KH Tích hợp QPAN',
  'KH STEM',
  'KH GD Địa phương',
  'Khác'
];

export const TeamDocumentsView: React.FC<TeamDocumentsViewProps> = ({
  documents,
  currentUser,
  userEmail,
  isHostServer: propIsHostServer,
  onUploadDocument,
  onDeleteDocument
}) => {
  // STRICT RULE: Only host machine with account ngoctokhoi2@gmail.com can delete. Shared machines cannot delete!
  const isHostServer = typeof propIsHostServer === 'boolean'
    ? propIsHostServer
    : isHostServerDevice(userEmail);

  const [selectedCat, setSelectedCat] = useState<string>('Tất cả tài liệu');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [viewingDoc, setViewingDoc] = useState<TeamPlanDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<TeamPlanDocument | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    category: TeamPlanDocument['category'];
    description: string;
    fileName: string;
    fileSize: string;
    fileDataUrl?: string;
  }>({
    title: '',
    category: 'Kế hoạch GD Tổ',
    description: '',
    fileName: '',
    fileSize: '1.2 MB',
    fileDataUrl: undefined
  });

  const filteredDocs = documents.filter(d => {
    const matchCat = selectedCat === 'Tất cả tài liệu' || d.category === selectedCat;
    const matchSearch = searchTerm === '' ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDownload = (doc: TeamPlanDocument) => {
    const fallbackText = `TRƯỜNG TIỂU HỌC MỸ LẠC - TỔ CHUYÊN MÔN KHỐI 2\n` +
      `Tài liệu: ${doc.title}\n` +
      `Danh mục: ${doc.category}\n` +
      `Người đăng: ${doc.uploadedBy}\n` +
      `Ngày đăng: ${doc.uploadedAt}\n\n` +
      `Mô tả nội dung:\n${doc.description}\n\n` +
      `--- NỘI DUNG KẾ HOẠCH CHI TIẾT ĐÃ ĐƯỢC DUYỆT BỞI TỔ TRƯỞNG NGUYỄN KIM NGỌC ---\n` +
      `${doc.fileContentText || 'Nội dung chi tiết theo khung hướng dẫn của Bộ Giáo dục & Đào tạo...'}`;

    downloadFile(doc.fileName || `${doc.title}.docx`, doc.fileDataUrl, fallbackText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFileName = formData.fileName || `${formData.title.replace(/\s+/g, '_')}.docx`;
    const newDoc: TeamPlanDocument = {
      id: 'doc-' + Date.now(),
      title: formData.title,
      category: formData.category,
      description: formData.description,
      fileName: finalFileName,
      fileSize: formData.fileSize || '1.2 MB',
      fileDataUrl: formData.fileDataUrl,
      uploadedBy: currentUser.isLeader ? `${currentUser.name} (Tổ trưởng)` : currentUser.name,
      teacherId: currentUser.id,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      fileContentText: formData.description
    };
    onUploadDocument(newDoc);
    setShowUploadModal(false);
    setFormData({
      title: '',
      category: 'Kế hoạch GD Tổ',
      description: '',
      fileName: '',
      fileSize: '1.2 MB',
      fileDataUrl: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh 3
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Kế Hoạch Chung Của Tổ & Phân Phối Chương Trình
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kho tài liệu chung cả tổ xem và tải về máy tính cá nhân. Tổ trưởng có quyền xóa nếu thành viên gửi lên sai.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                category: 'Kế hoạch GD Tổ',
                description: '',
                fileName: '',
                fileSize: '',
                fileDataUrl: undefined
              });
              setShowUploadModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Tải Lên Kế Hoạch Mới</span>
          </button>
        </div>

        {/* Thông báo quyền quản trị cho máy chia sẻ */}
        {!isHostServer && (
          <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ máy chia sẻ:</strong> Bạn có quyền xem và tải về Kế hoạch Tổ &amp; Phân phối chương trình (PPCT). 
              Các máy chia sẻ <strong>không có chức năng xóa tài liệu</strong>, chỉ có nút tải xuống. Chỉ có máy chủ Tài khoản <strong>ngoctokhoi2@gmail.com</strong> mới xóa được.
            </span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên kế hoạch, người đăng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold">Chưa có kế hoạch nào trong danh mục này.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            return (
              <div 
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {doc.uploadedAt}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                      {doc.description}
                    </p>
                  </div>

                  {(() => {
                    const type = detectFileType(doc.fileName);
                    return (
                      <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                        {type === 'word' ? (
                          <span className="p-1 bg-blue-100 text-blue-700 rounded font-extrabold text-[10px] uppercase shrink-0">Word</span>
                        ) : type === 'excel' ? (
                          <span className="p-1 bg-emerald-100 text-emerald-700 rounded font-extrabold text-[10px] uppercase shrink-0">Excel</span>
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold truncate flex-1 text-slate-800">{doc.fileName}</span>
                        <span className="text-slate-400 text-[11px] shrink-0 font-mono">({doc.fileSize})</span>
                      </div>
                    );
                  })()}

                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Đăng bởi: <strong>{doc.uploadedBy}</strong></span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem nội dung</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về máy</span>
                    </button>

                    {isHostServer && (
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(doc)}
                        title="Xóa kế hoạch (Chỉ máy chủ ngoctokhoi2@gmail.com)"
                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => {
          if (deletingDoc) {
            onDeleteDocument(deletingDoc.id);
            setDeletingDoc(null);
          }
        }}
        title="Xác nhận xóa Kế hoạch của Tổ"
        itemName={deletingDoc ? deletingDoc.title : ''}
        description="Tài liệu kế hoạch này sẽ bị xóa khỏi kho chung của tổ."
      />

      {/* Modal: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-300" />
                  <span>Tải Lên Kế Hoạch Của Tổ</span>
                </h3>
                <p className="text-xs text-emerald-100">
                  Phân phối chương trình, Kế hoạch tích hợp QPAN, STEM, GD địa phương
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form id="upload-team-doc-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề kế hoạch / tài liệu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kế hoạch tích hợp GDQPAN môn Lịch sử & Địa lý 5"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Danh mục kế hoạch *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                >
                  {CATEGORIES.filter(c => c !== 'Tất cả tài liệu').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <FileUploadInput
                  label="Tệp kế hoạch đính kèm (Word .docx hoặc Excel .xlsx)"
                  helperText="Hỗ trợ đầy đủ định dạng: Word (.docx, .doc), Excel (.xlsx, .xls), PDF (.pdf)"
                  currentFileName={formData.fileName}
                  currentFileSize={formData.fileSize}
                  currentFileDataUrl={formData.fileDataUrl}
                  uploadActionLabel="Đưa Kế Hoạch Lên Tổ"
                  onUploadAction={() => {
                    const formEl = document.getElementById('upload-team-doc-form') as HTMLFormElement | null;
                    if (formEl) formEl.requestSubmit();
                  }}
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setFormData(prev => ({
                      ...prev,
                      fileName,
                      fileSize,
                      fileDataUrl,
                      title: prev.title || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
                    }));
                  }}
                  onFileCleared={() => {
                    setFormData(prev => ({
                      ...prev,
                      fileName: '',
                      fileSize: '1.2 MB',
                      fileDataUrl: undefined
                    }));
                  }}
                />
              </div>

              {formData.fileName && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã chọn: <span className="font-mono underline">{formData.fileName}</span></span>
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Lên Tổ Ngay</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả tóm tắt nội dung kế hoạch *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả mục tiêu, đối tượng áp dụng, số tiết tích hợp..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="upload-team-doc-form"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Tải Lên Kế Hoạch Của Tổ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Doc Content */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold uppercase">
                  {viewingDoc.category}
                </span>
                <h3 className="font-bold text-base mt-1">{viewingDoc.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between">
                <div>
                  <span className="text-slate-500">Đăng bởi:</span> <strong>{viewingDoc.uploadedBy}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Ngày đăng:</span> {viewingDoc.uploadedAt}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
                  Mô tả kế hoạch:
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                  {viewingDoc.description}
                </p>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
                <div>Tệp đính kèm: <strong>{viewingDoc.fileName}</strong> ({viewingDoc.fileSize})</div>
                <div className="mt-1 text-emerald-700 font-sans font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã được kiểm duyệt và lưu trữ trên hệ thống trường Tiểu Học Mỹ Lạc.
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownload(viewingDoc)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Tải về máy tính cá nhân</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
