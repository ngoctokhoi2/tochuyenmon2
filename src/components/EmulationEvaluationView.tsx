/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EmulationRecord, EmulationDocument, TeacherMember } from '../types';
import { 
  Award, 
  PlusCircle, 
  Trash2, 
  Printer, 
  Edit3, 
  Medal, 
  Star, 
  CheckCircle2, 
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Download,
  UploadCloud,
  FileCheck,
  Calendar,
  User,
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType, readFileAsDataUrl } from '../utils/fileHelpers';
import { isHostServerDevice } from '../utils/onlineSync';

interface EmulationEvaluationViewProps {
  records: EmulationRecord[];
  emulationDocuments?: EmulationDocument[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  userEmail?: string;
  isHostServer?: boolean;
  onSaveRecord: (record: EmulationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSaveEmulationDoc?: (doc: EmulationDocument) => void;
  onDeleteEmulationDoc?: (id: string) => void;
}

const PERIODS: EmulationRecord['period'][] = ['Học kỳ I', 'Học kỳ II', 'Cả năm'];

export const EmulationEvaluationView: React.FC<EmulationEvaluationViewProps> = ({
  records,
  emulationDocuments = [],
  members,
  currentUser,
  userEmail,
  isHostServer: propIsHostServer,
  onSaveRecord,
  onDeleteRecord,
  onSaveEmulationDoc,
  onDeleteEmulationDoc
}) => {
  const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
  const isLeader = currentUser.isLeader || currentUser.name.includes('Kim Ngọc') || currentUser.name.includes('Ngọc');
  // STRICT RULE: Only host machine with account ngoctokhoi2@gmail.com can delete. Shared machines cannot delete!
  const isHostServer = typeof propIsHostServer === 'boolean'
    ? propIsHostServer
    : isHostServerDevice(userEmail);

  const [selectedPeriod, setSelectedPeriod] = useState<EmulationRecord['period']>('Học kỳ I');
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<EmulationRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<EmulationRecord | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<EmulationDocument | null>(null);

  // Document Upload Form State (for Excel & Word results)
  const [docFormData, setDocFormData] = useState<{
    title: string;
    period: EmulationRecord['period'];
    academicYear: string;
    note: string;
    fileType: 'excel' | 'word' | 'pdf';
    fileName: string;
    fileSize: string;
    fileDataUrl?: string;
  }>({
    title: '',
    period: 'Học kỳ I',
    academicYear: 'Năm học 2026-2027',
    note: '',
    fileType: 'excel',
    fileName: '',
    fileSize: '',
    fileDataUrl: undefined
  });

  // Record Form State
  const [recordFormData, setRecordFormData] = useState<{
    teacherId: string;
    lessonObservationsScore: string;
    recordBooksRating: 'Tốt' | 'Khá' | 'Đạt';
    studentProgressRating: 'Tốt' | 'Khá' | 'Đạt';
    innovationInitiative: string;
    proposedTitle: EmulationRecord['proposedTitle'];
    overallEvaluation: EmulationRecord['overallEvaluation'];
    notes: string;
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    teacherId: members[0]?.id || '',
    lessonObservationsScore: 'Tiết dạy đạt Tốt',
    recordBooksRating: 'Tốt',
    studentProgressRating: 'Tốt',
    innovationInitiative: '',
    proposedTitle: 'Lao động Tiên tiến',
    overallEvaluation: 'Hoàn thành Tốt',
    notes: '',
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  const periodRecords = records.filter(r => r.period === selectedPeriod);
  const periodDocs = emulationDocuments.filter(d => d.period === selectedPeriod);

  const countExcellent = periodRecords.filter(r => r.overallEvaluation === 'Hoàn thành Xuất sắc').length;
  const countGood = periodRecords.filter(r => r.overallEvaluation === 'Hoàn thành Tốt').length;
  const countGrassroots = periodRecords.filter(r => r.proposedTitle === 'Chiến sĩ thi đua cơ sở').length;

  // Handle Export Excel
  const handleExportExcel = () => {
    let csv = `\uFEFFTRƯỜNG TIỂU HỌC MỸ THẠNH - TỔ CHUYÊN MÔN KHỐI 2\n`;
    csv += `BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THI ĐUA - ${selectedPeriod.toUpperCase()}\n`;
    csv += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} - Người duyệt: Tổ trưởng ${leaderName}\n\n`;
    csv += `STT,Họ và tên giáo viên,Lớp phụ trách,Điểm trường,Giờ dạy thao giảng,Hồ sơ sổ sách,Chất lượng HS,Sáng kiến kinh nghiệm / Đổi mới,Danh hiệu đề xuất,Xếp loại chung,Ghi chú của Tổ trưởng\n`;
    periodRecords.forEach((r, idx) => {
      csv += `${idx + 1},"${r.teacherName}","${r.assignedClass}","${r.campus}","${r.lessonObservationsScore}","${r.recordBooksRating}","${r.studentProgressRating}","${(r.innovationInitiative || '').replace(/"/g, '""')}","${r.proposedTitle}","${r.overallEvaluation}","${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    downloadFile(`BangThiDua_${selectedPeriod.replace(/\s+/g, '_')}_Khoi2.xlsx`, undefined, csv);
  };

  // Handle Export Word
  const handleExportWord = () => {
    let doc = `TRƯỜNG TIỂU HỌC MỸ THẠNH - TỔ KHỐI 2\n`;
    doc += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n`;
    doc += `BIÊN BẢN HỌP BÌNH XÉT THI ĐUA TỔ VIÊN KHỐI 2\n`;
    doc += `Thời gian: ${new Date().toLocaleDateString('vi-VN')} - Kỳ đánh giá: ${selectedPeriod}\n`;
    doc += `Chủ trì: Tổ trưởng Nguyễn Kim Ngọc\n\n`;
    doc += `1. TỔNG HỢP KẾT QUẢ:\n`;
    doc += `- Tổng số giáo viên: ${periodRecords.length} đồng chí\n`;
    doc += `- Hoàn thành Xuất sắc: ${countExcellent} đồng chí\n`;
    doc += `- Hoàn thành Tốt: ${countGood} đồng chí\n`;
    doc += `- Đề nghị danh hiệu Chiến sĩ thi đua cơ sở: ${countGrassroots} đồng chí\n\n`;
    doc += `2. KẾT QUẢ ĐÁNH GIÁ TỪNG THÀNH VIÊN:\n`;
    periodRecords.forEach((r, idx) => {
      doc += `${idx + 1}. Đồng chí: ${r.teacherName} (${r.assignedClass} - ${r.campus})\n`;
      doc += `   - Tiết dạy / Thao giảng: ${r.lessonObservationsScore}\n`;
      doc += `   - Hồ sơ sổ sách: ${r.recordBooksRating} | Chất lượng học sinh: ${r.studentProgressRating}\n`;
      doc += `   - Sáng kiến / Biện pháp đổi mới: ${r.innovationInitiative || 'Không'}\n`;
      doc += `   - Danh hiệu đề xuất: ${r.proposedTitle}\n`;
      doc += `   - Đánh giá chung: ${r.overallEvaluation}\n`;
      doc += `   - Nhận xét: ${r.notes}\n\n`;
    });
    doc += `\n                  TỔ TRƯỞNG CHUYÊN MÔN\n                  (Đã ký)\n                  ${leaderName}`;
    downloadFile(`BienBanThiDua_${selectedPeriod.replace(/\s+/g, '_')}_Khoi5.docx`, undefined, doc);
  };

  // Open modal for Member Evaluation Record
  const handleOpenRecordModal = (record?: EmulationRecord) => {
    if (record) {
      setEditingRecord(record);
      setRecordFormData({
        teacherId: record.teacherId,
        lessonObservationsScore: record.lessonObservationsScore,
        recordBooksRating: record.recordBooksRating,
        studentProgressRating: record.studentProgressRating,
        innovationInitiative: record.innovationInitiative,
        proposedTitle: record.proposedTitle,
        overallEvaluation: record.overallEvaluation,
        notes: record.notes,
        attachedFileName: record.attachedFileName || '',
        attachedFileSize: record.attachedFileSize || '',
        attachedFileDataUrl: record.attachedFileDataUrl
      });
    } else {
      setEditingRecord(null);
      const evaluatedTeacherIds = new Set(periodRecords.map(r => r.teacherId));
      const unevaluated = members.find(m => !evaluatedTeacherIds.has(m.id)) || members[0];

      setRecordFormData({
        teacherId: unevaluated.id,
        lessonObservationsScore: 'Tiết dạy đạt loại Tốt',
        recordBooksRating: 'Tốt',
        studentProgressRating: 'Tốt',
        innovationInitiative: '',
        proposedTitle: 'Lao động Tiên tiến',
        overallEvaluation: 'Hoàn thành Tốt',
        notes: 'Chấp hành tốt quy chế chuyên môn của tổ và nhà trường.',
        attachedFileName: '',
        attachedFileSize: '',
        attachedFileDataUrl: undefined
      });
    }
    setShowRecordModal(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = members.find(m => m.id === recordFormData.teacherId) || members[0];

    const record: EmulationRecord = {
      id: editingRecord ? editingRecord.id : 'emu-' + Date.now(),
      period: selectedPeriod,
      teacherId: teacher.id,
      teacherName: teacher.name,
      campus: teacher.campus,
      assignedClass: teacher.assignedClass,
      lessonObservationsScore: recordFormData.lessonObservationsScore,
      recordBooksRating: recordFormData.recordBooksRating,
      studentProgressRating: recordFormData.studentProgressRating,
      innovationInitiative: recordFormData.innovationInitiative,
      proposedTitle: recordFormData.proposedTitle,
      overallEvaluation: recordFormData.overallEvaluation,
      notes: recordFormData.notes,
      evaluatedAt: new Date().toLocaleDateString('vi-VN'),
      attachedFileName: recordFormData.attachedFileName || undefined,
      attachedFileSize: recordFormData.attachedFileSize || undefined,
      attachedFileDataUrl: recordFormData.attachedFileDataUrl
    };

    onSaveRecord(record);
    setShowRecordModal(false);
  };

  // Open modal for Document Upload (Excel / Word)
  const handleOpenDocModal = () => {
    setDocFormData({
      title: `Bảng tổng hợp kết quả xét thi đua ${selectedPeriod} - Khối 2`,
      period: selectedPeriod,
      academicYear: 'Năm học 2026-2027',
      note: 'Tệp bảng điểm, biên bản bình xét thi đua chính thức có chữ ký xác nhận của Tổ trưởng và các thành viên.',
      fileType: 'excel',
      fileName: '',
      fileSize: '',
      fileDataUrl: undefined
    });
    setShowDocUploadModal(true);
  };

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.fileName) {
      alert('Vui lòng chọn tệp Excel hoặc Word kết quả thi đua để tải lên!');
      return;
    }

    const newDoc: EmulationDocument = {
      id: 'emudoc-' + Date.now(),
      title: docFormData.title.trim() || `Hồ sơ kết quả thi đua ${docFormData.period}`,
      period: docFormData.period,
      academicYear: docFormData.academicYear,
      fileType: docFormData.fileType,
      fileName: docFormData.fileName,
      fileSize: docFormData.fileSize,
      fileDataUrl: docFormData.fileDataUrl,
      uploadedBy: currentUser.name,
      teacherId: currentUser.id,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      note: docFormData.note
    };

    if (onSaveEmulationDoc) {
      onSaveEmulationDoc(newDoc);
    }
    setShowDocUploadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh: Xét thi đua
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tổ trưởng phụ trách: <strong>Cô {leaderName}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">
              Đánh Giá &amp; Xét Thi Đua Chuyên Môn Khối 2
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ tải lên kết quả thi đua định dạng <strong>Excel (.xlsx)</strong> và <strong>Word (.docx)</strong>, xuất biên bản và lưu trữ lâu dài.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDocModal}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải Lên Tệp Thi Đua (Excel / Word)</span>
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={() => handleOpenRecordModal()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Xét Thành Viên ({selectedPeriod})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors"
              title="Xuất bảng Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors"
              title="Xuất biên bản Word"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Word</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-slate-300"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Biểu Mẫu</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Kỳ bình xét:
          </span>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === p
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Thông báo quyền quản trị cho máy chia sẻ */}
        {!isHostServer && (
          <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Chế độ máy chia sẻ:</strong> Bạn có quyền xem bảng kết quả và tải về hồ sơ thi đua Excel/Word. Các máy chia sẻ <strong>không có chức năng xóa tài liệu</strong>, chỉ có nút tải xuống. Chỉ có máy chủ Tài khoản <strong>ngoctokhoi2@gmail.com</strong> mới xóa được.</span>
          </div>
        )}
      </div>

      {/* SECTION 1: HỒ SƠ & BẢNG KẾT QUẢ THI ĐUA ĐÃ TẢI LÊN (EXCEL & WORD) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Tài Liệu Kết Quả Xét Thi Đua Đính Kèm (Excel &amp; Word) - {selectedPeriod}
              </h3>
              <p className="text-[11px] text-slate-500">
                Bảng tổng hợp điểm, biên bản bình xét, danh sách khen thưởng tải lên và lưu trữ lâu dài
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenDocModal}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tải lên tệp mới</span>
          </button>
        </div>

        {periodDocs.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Chưa có tệp Excel hoặc Word kết quả thi đua nào được tải lên cho {selectedPeriod}.
            </p>
            <button
              type="button"
              onClick={handleOpenDocModal}
              className="mt-2 text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Bấm vào đây để tải lên tệp Excel/Word kết quả thi đua</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {periodDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                        doc.fileType === 'excel'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : doc.fileType === 'word'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {doc.fileType === 'excel' ? (
                        <FileSpreadsheet className="w-3 h-3" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span>{doc.fileType.toUpperCase()}</span>
                    </span>

                    {onDeleteEmulationDoc && isHostServer && (
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(doc)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                        title="Xóa tệp này (Chỉ máy chủ ngoctokhoi2@gmail.com)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mb-1">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono truncate mb-2">
                    {doc.fileName} ({doc.fileSize})
                  </p>
                  {doc.note && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100 line-clamp-2 mb-2">
                      &ldquo;{doc.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Bởi: <strong className="text-slate-700">{doc.uploadedBy}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => downloadFile(doc.fileName, doc.fileDataUrl, doc.fileType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/msword')}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải về</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BẢNG THEO DÕI ĐÁNH GIÁ TỪNG THÀNH VIÊN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Bảng Tổng Hợp Đánh Giá Cá Nhân ({selectedPeriod})
            </h3>
            <p className="text-xs text-slate-500">
              {periodRecords.length}/{members.length} thành viên đã được xét duyệt
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Xuất sắc: {countExcellent}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tốt: {countGood}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 text-amber-600" />
              CSTĐ: {countGrassroots}
            </span>
          </div>
        </div>

        {periodRecords.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
            <Award className="w-12 h-12 text-amber-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa Có Kết Quả Xét Thi Đua Cho {selectedPeriod}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tổ trưởng có thể bấm &ldquo;Xét Thành Viên&rdquo; để nhập kết quả hoặc &ldquo;Tải Lên Tệp Thi Đua (Excel/Word)&rdquo; để lưu trữ hồ sơ chính thức.
            </p>
            {isLeader && (
              <button
                type="button"
                onClick={() => handleOpenRecordModal()}
                className="mt-3 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nhập Đánh Giá Thi Đua Thành Viên Ngay</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 text-center w-12">STT</th>
                  <th className="p-3">Họ và tên giáo viên</th>
                  <th className="p-3">Lớp / Phân hiệu</th>
                  <th className="p-3">Giờ dạy thao giảng</th>
                  <th className="p-3">Hồ sơ &amp; Chất lượng</th>
                  <th className="p-3">Sáng kiến / Đổi mới</th>
                  <th className="p-3">Danh hiệu đề xuất</th>
                  <th className="p-3">Xếp loại chung</th>
                  <th className="p-3 text-center">Tệp kèm</th>
                  {isLeader && <th className="p-3 text-center w-24">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800">{r.teacherName}</td>
                    <td className="p-3 text-slate-600">
                      <div>{r.assignedClass}</div>
                      <div className="text-[10px] text-slate-400">({r.campus})</div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{r.lessonObservationsScore}</td>
                    <td className="p-3 text-slate-600">
                      <div>Sổ sách: <strong className="text-slate-800">{r.recordBooksRating}</strong></div>
                      <div>Chất lượng: <strong className="text-slate-800">{r.studentProgressRating}</strong></div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[180px]">
                      {r.innovationInitiative ? (
                        <span className="line-clamp-2" title={r.innovationInitiative}>
                          {r.innovationInitiative}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Không có</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Medal className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{r.proposedTitle}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                          r.overallEvaluation === 'Hoàn thành Xuất sắc'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : r.overallEvaluation === 'Hoàn thành Tốt'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {r.overallEvaluation}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {r.attachedFileName ? (
                        <button
                          type="button"
                          onClick={() => downloadFile(r.attachedFileName!, r.attachedFileDataUrl, 'application/pdf')}
                          className="text-amber-700 hover:text-amber-900 font-bold text-[11px] inline-flex items-center gap-1"
                          title="Tải tệp đính kèm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    {isLeader && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRecordModal(r)}
                            className="text-slate-500 hover:text-amber-600 p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isHostServer && (
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(r)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Xóa kết quả (Chỉ máy chủ ngoctokhoi2@gmail.com)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures for Print */}
        <div className="grid grid-cols-2 text-center pt-8 text-xs border-t border-slate-100">
          <div>
            <p className="font-bold uppercase">NGƯỜI TỔNG HỢP</p>
            <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
            <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
            <div className="h-12"></div>
            <p className="font-bold text-sm text-slate-800">{leaderName}</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: TẢI LÊN TỆP EXCEL / WORD KẾT QUẢ THI ĐUA */}
      {showDocUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-300" />
                  <span>Tải Lên Kết Quả Xét Thi Đua (Excel / Word)</span>
                </h3>
                <p className="text-xs text-emerald-200">Lưu trữ tệp bảng tổng hợp, biên bản bình xét thi đua</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocUploadModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề bảng xét thi đua / biên bản *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bảng tổng hợp kết quả bình xét thi đua HKI - Khối 2"
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kỳ bình xét</label>
                  <select
                    value={docFormData.period}
                    onChange={(e) => setDocFormData({ ...docFormData, period: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Học kỳ I">Học kỳ I</option>
                    <option value="Học kỳ II">Học kỳ II</option>
                    <option value="Cả năm">Cả năm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={docFormData.academicYear}
                    onChange={(e) => setDocFormData({ ...docFormData, academicYear: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* File upload input accepting Excel and Word */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn tệp Excel (.xlsx, .xls) hoặc Word (.docx, .doc) *
                </label>
                <FileUploadInput
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    const fnLower = fileName.toLowerCase();
                    const detectedType: 'excel' | 'word' | 'pdf' = 
                      fnLower.endsWith('.xlsx') || fnLower.endsWith('.xls')
                        ? 'excel'
                        : fnLower.endsWith('.pdf')
                        ? 'pdf'
                        : 'word';

                    setDocFormData(prev => ({
                      ...prev,
                      fileName,
                      fileSize,
                      fileDataUrl,
                      fileType: detectedType
                    }));
                  }}
                />
                {docFormData.fileName && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ✓ Đã chọn: {docFormData.fileName} ({docFormData.fileSize}) - Định dạng: {docFormData.fileType.toUpperCase()}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về nội dung bình xét, lưu ý hoặc số quyết định..."
                  value={docFormData.note}
                  onChange={(e) => setDocFormData({ ...docFormData, note: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu &amp; Tải Lên Hệ Thống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NHẬP ĐÁNH GIÁ THÀNH VIÊN */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">
                  {editingRecord ? 'Chỉnh Sửa Đánh Giá Thi Đua' : `Xét Thi Đua Thành Viên (${selectedPeriod})`}
                </h3>
                <p className="text-xs text-amber-100">Bởi Tổ trưởng {leaderName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn giáo viên *</label>
                <select
                  disabled={Boolean(editingRecord)}
                  value={recordFormData.teacherId}
                  onChange={(e) => setRecordFormData({ ...recordFormData, teacherId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.assignedClass} ({m.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giờ dạy thao giảng / Dự giờ</label>
                <input
                  type="text"
                  placeholder="VD: 2 tiết Tốt (Thao giảng cụm trường)"
                  value={recordFormData.lessonObservationsScore}
                  onChange={(e) => setRecordFormData({ ...recordFormData, lessonObservationsScore: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hồ sơ sổ sách</label>
                  <select
                    value={recordFormData.recordBooksRating}
                    onChange={(e) => setRecordFormData({ ...recordFormData, recordBooksRating: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Đạt">Đạt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chất lượng học sinh</label>
                  <select
                    value={recordFormData.studentProgressRating}
                    onChange={(e) => setRecordFormData({ ...recordFormData, studentProgressRating: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Đạt">Đạt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sáng kiến kinh nghiệm / Đổi mới PP dạy học</label>
                <input
                  type="text"
                  placeholder="VD: Biện pháp rèn kỹ năng giải toán có lời văn cho HS lớp 5"
                  value={recordFormData.innovationInitiative}
                  onChange={(e) => setRecordFormData({ ...recordFormData, innovationInitiative: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Xếp loại đánh giá chung *</label>
                  <select
                    value={recordFormData.overallEvaluation}
                    onChange={(e) => setRecordFormData({ ...recordFormData, overallEvaluation: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold text-amber-900"
                  >
                    <option value="Hoàn thành Xuất sắc">Hoàn thành Xuất sắc</option>
                    <option value="Hoàn thành Tốt">Hoàn thành Tốt</option>
                    <option value="Hoàn thành">Hoàn thành nhiệm vụ</option>
                    <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh hiệu đề xuất</label>
                  <select
                    value={recordFormData.proposedTitle}
                    onChange={(e) => setRecordFormData({ ...recordFormData, proposedTitle: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="Lao động Tiên tiến">Lao động Tiên tiến</option>
                    <option value="Chiến sĩ thi đua cơ sở">Chiến sĩ thi đua cơ sở</option>
                    <option value="Giấy khen UBND huyện">Giấy khen UBND huyện</option>
                    <option value="Hoàn thành tốt NV">Hoàn thành tốt NV</option>
                    <option value="Hoàn thành NV">Hoàn thành NV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhận xét của Tổ trưởng</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận xét cụ thể về năng lực, tinh thần trách nhiệm..."
                  value={recordFormData.notes}
                  onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 leading-relaxed"
                />
              </div>

              {/* Tệp báo cáo thành tích đính kèm */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Báo cáo thành tích / Minh chứng (nếu có)</label>
                <FileUploadInput
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setRecordFormData(prev => ({
                      ...prev,
                      attachedFileName: fileName,
                      attachedFileSize: fileSize,
                      attachedFileDataUrl: fileDataUrl
                    }));
                  }}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Kết Quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Record Modal */}
      {deletingRecord && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => {
            onDeleteRecord(deletingRecord.id);
            setDeletingRecord(null);
          }}
          title="Xác nhận xóa đánh giá thi đua"
          itemName={deletingRecord.teacherName}
          description="Đánh giá kết quả thi đua của giáo viên này sẽ bị xóa khỏi hệ thống."
        />
      )}

      {/* Delete Doc Modal */}
      {deletingDoc && onDeleteEmulationDoc && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeletingDoc(null)}
          onConfirm={() => {
            onDeleteEmulationDoc(deletingDoc.id);
            setDeletingDoc(null);
          }}
          title="Xác nhận xóa tệp kết quả thi đua"
          itemName={`${deletingDoc.fileName} (${deletingDoc.title})`}
          description="Tệp đính kèm kết quả thi đua này sẽ bị xóa vĩnh viễn khỏi hệ thống."
        />
      )}
    </div>
  );
};
