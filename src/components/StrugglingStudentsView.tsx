import React, { useState } from 'react';
import { StrugglingStudent, TeacherMember } from '../types';
import { 
  TrendingDown, 
  PlusCircle, 
  CheckCircle, 
  Filter, 
  Search, 
  UserMinus, 
  Trash2,
  Edit3, 
  Sparkles, 
  Printer,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType } from '../utils/fileHelpers';

interface StrugglingStudentsViewProps {
  students: StrugglingStudent[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  onAddStudent: (student: StrugglingStudent) => void;
  onUpdateStudent: (student: StrugglingStudent) => void;
  onRemoveStudent: (studentId: string) => void;
}

const SUBJECTS = [
  'Tất cả các môn',
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'Khoa học',
  'Lịch sử & Địa lý',
  'Tin học & Công nghệ',
  'Đạo đức'
];

export const StrugglingStudentsView: React.FC<StrugglingStudentsViewProps> = ({
  students,
  members,
  currentUser,
  onAddStudent,
  onUpdateStudent,
  onRemoveStudent
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Tất cả các môn');
  const [selectedClass, setSelectedClass] = useState<string>('Tất cả các lớp');
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | 'Cần kèm cặp' | 'Đã hoàn thành'>('Tất cả');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StrugglingStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StrugglingStudent | null>(null);

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

  const [formData, setFormData] = useState<{
    name: string;
    classId: string;
    subject: string;
    weaknessDetail: string;
    supportAction: string;
    progressStatus: 'Cần nỗ lực nhiều' | 'Đang cải thiện' | 'Đã hoàn thành mục tiêu';
    currentScoreOrLevel: string;
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    name: '',
    classId: initialTeacher.id,
    subject: 'Toán',
    weaknessDetail: '',
    supportAction: '',
    progressStatus: 'Cần nỗ lực nhiều',
    currentScoreOrLevel: '',
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  // Unique classes for filter
  const classList = Array.from(new Set(members.map(m => m.assignedClass).filter(Boolean)));

  const filteredStudents = students.filter(st => {
    const matchSubject = selectedSubject === 'Tất cả các môn' || st.subject === selectedSubject;
    const matchClass = selectedClass === 'Tất cả các lớp' || st.className === selectedClass;
    const matchStatus = 
      statusFilter === 'Tất cả' ? true :
      statusFilter === 'Đã hoàn thành' ? st.progressStatus === 'Đã hoàn thành mục tiêu' :
      st.progressStatus !== 'Đã hoàn thành mục tiêu';
    const matchSearch = searchTerm === '' || 
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.weaknessDetail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.className.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSubject && matchClass && matchStatus && matchSearch;
  });

  const countActive = students.filter(s => s.progressStatus !== 'Đã hoàn thành mục tiêu').length;
  const countResolved = students.filter(s => s.progressStatus === 'Đã hoàn thành mục tiêu').length;

  const handleExportExcel = () => {
    let csv = `\uFEFFTRƯỜNG TIỂU HỌC MỸ THẠNH - TỔ CHUYÊN MÔN KHỐI 2\n`;
    csv += `DANH SÁCH THEO DÕI HỌC SINH CHƯA HOÀN THÀNH NHIỆM VỤ HỌC TẬP TỪNG MÔN\n`;
    csv += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    csv += `STT,Họ và tên học sinh,Lớp,Giáo viên phụ trách,Môn học,Nội dung chưa hoàn thành / Khó khăn,Biện pháp kèm cặp - Phụ đạo,Mức độ hiện tại,Tiến độ / Trạng thái,Ngày đưa vào DS,Ngày hoàn thành\n`;
    filteredStudents.forEach((st, idx) => {
      csv += `${idx + 1},"${st.name}","${st.className}","${st.teacherName}","${st.subject}","${(st.weaknessDetail || '').replace(/"/g, '""')}","${(st.supportAction || '').replace(/"/g, '""')}","${(st.currentScoreOrLevel || '').replace(/"/g, '""')}","${st.progressStatus}","${st.dateAdded}","${st.resolvedDate || ''}"\n`;
    });
    downloadFile(`TheoDoi_HocSinh_ChamTienBo_Khoi2.xlsx`, undefined, csv);
  };

  const handleExportWord = () => {
    let doc = `TRƯỜNG TIỂU HỌC MỸ THẠNH - TỔ CHUYÊN MÔN KHỐI 2\n`;
    doc += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n`;
    doc += `SỔ THEO DÕI VÀ KẾ HOẠCH PHỤ ĐẠO HỌC SINH CHƯA ĐẠT CHUẨN KIẾN THỨC KĨ NĂNG\n`;
    doc += `Thời gian xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    filteredStudents.forEach((st, idx) => {
      doc += `${idx + 1}. Học sinh: ${st.name} - Lớp: ${st.className} (GV: ${st.teacherName})\n`;
      doc += `   - Môn cần hỗ trợ: ${st.subject}\n`;
      doc += `   - Nội dung chưa đạt chuẩn: ${st.weaknessDetail}\n`;
      doc += `   - Biện pháp can thiệp / Kèm cặp: ${st.supportAction}\n`;
      doc += `   - Kết quả & Tiến độ: ${st.progressStatus} (${st.currentScoreOrLevel})\n`;
      doc += `   - Ngày vào DS: ${st.dateAdded} ${st.resolvedDate ? `- Ngày hoàn thành: ${st.resolvedDate}` : ''}\n\n`;
    });
    downloadFile(`KeHoach_PhuDao_HocSinh_Khoi2.docx`, undefined, doc);
  };

  const handleOpenModal = (student?: StrugglingStudent) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        classId: student.teacherId,
        subject: student.subject,
        weaknessDetail: student.weaknessDetail,
        supportAction: student.supportAction,
        progressStatus: student.progressStatus,
        currentScoreOrLevel: student.currentScoreOrLevel,
        attachedFileName: student.attachedFileName || '',
        attachedFileSize: student.attachedFileSize || '',
        attachedFileDataUrl: student.attachedFileDataUrl
      });
    } else {
      setEditingStudent(null);
      const defaultTeacher = getInitialTeacher();
      setFormData({
        name: '',
        classId: defaultTeacher.id,
        subject: 'Toán',
        weaknessDetail: '',
        supportAction: 'Kèm cặp 15 phút đầu giờ, liên hệ phụ huynh cùng phối hợp, giao bài tập vừa sức',
        progressStatus: 'Cần nỗ lực nhiều',
        currentScoreOrLevel: 'Chưa đạt chuẩn đầu ra bài học',
        attachedFileName: '',
        attachedFileSize: '',
        attachedFileDataUrl: undefined
      });
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let teacher = homeroomTeachers.find(m => m.id === formData.classId) || homeroomTeachers[0] || members[0];

    if (editingStudent) {
      const updated: StrugglingStudent = {
        ...editingStudent,
        name: formData.name,
        className: teacher.assignedClass,
        campus: teacher.campus,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: formData.subject,
        weaknessDetail: formData.weaknessDetail,
        supportAction: formData.supportAction,
        progressStatus: formData.progressStatus,
        currentScoreOrLevel: formData.currentScoreOrLevel,
        resolvedDate: formData.progressStatus === 'Đã hoàn thành mục tiêu' 
          ? (editingStudent.resolvedDate || new Date().toLocaleDateString('vi-VN'))
          : undefined,
        attachedFileName: formData.attachedFileName || undefined,
        attachedFileSize: formData.attachedFileSize || undefined,
        attachedFileDataUrl: formData.attachedFileDataUrl
      };
      onUpdateStudent(updated);
    } else {
      const newSt: StrugglingStudent = {
        id: 'st-' + Date.now(),
        name: formData.name,
        className: teacher.assignedClass,
        campus: teacher.campus,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: formData.subject,
        weaknessDetail: formData.weaknessDetail,
        supportAction: formData.supportAction,
        progressStatus: formData.progressStatus,
        currentScoreOrLevel: formData.currentScoreOrLevel,
        dateAdded: new Date().toLocaleDateString('vi-VN'),
        attachedFileName: formData.attachedFileName || undefined,
        attachedFileSize: formData.attachedFileSize || undefined,
        attachedFileDataUrl: formData.attachedFileDataUrl
      };
      onAddStudent(newSt);
    }
    setShowModal(false);
  };

  const handleMarkResolved = (student: StrugglingStudent) => {
    const updated: StrugglingStudent = {
      ...student,
      progressStatus: 'Đã hoàn thành mục tiêu',
      resolvedDate: new Date().toLocaleDateString('vi-VN'),
      currentScoreOrLevel: 'Đã hoàn thành nhiệm vụ học tập môn ' + student.subject
    };
    onUpdateStudent(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh 2
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Theo Dõi Học Sinh Còn Chậm Tiến Bộ Từng Môn
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lập danh sách học sinh chưa hoàn thành nhiệm vụ học tập, xây dựng kế hoạch phụ đạo và ghi nhận kết quả tiến bộ (Có thể thêm/bỏ học sinh).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm HS Cần Hỗ Trợ</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất danh sách theo dõi ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="bg-blue-800 hover:bg-blue-900 text-white font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất kế hoạch phụ đạo ra file Word (.docx)"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất Word</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 border border-slate-300"
            >
              <Printer className="w-4 h-4" />
              <span>In Sổ Theo Dõi</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <select
              aria-label="Lọc theo môn học"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              aria-label="Lọc theo lớp học"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none"
            >
              <option value="Tất cả các lớp">Tất cả các lớp</option>
              {classList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('Tất cả')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${statusFilter === 'Tất cả' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Cần kèm cặp')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${statusFilter === 'Cần kèm cặp' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Đang kèm ({countActive})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Đã hoàn thành')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${statusFilter === 'Đã hoàn thành' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Đã tiến bộ ({countResolved})
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <TrendingDown className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold">Không tìm thấy học sinh nào phù hợp bộ lọc.</p>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể tạo học sinh mới cần kèm cặp bằng nút phía trên.
            </p>
          </div>
        ) : (
          filteredStudents.map((st) => {
            const isResolved = st.progressStatus === 'Đã hoàn thành mục tiêu';
            const isImproving = st.progressStatus === 'Đang cải thiện';
            const canManage = currentUser.isLeader || currentUser.id === st.teacherId;

            return (
              <div 
                key={st.id} 
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isResolved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-slate-900">{st.name}</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {st.className}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{st.campus} • GV: {st.teacherName}</span>
                    </div>

                    <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                      Môn {st.subject}
                    </span>
                  </div>

                  {/* Weakness & Support Box */}
                  <div className="space-y-2 text-xs">
                    <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-100">
                      <span className="font-bold text-red-900 block text-[11px] mb-0.5">
                        Khó khăn / Nội dung chưa hoàn thành:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{st.weaknessDetail}</p>
                    </div>

                    <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                      <span className="font-bold text-blue-900 block text-[11px] mb-0.5">
                        Biện pháp hỗ trợ của giáo viên:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{st.supportAction}</p>
                    </div>
                  </div>

                  {/* Progress notes */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Kết quả theo dõi định kỳ:</span>
                      <span>Ngày thêm: {st.dateAdded}</span>
                    </div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{st.currentScoreOrLevel || 'Chưa cập nhật kết quả mới nhất'}</span>
                    </div>
                    {st.resolvedDate && (
                      <div className="text-[11px] text-emerald-700 font-bold mt-1">
                        ✓ Hoàn thành mục tiêu ngày: {st.resolvedDate}
                      </div>
                    )}
                    {st.attachedFileName && (() => {
                      const type = detectFileType(st.attachedFileName);
                      return (
                        <div className="pt-2 mt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 truncate text-slate-700 font-medium">
                            {type === 'excel' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span className="truncate max-w-[140px] text-[11px]">{st.attachedFileName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const fallback = `PHIẾU THEO DÕI HỌC SINH: ${st.name}\nLớp: ${st.className} - GV: ${st.teacherName}\nMôn: ${st.subject}\nKhó khăn: ${st.weaknessDetail}\nBiện pháp: ${st.supportAction}\nKết quả: ${st.currentScoreOrLevel}`;
                              downloadFile(st.attachedFileName || `PhuDao_${st.name}.docx`, st.attachedFileDataUrl, fallback);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0"
                            title="Tải kế hoạch/bài tập phụ đạo đính kèm"
                          >
                            <Download className="w-3 h-3" />
                            <span>Tải tệp</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Status Bar & Actions */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span 
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isResolved 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isImproving 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    ● {st.progressStatus}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleMarkResolved(st)}
                        title="Đánh dấu học sinh đã hoàn thành mục tiêu / đưa ra khỏi diện cần phụ đạo"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Đã tiến bộ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenModal(st)}
                      title="Sửa thông tin"
                      className="px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded border border-slate-200 text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingStudent(st)}
                      title="Xóa học sinh này khỏi danh sách (gửi sai hoặc không thuộc diện)"
                      className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingStudent)}
        onClose={() => setDeletingStudent(null)}
        onConfirm={() => {
          if (deletingStudent) {
            onRemoveStudent(deletingStudent.id);
            setDeletingStudent(null);
          }
        }}
        title="Xác nhận xóa học sinh khỏi danh sách"
        itemName={deletingStudent ? `Học sinh: ${deletingStudent.name} (Lớp ${deletingStudent.className}, Môn ${deletingStudent.subject})` : ''}
        description="Thông tin học sinh và kế hoạch phụ đạo này sẽ được xóa khỏi bảng theo dõi."
      />

      {/* Modal: Add or Edit Struggling Student */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-rose-700 to-rose-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingStudent ? 'Cập Nhật Theo Dõi Học Sinh' : 'Thêm Học Sinh Cần Kèm Cặp / Phụ Đạo'}
                </h3>
                <p className="text-xs text-rose-100">
                  Kế hoạch giúp đỡ học sinh chưa hoàn thành chuẩn kiến thức kĩ năng
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

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp &amp; Giáo viên phụ trách kèm cặp
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none font-semibold text-slate-800 bg-white"
                  >
                    {homeroomTeachers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.assignedClass} — GVCN: {m.name} ({m.campus})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học cần hỗ trợ *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  >
                    {SUBJECTS.filter(s => s !== 'Tất cả các môn').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái tiến bộ
                  </label>
                  <select
                    value={formData.progressStatus}
                    onChange={(e) => setFormData({ ...formData, progressStatus: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  >
                    <option value="Cần nỗ lực nhiều">Cần nỗ lực nhiều</option>
                    <option value="Đang cải thiện">Đang cải thiện</option>
                    <option value="Đã hoàn thành mục tiêu">Đã hoàn thành mục tiêu (Rút khỏi diện kèm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung khó khăn, kiến thức chưa nắm vững *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Chưa thuộc bảng chia 7, chia 8; chưa thành thạo cách đặt tính nhân chia số thập phân..."
                  value={formData.weaknessDetail}
                  onChange={(e) => setFormData({ ...formData, weaknessDetail: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biện pháp hỗ trợ, thời gian phụ đạo của giáo viên *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Kèm 15 phút đầu giờ, phân công bạn học khá ngồi cùng bàn, liên hệ phụ huynh cùng đôn đốc..."
                  value={formData.supportAction}
                  onChange={(e) => setFormData({ ...formData, supportAction: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kết quả theo dõi định kỳ / Điểm kiểm tra
                </label>
                <input
                  type="text"
                  placeholder="VD: Điểm KTĐK: 6.0; hoặc Đã thuộc bảng cửu chương..."
                  value={formData.currentScoreOrLevel}
                  onChange={(e) => setFormData({ ...formData, currentScoreOrLevel: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                />
              </div>

              <div>
                <FileUploadInput
                  label="Tệp bài tập / Phiếu theo dõi đính kèm (Word .docx hoặc Excel .xlsx)"
                  helperText="Tùy chọn tải lên phiếu bài tập kèm cặp (Word .docx, .doc), bảng theo dõi điểm số (Excel .xlsx, .xls) hoặc PDF (.pdf)"
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow transition-colors"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
