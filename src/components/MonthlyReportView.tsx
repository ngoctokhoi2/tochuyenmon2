import React, { useState } from 'react';
import { MonthlyReport, TeacherMember, DisabledStudentInfo } from '../types';
import { 
  Users, 
  PlusCircle, 
  FileText, 
  FileSpreadsheet,
  Download,
  HeartHandshake, 
  CheckCircle2, 
  Printer, 
  Trash2, 
  Edit3,
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType } from '../utils/fileHelpers';

interface MonthlyReportViewProps {
  reports: MonthlyReport[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  onSaveReport: (report: MonthlyReport) => void;
  onDeleteReport: (reportId: string) => void;
}

const MONTHS = [
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'
];

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  reports,
  members,
  currentUser,
  onSaveReport,
  onDeleteReport
}) => {
  const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
  const [selectedMonth, setSelectedMonth] = useState<string>('Tháng 9');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<MonthlyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<MonthlyReport | null>(null);

  // List of actual homeroom teachers
  const homeroomTeachers = members.filter(
    m => m.assignedClass && 
    !m.isLeader && 
    !m.assignedClass.includes('Tổ trưởng') && 
    !m.assignedClass.includes('GDTC') &&
    !m.assignedClass.includes('Thư viện')
  );

  const getInitialTeacher = () => {
    if (!currentUser.isLeader && homeroomTeachers.some(m => m.id === currentUser.id)) {
      return currentUser;
    }
    return homeroomTeachers[0] || members[0];
  };

  const initialTeacher = getInitialTeacher();

  // Form state
  const [formData, setFormData] = useState<{
    classId: string;
    totalStudents: number;
    femaleStudents: number;
    ethnicStudents: number;
    studentsMovedIn: number;
    studentsMovedOut: number;
    dropouts: number;
    absenteeismNotes: string;
    disabledStudents: DisabledStudentInfo[];
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    classId: initialTeacher.id,
    totalStudents: initialTeacher.totalStudents || 35,
    femaleStudents: initialTeacher.femaleStudents || 20,
    ethnicStudents: 0,
    studentsMovedIn: 0,
    studentsMovedOut: 0,
    dropouts: 0,
    absenteeismNotes: '',
    disabledStudents: [],
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  // Filter reports by selected month
  const currentMonthReports = reports.filter(r => r.month === selectedMonth);

  // Aggregated totals for the selected month
  const totalStudents = currentMonthReports.reduce((sum, r) => sum + r.totalStudents, 0);
  const totalFemale = currentMonthReports.reduce((sum, r) => sum + r.femaleStudents, 0);
  const totalEthnic = currentMonthReports.reduce((sum, r) => sum + (r.ethnicStudents || 0), 0);
  const totalDisabled = currentMonthReports.reduce((sum, r) => sum + (r.disabledStudentsCount || 0), 0);

  const handleOpenAdd = (reportToEdit?: MonthlyReport) => {
    if (reportToEdit) {
      setEditingReport(reportToEdit);
      const matchedTeacher = homeroomTeachers.find(m => m.id === reportToEdit.teacherId) 
        || homeroomTeachers[0] 
        || members[0];

      setFormData({
        classId: matchedTeacher.id,
        totalStudents: reportToEdit.totalStudents,
        femaleStudents: reportToEdit.femaleStudents,
        ethnicStudents: reportToEdit.ethnicStudents || 0,
        studentsMovedIn: reportToEdit.studentsMovedIn || 0,
        studentsMovedOut: reportToEdit.studentsMovedOut || 0,
        dropouts: reportToEdit.dropouts || 0,
        absenteeismNotes: reportToEdit.absenteeismNotes || '',
        disabledStudents: [...(reportToEdit.disabledStudents || [])],
        attachedFileName: reportToEdit.attachedFileName || '',
        attachedFileSize: reportToEdit.attachedFileSize || '',
        attachedFileDataUrl: reportToEdit.attachedFileDataUrl
      });
    } else {
      setEditingReport(null);
      const teacher = getInitialTeacher();
      setFormData({
        classId: teacher.id,
        totalStudents: teacher.totalStudents || 35,
        femaleStudents: teacher.femaleStudents || 20,
        ethnicStudents: 0,
        studentsMovedIn: 0,
        studentsMovedOut: 0,
        dropouts: 0,
        absenteeismNotes: 'Sĩ số ổn định, nề nếp học tập tốt.',
        disabledStudents: [],
        attachedFileName: '',
        attachedFileSize: '',
        attachedFileDataUrl: undefined
      });
    }
    setShowModal(true);
  };

  const handleExportExcel = () => {
    let csv = `\uFEFFTRƯỜNG TIỂU HỌC MỸ LẠC - TỔ CHUYÊN MÔN KHỐI 2\n`;
    csv += `BÁO CÁO THỐNG KÊ SĨ SỐ HỌC SINH - ${selectedMonth.toUpperCase()}\n`;
    csv += `Tổ trưởng Chuyên môn Khối 2: ${leaderName}\n`;
    csv += `Ngày xuất dữ liệu: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    csv += `STT,Lớp,Giáo viên chủ nhiệm,Điểm trường,Tổng số HS,Nữ,Dân tộc thiểu số,Khuyết tật hòa nhập,Chuyển đến,Chuyển đi,Bỏ học,Ghi chú chuyên cần,Người duyệt,Trạng thái\n`;
    currentMonthReports.forEach((r, idx) => {
      csv += `${idx + 1},"${r.className}","${r.teacherName}","${r.campus}",${r.totalStudents},${r.femaleStudents},${r.ethnicStudents || 0},${r.disabledStudentsCount || 0},${r.studentsMovedIn || 0},${r.studentsMovedOut || 0},${r.dropouts || 0},"${(r.absenteeismNotes || '').replace(/"/g, '""')}","${r.reviewedBy || `Tổ trưởng ${leaderName}`}","${r.status}"\n`;
    });
    csv += `\nTổng cộng:,,,"Toàn khối 2",${totalStudents},${totalFemale},${totalEthnic},${totalDisabled}\n\n`;
    csv += `,"GIÁO VIÊN CHỦ NHIỆM",,,"TỔ TRƯỞNG CHUYÊN MÔN"\n`;
    csv += `,"(Ký và ghi rõ họ tên)",,,"(Ký duyệt)"\n\n\n`;
    csv += `,,,,"${leaderName}"\n`;
    downloadFile(`BaoCao_SiSo_${selectedMonth.replace(/\s+/g, '_')}_Khoi2.xlsx`, undefined, csv);
  };

  const handleExportWord = () => {
    let doc = `TRƯỜNG TIỂU HỌC MỸ LẠC - TỔ KHỐI 2\n`;
    doc += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n`;
    doc += `BÁO CÁO TỔNG HỢP SĨ SỐ VÀ TÌNH HÌNH HỌC SINH ${selectedMonth.toUpperCase()}\n`;
    doc += `Tổ trưởng Chuyên môn Khối 2: ${leaderName}\n`;
    doc += `Thời gian báo cáo: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    doc += `1. TỔNG HỢP TOÀN KHỐI:\n`;
    doc += `- Tổng số học sinh: ${totalStudents} em\n`;
    doc += `- Nữ: ${totalFemale} em\n`;
    doc += `- Dân tộc thiểu số: ${totalEthnic} em\n`;
    doc += `- Học sinh khuyết tật học hòa nhập: ${totalDisabled} em\n\n`;
    doc += `2. CHI TIẾT TỪNG LỚP:\n`;
    currentMonthReports.forEach(r => {
      doc += `+ Lớp ${r.className} (${r.campus}) - GVCN: ${r.teacherName}: Tổng số ${r.totalStudents} HS (Nữ: ${r.femaleStudents}, Khuyết tật: ${r.disabledStudentsCount || 0}). Tình hình: ${r.absenteeismNotes} | Phê duyệt: ${r.reviewedBy || `Tổ trưởng ${leaderName}`}\n`;
    });
    doc += `\n\n        GIÁO VIÊN CHỦ NHIỆM                        TỔ TRƯỞNG CHUYÊN MÔN KHỐI 2\n`;
    doc += `       (Ký, ghi rõ họ tên)                            (Ký và ghi rõ họ tên)\n\n\n\n`;
    doc += `                                                        ${leaderName}\n`;
    downloadFile(`BaoCao_SiSo_${selectedMonth.replace(/\s+/g, '_')}_Khoi2.docx`, undefined, doc);
  };

  const handleAddDisabledStudent = () => {
    const newStudent: DisabledStudentInfo = {
      id: 'dis-' + Date.now(),
      name: '',
      gender: 'Nam',
      disabilityType: 'Khuyết tật vận động nhẹ',
      note: 'Cần hỗ trợ hòa nhập và đánh giá theo Thông tư 27'
    };
    setFormData(prev => ({
      ...prev,
      disabledStudents: [...prev.disabledStudents, newStudent]
    }));
  };

  const handleRemoveDisabledStudent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      disabledStudents: prev.disabledStudents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resolve the assigned homeroom teacher
    let selectedTeacher = homeroomTeachers.find(m => m.id === formData.classId) || homeroomTeachers[0] || members[0];

    const report: MonthlyReport = {
      id: editingReport ? editingReport.id : 'rep-' + Date.now(),
      month: selectedMonth,
      classId: selectedTeacher.id,
      className: selectedTeacher.assignedClass,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      campus: selectedTeacher.campus,
      totalStudents: Number(formData.totalStudents),
      femaleStudents: Number(formData.femaleStudents),
      ethnicStudents: Number(formData.ethnicStudents),
      disabledStudentsCount: formData.disabledStudents.length,
      disabledStudents: formData.disabledStudents,
      studentsMovedIn: Number(formData.studentsMovedIn),
      studentsMovedOut: Number(formData.studentsMovedOut),
      dropouts: Number(formData.dropouts),
      absenteeismNotes: formData.absenteeismNotes,
      submittedAt: editingReport ? editingReport.submittedAt : new Date().toLocaleDateString('vi-VN'),
      status: currentUser.isLeader ? 'Đã duyệt' : (editingReport?.status || 'Chờ duyệt'),
      reviewedBy: currentUser.isLeader ? `Tổ trưởng ${leaderName}` : (editingReport?.reviewedBy || `Tổ trưởng ${leaderName}`),
      reviewedAt: currentUser.isLeader ? new Date().toLocaleDateString('vi-VN') : (editingReport?.reviewedAt || ''),
      attachedFileName: formData.attachedFileName || '',
      attachedFileSize: formData.attachedFileSize || '',
      attachedFileDataUrl: formData.attachedFileDataUrl || ''
    };

    onSaveReport(report);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Month Selector Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh 1
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Báo Cáo Sĩ Số Học Sinh Từng Tháng
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Thống kê sĩ số các lớp, theo dõi học sinh chuyển đi/đến và quản lý danh sách học sinh khuyết tật học hòa nhập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nộp / Cập nhật báo cáo {selectedMonth}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất bảng tổng hợp sĩ số học sinh ra tệp Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="bg-blue-800 hover:bg-blue-900 text-white font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất văn bản báo cáo tổng hợp ra tệp Word (.docx)"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất Word</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 border border-slate-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In biểu mẫu</span>
            </button>
          </div>
        </div>

        {/* Roles information banner */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Tổ trưởng Chuyên môn Khối 2: <strong className="text-blue-900">{leaderName}</strong> (Thẩm định &amp; Ký duyệt)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              GVCN các lớp: <strong>Khối 2</strong> (Nộp báo cáo hàng tháng)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tổ trưởng duyệt báo cáo toàn khối • GVCN nộp báo cáo từng lớp
          </span>
        </div>

        {/* Month Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-slate-100 pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Chọn tháng:
          </span>
          {MONTHS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedMonth === m
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Tổng số HS ({selectedMonth})</span>
          <div className="text-2xl font-black text-slate-800 mt-1 flex items-baseline gap-2">
            {totalStudents}
            <span className="text-xs text-blue-600 font-semibold">
              ({currentMonthReports.length}/{members.filter(m => m.assignedClass.startsWith('5')).length} lớp)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Học sinh Nữ</span>
          <div className="text-2xl font-black text-pink-600 mt-1">
            {totalFemale}{' '}
            <span className="text-xs text-slate-400 font-normal">
              ({totalStudents > 0 ? ((totalFemale / totalStudents) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">HS Khuyết tật hòa nhập</span>
          <div className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
            <HeartHandshake className="w-5 h-5 text-amber-500" />
            {totalDisabled} <span className="text-xs text-slate-500 font-normal">em</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Dân tộc thiểu số</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {totalEthnic} <span className="text-xs text-slate-500 font-normal">em</span>
          </div>
        </div>
      </div>

      {/* Table of Monthly Class Reports */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Bảng Báo Cáo Sĩ Số Chi Tiết Các Lớp - {selectedMonth}
          </h3>
          <span className="text-xs text-slate-500">
            Quy định: Tổ trưởng có quyền duyệt & xóa bài gửi sai
          </span>
        </div>

        {currentMonthReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium">Chưa có báo cáo nào được gửi cho {selectedMonth}.</p>
            <p className="text-xs text-slate-400 mt-1">
              Bấm nút &ldquo;Nộp / Cập nhật báo cáo {selectedMonth}&rdquo; phía trên để gửi thông tin sĩ số lớp bạn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lớp & Điểm trường</th>
                  <th className="py-3 px-4">Giáo viên chủ nhiệm</th>
                  <th className="py-3 px-3 text-center">Tổng HS / Nữ</th>
                  <th className="py-3 px-3 text-center">Dân tộc</th>
                  <th className="py-3 px-4">HS Khuyết tật hòa nhập</th>
                  <th className="py-3 px-4">Tình hình biến động & Chuyên cần</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMonthReports.map((rep) => {
                  const isOwner = currentUser.id === rep.teacherId;
                  const canDelete = currentUser.isLeader || isOwner;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="font-bold text-blue-700">{rep.className}</div>
                        <span className="text-xs text-slate-500">{rep.campus || 'Trường chính'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <span>{rep.teacherName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Nộp ngày: {rep.submittedAt}</span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-semibold">
                        <span className="text-slate-800">{rep.totalStudents}</span>
                        <span className="text-pink-600 font-normal"> / {rep.femaleStudents} nữ</span>
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-600">
                        {rep.ethnicStudents || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        {rep.disabledStudents && rep.disabledStudents.length > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                              <HeartHandshake className="w-3 h-3" />
                              {rep.disabledStudents.length} học sinh
                            </span>
                            <ul className="text-xs text-slate-600 space-y-0.5">
                              {rep.disabledStudents.map((ds, idx) => (
                                <li key={ds.id || idx} className="pl-1 border-l-2 border-amber-400">
                                  <strong>{ds.name}</strong> ({ds.gender}): {ds.disabilityType}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Không có</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{rep.absenteeismNotes || 'Sĩ số ổn định'}</p>
                        {(rep.studentsMovedIn > 0 || rep.studentsMovedOut > 0 || rep.dropouts > 0) && (
                          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                            {rep.studentsMovedIn > 0 && `+${rep.studentsMovedIn} đến `}
                            {rep.studentsMovedOut > 0 && `-${rep.studentsMovedOut} đi `}
                            {rep.dropouts > 0 && `(Bỏ học: ${rep.dropouts})`}
                          </div>
                        )}
                        {rep.attachedFileName && (() => {
                          const type = detectFileType(rep.attachedFileName);
                          return (
                            <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  const fallback = `BÁO CÁO SĨ SỐ THÁNG - LỚP ${rep.className}\nGVCN: ${rep.teacherName}\nTổng số HS: ${rep.totalStudents} (Nữ: ${rep.femaleStudents}, Khuyết tật: ${rep.disabledStudentsCount || 0})\nGhi chú: ${rep.absenteeismNotes}`;
                                  downloadFile(rep.attachedFileName || `BaoCao_SiSo_${rep.className}.docx`, rep.attachedFileDataUrl, fallback);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                                title="Tải tệp đính kèm của lớp này"
                              >
                                {type === 'excel' ? (
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span className="max-w-[120px] truncate">{rep.attachedFileName}</span>
                                <Download className="w-3 h-3 ml-0.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              rep.status === 'Đã duyệt'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {rep.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                            {rep.reviewedBy || (rep.status === 'Đã duyệt' ? `Tổ trưởng ${leaderName}` : '')}
                          </span>
                          {currentUser.isLeader && rep.status !== 'Đã duyệt' && (
                            <button
                              type="button"
                              onClick={() => {
                                onSaveReport({
                                  ...rep,
                                  status: 'Đã duyệt',
                                  reviewedBy: `Tổ trưởng ${leaderName}`,
                                  reviewedAt: new Date().toLocaleDateString('vi-VN')
                                });
                              }}
                              className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-0.5 rounded shadow-2xs transition-colors mt-0.5 inline-flex items-center gap-1"
                              title={`Tổ trưởng ${leaderName} phê duyệt báo cáo này`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                          )}
                          {currentUser.isLeader && rep.status === 'Đã duyệt' && (
                            <button
                              type="button"
                              onClick={() => {
                                onSaveReport({
                                  ...rep,
                                  status: 'Chờ duyệt',
                                  reviewedBy: undefined,
                                  reviewedAt: undefined
                                });
                              }}
                              className="text-[10px] text-slate-400 hover:text-amber-700 underline mt-0.5"
                              title="Hủy duyệt để giáo viên điều chỉnh lại"
                            >
                              Hủy duyệt
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(rep)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReport(rep)}
                          title="Xóa báo cáo gửi sai"
                          className="text-red-600 hover:text-red-800 font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingReport)}
        onClose={() => setDeletingReport(null)}
        onConfirm={() => {
          if (deletingReport) {
            onDeleteReport(deletingReport.id);
            setDeletingReport(null);
          }
        }}
        title="Xác nhận xóa Báo cáo sĩ số"
        itemName={deletingReport ? `Báo cáo sĩ số Lớp ${deletingReport.className} - ${deletingReport.month}` : ''}
        description="Nội dung báo cáo này sẽ bị xóa khỏi hệ thống. Bạn có thể nộp lại báo cáo chính xác bất cứ lúc nào."
      />

      {/* Modal: Add or Edit Monthly Report */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingReport ? 'Chỉnh Sửa Báo Cáo Sĩ Số' : `Nộp Báo Cáo Sĩ Số ${selectedMonth}`}
                </h3>
                <p className="text-xs text-blue-100">
                  Cập nhật chi tiết sĩ số, học sinh khuyết tật học hòa nhập và chuyên cần
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp &amp; Giáo viên chủ nhiệm nộp báo cáo:
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const selected = homeroomTeachers.find(m => m.id === e.target.value);
                      if (selected) {
                        setFormData({
                          ...formData,
                          classId: selected.id,
                          totalStudents: selected.totalStudents || formData.totalStudents,
                          femaleStudents: selected.femaleStudents || formData.femaleStudents
                        });
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800 bg-white"
                  >
                    {homeroomTeachers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.assignedClass} — GVCN: {m.name} ({m.campus})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5 p-2 bg-blue-50 rounded-lg border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                    💡 <strong>Lưu ý:</strong> Giáo viên chủ nhiệm nộp báo cáo cho lớp mình phụ trách. <strong>Tổ trưởng {leaderName}</strong> thẩm định và ký duyệt báo cáo.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tháng báo cáo
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedMonth}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-sm text-slate-600 font-semibold"
                  />
                </div>
              </div>

              {/* Student counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tổng HS</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.totalStudents}
                    onChange={(e) => setFormData({ ...formData, totalStudents: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trong đó Nữ</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.femaleStudents}
                    onChange={(e) => setFormData({ ...formData, femaleStudents: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dân tộc TS</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ethnicStudents}
                    onChange={(e) => setFormData({ ...formData, ethnicStudents: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyển đến / Đi</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="+Đến"
                      title="Chuyển đến"
                      value={formData.studentsMovedIn}
                      onChange={(e) => setFormData({ ...formData, studentsMovedIn: Number(e.target.value) })}
                      className="w-1/2 bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center"
                    />
                    <input
                      type="number"
                      placeholder="-Đi"
                      title="Chuyển đi"
                      value={formData.studentsMovedOut}
                      onChange={(e) => setFormData({ ...formData, studentsMovedOut: Number(e.target.value) })}
                      className="w-1/2 bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Disabled Students Section */}
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">
                        Danh Sách Học Sinh Khuyết Tật Hòa Nhập ({formData.disabledStudents.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Theo dõi hồ sơ y tế, hỗ trợ và đánh giá theo chuẩn Giáo dục hòa nhập
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDisabledStudent}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Thêm HS khuyết tật</span>
                  </button>
                </div>

                {formData.disabledStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-white/70 rounded-lg">
                    Lớp chưa có học sinh khuyết tật học hòa nhập trong danh sách báo cáo.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.disabledStudents.map((ds, index) => (
                      <div key={ds.id || index} className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-900">Học sinh #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDisabledStudent(index)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa HS này
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Họ và tên học sinh"
                            required
                            value={ds.name}
                            onChange={(e) => {
                              const updated = [...formData.disabledStudents];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, disabledStudents: updated });
                            }}
                            className="border border-slate-300 rounded p-1.5 font-medium"
                          />
                          <select
                            value={ds.gender}
                            onChange={(e) => {
                              const updated = [...formData.disabledStudents];
                              updated[index].gender = e.target.value as 'Nam' | 'Nữ';
                              setFormData({ ...formData, disabledStudents: updated });
                            }}
                            className="border border-slate-300 rounded p-1.5"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Dạng tật (Vận động, Khiếm thính, Trí tuệ...)"
                            value={ds.disabilityType}
                            onChange={(e) => {
                              const updated = [...formData.disabledStudents];
                              updated[index].disabilityType = e.target.value;
                              setFormData({ ...formData, disabledStudents: updated });
                            }}
                            className="border border-slate-300 rounded p-1.5"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Ghi chú biện pháp hỗ trợ / kế hoạch GD cá nhân..."
                          value={ds.note}
                          onChange={(e) => {
                            const updated = [...formData.disabledStudents];
                            updated[index].note = e.target.value;
                            setFormData({ ...formData, disabledStudents: updated });
                          }}
                          className="w-full border border-slate-300 rounded p-1.5 text-[11px] text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Absenteeism Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tình hình chuyên cần, học sinh nghỉ học nhiều & Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={formData.absenteeismNotes}
                  onChange={(e) => setFormData({ ...formData, absenteeismNotes: e.target.value })}
                  placeholder="Ghi rõ lý do nếu có học sinh nghỉ học kéo dài hoặc vắng không phép..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <FileUploadInput
                  label="Tệp báo cáo đính kèm (Bảng Excel .xlsx danh sách lớp / Word .docx)"
                  helperText="Tùy chọn đính kèm bảng danh sách học sinh theo dõi (Excel .xlsx, .xls) hoặc bản tường trình (Word .docx, .doc)"
                  currentFileName={formData.attachedFileName}
                  currentFileSize={formData.attachedFileSize}
                  currentFileDataUrl={formData.attachedFileDataUrl}
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setFormData(prev => ({
                      ...prev,
                      attachedFileName: fileName,
                      attachedFileSize: fileSize,
                      attachedFileDataUrl: fileDataUrl
                    }));
                  }}
                  onFileCleared={() => {
                    setFormData(prev => ({
                      ...prev,
                      attachedFileName: '',
                      attachedFileSize: '',
                      attachedFileDataUrl: undefined
                    }));
                  }}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow transition-colors"
                >
                  Lưu & Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sheet View for window.print() */}
      <div className="hidden print:block p-8 bg-white text-black space-y-6 text-sm">
        <div className="flex justify-between items-start border-b pb-4">
          <div className="text-center space-y-0.5">
            <p className="text-xs uppercase font-semibold">UBND XÃ MỸ LẠC</p>
            <p className="font-bold text-xs uppercase">TRƯỜNG TIỂU HỌC MỸ LẠC</p>
            <p className="text-xs font-bold text-blue-900">TỔ CHUYÊN MÔN KHỐI 2</p>
          </div>
          <div className="text-center space-y-0.5">
            <p className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-xs italic underline">Độc lập - Tự do - Hạnh phúc</p>
            <p className="text-[11px] italic mt-1">Mỹ Lạc, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="font-black text-lg uppercase tracking-wide">
            BÁO CÁO THỐNG KÊ SĨ SỐ HỌC SINH - {selectedMonth.toUpperCase()}
          </h1>
          <p className="text-xs italic">
            (Năm học 2026 - 2027 • Quản lý chuyên môn Khối 2)
          </p>
        </div>

        {/* Summary Table */}
        <table className="w-full border-collapse border border-slate-800 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold text-center">
              <th className="border border-slate-800 p-2">STT</th>
              <th className="border border-slate-800 p-2">Lớp</th>
              <th className="border border-slate-800 p-2">Giáo viên chủ nhiệm</th>
              <th className="border border-slate-800 p-2">Điểm trường</th>
              <th className="border border-slate-800 p-2">Tổng HS</th>
              <th className="border border-slate-800 p-2">Nữ</th>
              <th className="border border-slate-800 p-2">Dân tộc</th>
              <th className="border border-slate-800 p-2">Khuyết tật</th>
              <th className="border border-slate-800 p-2">Tình hình chuyên cần</th>
              <th className="border border-slate-800 p-2">Phê duyệt</th>
            </tr>
          </thead>
          <tbody>
            {currentMonthReports.map((r, idx) => (
              <tr key={r.id} className="text-center">
                <td className="border border-slate-800 p-1.5">{idx + 1}</td>
                <td className="border border-slate-800 p-1.5 font-bold">{r.className}</td>
                <td className="border border-slate-800 p-1.5 text-left font-semibold">{r.teacherName}</td>
                <td className="border border-slate-800 p-1.5">{r.campus}</td>
                <td className="border border-slate-800 p-1.5 font-bold">{r.totalStudents}</td>
                <td className="border border-slate-800 p-1.5">{r.femaleStudents}</td>
                <td className="border border-slate-800 p-1.5">{r.ethnicStudents || 0}</td>
                <td className="border border-slate-800 p-1.5">{r.disabledStudentsCount || 0}</td>
                <td className="border border-slate-800 p-1.5 text-left text-[11px]">{r.absenteeismNotes || 'Ổn định'}</td>
                <td className="border border-slate-800 p-1.5 text-[11px]">{r.status}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold text-center">
              <td colSpan={4} className="border border-slate-800 p-2 text-right uppercase">
                TỔNG CỘNG TOÀN KHỐI 5:
              </td>
              <td className="border border-slate-800 p-2">{totalStudents}</td>
              <td className="border border-slate-800 p-2">{totalFemale}</td>
              <td className="border border-slate-800 p-2">{totalEthnic}</td>
              <td className="border border-slate-800 p-2">{totalDisabled}</td>
              <td colSpan={2} className="border border-slate-800 p-2 text-left text-[11px] italic">
                {currentMonthReports.length} lớp đã nộp báo cáo
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-3 text-center pt-8 text-xs">
          <div>
            <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
            <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
            <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
            <div className="h-14"></div>
            <p className="font-bold text-sm">{leaderName}</p>
          </div>
          <div>
            <p className="font-bold uppercase">HIỆU TRƯỞNG DUYỆT</p>
            <p className="italic text-[11px]">(Ký và đóng dấu)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
