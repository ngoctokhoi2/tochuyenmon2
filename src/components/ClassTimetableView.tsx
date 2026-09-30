import React, { useState } from 'react';
import { ClassTimetable, TeacherMember } from '../types';
import { STANDARD_TIMETABLE_GRID } from '../data/initialData';
import { 
  Calendar, 
  CalendarRange, 
  PlusCircle, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileSpreadsheet, 
  Building2, 
  User, 
  Trash2, 
  Edit3, 
  Sparkles, 
  CheckCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Layers,
  Table as TableIcon,
  UploadCloud,
  FileUp,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { FileUploadInput } from './FileUploadInput';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  downloadFile, 
  detectFileType, 
  readFileAsDataUrl 
} from '../utils/fileHelpers';

interface ClassTimetableViewProps {
  timetables: ClassTimetable[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  onSaveTimetable: (timetable: ClassTimetable) => void;
  onDeleteTimetable: (id: string) => void;
  onApproveTimetable?: (id: string, status: 'Đã duyệt' | 'Áp dụng chính thức' | 'Chờ duyệt', feedback?: string) => void;
}

const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'] as const;
const MORNING_PERIODS = [1, 2, 3, 4];
const AFTERNOON_PERIODS = [1, 2, 3];

// Common subjects in primary school grade 2 (GDPT 2018)
const POPULAR_SUBJECTS = [
  'Sinh hoạt dưới cờ',
  'Toán',
  'Tiếng Việt (Đọc)',
  'Tiếng Việt (Viết)',
  'Tiếng Việt (Luyện từ & câu)',
  'Tiếng Anh',
  'Tự nhiên và Xã hội',
  'Đạo đức',
  'Hoạt động trải nghiệm',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Giáo dục địa phương',
  'Tích hợp STEM / Kỹ năng sống',
  'Phụ đạo Toán & Tiếng Việt',
  'Rèn chữ - Giữ vở',
  'Tự học có hướng dẫn',
  'Sinh hoạt lớp (Tổng kết tuần)'
];

// Color mapping for subjects
const getSubjectBadgeStyle = (subject: string): string => {
  if (!subject) return 'bg-slate-50 text-slate-400 border-dashed border-slate-200';
  if (subject.includes('Toán')) return 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
  if (subject.includes('Tiếng Việt')) return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
  if (subject.includes('Tiếng Anh')) return 'bg-teal-50 text-teal-800 border-teal-200 font-semibold';
  if (subject.includes('Tự nhiên') || subject.includes('Xã hội') || subject.includes('Khoa học')) return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  if (subject.includes('Lịch sử')) return 'bg-amber-50 text-amber-900 border-amber-200 font-semibold';
  if (subject.includes('Tin học')) return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
  if (subject.includes('thể chất') || subject.includes('GDTC')) return 'bg-violet-50 text-violet-800 border-violet-200 font-semibold';
  if (subject.includes('Mĩ thuật') || subject.includes('Âm nhạc')) return 'bg-purple-50 text-purple-800 border-purple-200 font-semibold';
  if (subject.includes('dưới cờ') || subject.includes('Sinh hoạt')) return 'bg-red-50 text-red-900 border-red-200 font-bold';
  if (subject.includes('trải nghiệm') || subject.includes('STEM')) return 'bg-orange-50 text-orange-900 border-orange-200 font-semibold';
  if (subject.includes('Đạo đức')) return 'bg-lime-50 text-lime-900 border-lime-200 font-semibold';
  return 'bg-slate-100 text-slate-800 border-slate-200 font-medium';
};

export const ClassTimetableView: React.FC<ClassTimetableViewProps> = ({
  timetables,
  members,
  currentUser,
  onSaveTimetable,
  onDeleteTimetable,
  onApproveTimetable
}) => {
  const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Tất cả');
  const [selectedClassId, setSelectedClassId] = useState<string>(timetables[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showQuickUploadModal, setShowQuickUploadModal] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [deletingItem, setDeletingItem] = useState<ClassTimetable | null>(null);

  // Quick Upload Form State (Exclusively Word files .docx / .doc)
  const [quickForm, setQuickForm] = useState<{
    teacherId: string;
    teacherName: string;
    className: string;
    campus: string;
    effectiveTerm: string;
    effectiveDate: string;
    note: string;
    fileName: string;
    fileSize: string;
    fileType: 'word' | 'excel' | 'pdf' | 'other' | '';
    fileDataUrl?: string;
  }>({
    teacherId: currentUser.id,
    teacherName: currentUser.name,
    className: currentUser.assignedClass.replace(/\(ĐC\)|\(KB\)|\(TB\)|\(TH\)| - Tổ trưởng/g, '').trim() || 'Lớp 2/1',
    campus: 'Trường chính',
    effectiveTerm: 'Học kỳ I (Áp dụng từ Tuần 1)',
    effectiveDate: '05/09/2026',
    note: 'Tệp văn bản Word thời khóa biểu chi tiết do giáo viên bộ môn / chủ nhiệm biên soạn gửi lên.',
    fileName: '',
    fileSize: '',
    fileType: '',
    fileDataUrl: undefined
  });

  // Form State for creating/editing TKB
  const [formState, setFormState] = useState<{
    id?: string;
    teacherId: string;
    teacherName: string;
    className: string;
    campus: string;
    effectiveTerm: string;
    effectiveDate: string;
    note: string;
    scheduleGrid: Record<string, string>;
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    teacherId: currentUser.id,
    teacherName: currentUser.name,
    className: currentUser.assignedClass.replace(/\(ĐC\)|\(KB\)|\(TB\)|\(TH\)| - Tổ trưởng/g, '').trim() || 'Lớp 2/1',
    campus: 'Trường chính',
    effectiveTerm: 'Học kỳ I (Áp dụng từ Tuần 1)',
    effectiveDate: '05/09/2026',
    note: 'Học 2 buổi/ngày: Sáng 4 tiết, Chiều 3 tiết. Đảm bảo đúng định mức chương trình GDPT 2018.',
    scheduleGrid: {},
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  // Approval Form State
  const [approvalFeedback, setApprovalFeedback] = useState<string>('');

  // Filtered timetables (strictly Khối 2 timetables submitted by teachers)
  const filteredTimetables = timetables.filter(item => {
    // Strictly filter out any old mock campuses or mock Grade 5
    if (['Kiến Bình', 'Tân Bình', 'Trương Hoàng', 'Đặng Văn Phấn'].includes(item.campus)) return false;
    if (item.className && (item.className.startsWith('5/') || item.className.startsWith('Lớp 5'))) return false;

    const matchesClass = selectedClassFilter === 'Tất cả' ||
      (selectedClassFilter === 'Môn chuyên'
        ? (!item.className.includes('2/1') && !item.className.includes('2/2') && !item.className.includes('2/3') && !item.className.includes('2/4'))
        : item.className.includes(selectedClassFilter));
    const matchesSearch = 
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Active timetable being viewed in Grid mode
  const currentTimetable = timetables.find(t => t.id === selectedClassId) || filteredTimetables[0] || timetables[0];

  const handleOpenAddModal = (editItem?: ClassTimetable) => {
    if (editItem) {
      setFormState({
        id: editItem.id,
        teacherId: editItem.teacherId,
        teacherName: editItem.teacherName,
        className: editItem.className,
        campus: editItem.campus,
        effectiveTerm: editItem.effectiveTerm,
        effectiveDate: editItem.effectiveDate,
        note: editItem.note || '',
        scheduleGrid: { ...editItem.scheduleGrid },
        attachedFileName: editItem.attachedFileName || '',
        attachedFileSize: editItem.attachedFileSize || '',
        attachedFileDataUrl: editItem.attachedFileDataUrl
      });
    } else {
      // Find class name from currentUser
      const cleanClass = currentUser.assignedClass.replace(/ - Tổ trưởng/g, '').trim();
      setFormState({
        id: undefined,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        className: cleanClass || 'Lớp 2/1',
        campus: currentUser.campus,
        effectiveTerm: 'Học kỳ I (Áp dụng từ Tuần 1)',
        effectiveDate: '05/09/2026',
        note: 'Thời khóa biểu chi tiết do giáo viên bộ môn / chủ nhiệm biên soạn gửi tệp Word.',
        scheduleGrid: { ...STANDARD_TIMETABLE_GRID },
        attachedFileName: '',
        attachedFileSize: '',
        attachedFileDataUrl: undefined
      });
    }
    setShowSubmitModal(true);
  };

  const handleTeacherChange = (teacherId: string) => {
    const member = members.find(m => m.id === teacherId);
    if (member) {
      setFormState(prev => ({
        ...prev,
        teacherId: member.id,
        teacherName: member.name,
        className: member.assignedClass.replace(/ - Tổ trưởng/g, '').trim() || prev.className,
        campus: member.campus
      }));
    }
  };

  const handleCellChange = (session: 'Sang' | 'Chieu', day: string, period: number, subject: string) => {
    const key = `${session}_${day}_${period}`;
    setFormState(prev => ({
      ...prev,
      scheduleGrid: {
        ...prev.scheduleGrid,
        [key]: subject
      }
    }));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.attachedFileName) {
      const fnLower = formState.attachedFileName.toLowerCase();
      if (!fnLower.endsWith('.docx') && !fnLower.endsWith('.doc')) {
        alert('⚠️ Tổ chuyên môn chỉ chấp nhận tệp Word (.docx, .doc). Không chấp nhận tệp Excel!');
        return;
      }
    }

    const newOrUpdated: ClassTimetable = {
      id: formState.id || `tkb-${Date.now()}`,
      teacherId: formState.teacherId,
      teacherName: formState.teacherName,
      className: formState.className,
      campus: formState.campus,
      effectiveTerm: formState.effectiveTerm,
      effectiveDate: formState.effectiveDate,
      note: formState.note,
      scheduleGrid: formState.scheduleGrid,
      attachedFileName: formState.attachedFileName || undefined,
      attachedFileSize: formState.attachedFileSize || undefined,
      attachedFileDataUrl: formState.attachedFileDataUrl,
      status: currentUser.isLeader ? 'Áp dụng chính thức' : 'Chờ duyệt',
      reviewedBy: currentUser.isLeader ? `Tổ trưởng ${leaderName}` : undefined,
      leaderFeedback: currentUser.isLeader ? 'Tổ trưởng đã xem và phê duyệt thời khóa biểu.' : undefined,
      submittedAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN')
    };

    onSaveTimetable(newOrUpdated);
    setSelectedClassId(newOrUpdated.id);
    setShowSubmitModal(false);
  };

  const handleOpenQuickUploadModal = () => {
    const cleanClass = currentUser.assignedClass.replace(/ - Tổ trưởng/g, '').trim();
    setQuickForm({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      className: cleanClass || 'Lớp 2/1',
      campus: currentUser.campus,
      effectiveTerm: 'Học kỳ I (Áp dụng từ Tuần 1)',
      effectiveDate: '05/09/2026',
      note: 'Tệp văn bản Word thời khóa biểu chi tiết do giáo viên bộ môn / chủ nhiệm biên soạn gửi lên.',
      fileName: '',
      fileSize: '',
      fileType: '',
      fileDataUrl: undefined
    });
    setShowQuickUploadModal(true);
  };

  const handleQuickTeacherChange = (teacherId: string) => {
    const member = members.find(m => m.id === teacherId);
    if (member) {
      setQuickForm(prev => ({
        ...prev,
        teacherId: member.id,
        teacherName: member.name,
        className: member.assignedClass.replace(/ - Tổ trưởng/g, '').trim() || prev.className,
        campus: member.campus
      }));
    }
  };

  const handleQuickFileSelected = async (file: File) => {
    try {
      const fileNameLower = file.name.toLowerCase();
      const isWord = fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc');

      if (!isWord) {
        alert('⚠️ Tổ chuyên môn Khối 2 chỉ chấp nhận tệp Thời khóa biểu định dạng Word (.docx, .doc) do giáo viên gửi lên. Tuyệt đối không chấp nhận tệp Excel (.xlsx, .xls)!');
        return;
      }

      const fileInfo = await readFileAsDataUrl(file);
      setQuickForm(prev => ({
        ...prev,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: 'word',
        fileDataUrl: fileInfo.fileDataUrl
      }));
    } catch (err) {
      console.error('Lỗi khi đọc file TKB:', err);
    }
  };

  const handleSaveQuickUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.fileName) {
      alert('Vui lòng chọn hoặc kéo thả tệp Word (.docx/.doc) thời khóa biểu cần tải lên!');
      return;
    }

    const fileNameLower = quickForm.fileName.toLowerCase();
    if (!fileNameLower.endsWith('.docx') && !fileNameLower.endsWith('.doc')) {
      alert('⚠️ Tổ chuyên môn Khối 2 chỉ chấp nhận tệp Word (.docx, .doc). Không chấp nhận tệp Excel!');
      return;
    }

    const newTimetable: ClassTimetable = {
      id: `tkb-${Date.now()}`,
      teacherId: quickForm.teacherId,
      teacherName: quickForm.teacherName,
      className: quickForm.className,
      campus: quickForm.campus,
      effectiveTerm: quickForm.effectiveTerm,
      effectiveDate: quickForm.effectiveDate,
      note: quickForm.note || 'Thời khóa biểu chi tiết do giáo viên gửi đính kèm tệp văn bản Word (.docx).',
      scheduleGrid: { ...STANDARD_TIMETABLE_GRID },
      attachedFileName: quickForm.fileName,
      attachedFileSize: quickForm.fileSize,
      attachedFileDataUrl: quickForm.fileDataUrl,
      status: currentUser.isLeader ? 'Áp dụng chính thức' : 'Chờ duyệt',
      reviewedBy: currentUser.isLeader ? `Tổ trưởng ${leaderName}` : undefined,
      leaderFeedback: currentUser.isLeader ? 'Tổ trưởng đã tiếp nhận tệp Word TKB và phê duyệt lưu hồ sơ chuyên môn.' : undefined,
      submittedAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN')
    };

    onSaveTimetable(newTimetable);
    setSelectedClassId(newTimetable.id);
    setShowQuickUploadModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const isLeader = currentUser.isLeader;

  return (
    <div className="space-y-6">
      {/* Printable Area only visible in window.print() */}
      {currentTimetable && (
        <div className="hidden print:block p-8 bg-white text-black space-y-4">
          <div className="text-center space-y-1 border-b pb-4">
            <p className="font-bold text-xs uppercase">UBND XÃ MỸ THẠNH - TRƯỜNG TIỂU HỌC MỸ THẠNH</p>
            <p className="font-bold text-xs uppercase">TỔ CHUYÊN MÔN KHỐI 2</p>
            <h1 className="font-black text-xl uppercase tracking-wide pt-2">
              THỜI KHÓA BIỂU {currentTimetable.className.toUpperCase().startsWith('LỚP') ? currentTimetable.className.toUpperCase() : `LỚP ${currentTimetable.className.toUpperCase()}`}
            </h1>
            <p className="text-xs italic">
              (Năm học 2026 - 2027 • Trường Tiểu học Mỹ Thạnh • {currentTimetable.effectiveTerm})
            </p>
            <p className="text-xs">
              Giáo viên chủ nhiệm: <strong>{currentTimetable.teacherName}</strong> — Ngày áp dụng: {currentTimetable.effectiveDate}
            </p>
          </div>

          <table className="w-full border-collapse border border-black text-xs text-center my-4">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-2 font-bold w-14">Buổi</th>
                <th className="border border-black p-2 font-bold w-14">Tiết</th>
                {DAYS.map(day => (
                  <th key={day} className="border border-black p-2 font-bold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning */}
              {MORNING_PERIODS.map((period, idx) => (
                <tr key={`print-m-${period}`}>
                  {idx === 0 && (
                    <td rowSpan={MORNING_PERIODS.length} className="border border-black font-bold p-1 bg-slate-50 rotate-text">
                      SÁNG
                    </td>
                  )}
                  <td className="border border-black font-semibold p-1.5">Tiết {period}</td>
                  {DAYS.map(day => (
                    <td key={`print-m-${day}-${period}`} className="border border-black p-2">
                      {currentTimetable.scheduleGrid[`Sang_${day}_${period}`] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Afternoon */}
              {AFTERNOON_PERIODS.map((period, idx) => (
                <tr key={`print-a-${period}`}>
                  {idx === 0 && (
                    <td rowSpan={AFTERNOON_PERIODS.length} className="border border-black font-bold p-1 bg-slate-50">
                      CHIỀU
                    </td>
                  )}
                  <td className="border border-black font-semibold p-1.5">Tiết {period}</td>
                  {DAYS.map(day => (
                    <td key={`print-a-${day}-${period}`} className="border border-black p-2">
                      {currentTimetable.scheduleGrid[`Chieu_${day}_${period}`] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {currentTimetable.note && (
            <p className="text-xs italic">
              * Ghi chú: {currentTimetable.note}
            </p>
          )}

          <div className="grid grid-cols-2 text-center pt-8 text-xs">
            <div>
              <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
              <div className="h-14"></div>
              <p className="font-bold">{currentTimetable.teacherName}</p>
            </div>
            <div>
              <p className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
              <p className="italic text-[11px]">(Ký duyệt)</p>
              <div className="h-14"></div>
              <p className="font-bold">{leaderName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen View */}
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-100 text-teal-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5" />
                Thanh lệnh 8
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Thời Khóa Biểu Các Lớp Dạy Khối 2
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chỉ ghi nhận thời khóa biểu do giáo viên Khối 2 gửi lên (tệp Word .docx, .doc). Đã xóa toàn bộ TKB mẫu và các điểm trường cũ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* GV Gửi TKB bằng tệp Word (.docx) */}
            <button
              type="button"
              onClick={handleOpenQuickUploadModal}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
              title="Giáo viên tải lên tệp thời khóa biểu lớp bằng file Word (.docx, .doc)"
            >
              <UploadCloud className="w-4 h-4 text-blue-100" />
              <span>Tải Lên TKB File Word (.docx)</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium">
              <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Khối 2: Chỉ nhận tệp Word (.docx), không nhận Excel</span>
            </div>

            {currentTimetable && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="In thời khóa biểu lớp đang chọn chuẩn khổ A4"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>In TKB</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              title="Soạn thảo chi tiết trên bảng lưới"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Soạn TKB Chi Tiết</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
          {/* Lớp Khối 2 Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Lớp Khối 2:
            </span>
            {['Tất cả', 'Lớp 2/1', 'Lớp 2/2', 'Lớp 2/3', 'Lớp 2/4', 'Môn chuyên'].map(cls => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClassFilter(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedClassFilter === cls
                    ? 'bg-teal-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm lớp, GV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 w-32 sm:w-40"
              />
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Xem Lưới</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tất Cả Lớp ({filteredTimetables.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTimetables.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500">
          <Calendar className="w-16 h-16 mx-auto text-teal-400 mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Chưa Có Thời Khóa Biểu Nào Được Tải Lên</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Hệ thống đã xoá bỏ toàn bộ TKB mẫu. Chỉ hiển thị thời khóa biểu khi giáo viên chủ nhiệm tải lên tệp của lớp mình và được lưu trữ lâu dài.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenQuickUploadModal}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <FileUp className="w-4 h-4" />
              <span>Tải Lên Tệp Word TKB Lớp Mình</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Soạn Lưới TKB Chi Tiết</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID DETAIL VIEW */
        <div className="space-y-4">
          {/* Class Selector Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
              Chọn Lớp:
            </span>
            {filteredTimetables.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedClassId(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  currentTimetable?.id === item.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{item.className}</span>
                <span className="text-[10px] opacity-80">({item.campus})</span>
                {item.status === 'Áp dụng chính thức' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-300" />
                )}
              </button>
            ))}
          </div>

          {currentTimetable && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Class Header Banner */}
              <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-teal-500/30 text-teal-100 border border-teal-400/40 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {currentTimetable.campus}
                    </span>
                    <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {currentTimetable.effectiveTerm}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      currentTimetable.status === 'Áp dụng chính thức'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-amber-950 font-bold'
                    }`}>
                      {currentTimetable.status === 'Áp dụng chính thức' ? <CheckCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{currentTimetable.status}</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-wide">
                    Thời Khóa Biểu Lớp {currentTimetable.className}
                  </h3>
                  <p className="text-xs text-teal-100 mt-1 flex flex-wrap items-center gap-3">
                    <span>GVCN / Giáo viên dạy: <strong>{currentTimetable.teacherName}</strong></span>
                    <span>•</span>
                    <span>Ngày áp dụng: <strong>{currentTimetable.effectiveDate}</strong></span>
                    <span>•</span>
                    <span>Ngày gửi: {currentTimetable.submittedAt}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* File Download Button if has attachment (Word .docx) */}
                  {currentTimetable.attachedFileName && (
                    <button
                      type="button"
                      onClick={() => downloadFile(currentTimetable.attachedFileName || 'TKB_Lop.docx', currentTimetable.attachedFileDataUrl)}
                      className="bg-blue-600/30 hover:bg-blue-600/50 text-white border border-blue-400/50 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Tải tệp Word TKB do giáo viên gửi về máy"
                    >
                      <FileText className="w-4 h-4 text-blue-300" />
                      <span className="truncate max-w-[160px]">Tải TKB Word: {currentTimetable.attachedFileName}</span>
                      <Download className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(currentTimetable)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa TKB</span>
                  </button>

                  {/* Leader Approval button */}
                  {isLeader && currentTimetable.status !== 'Áp dụng chính thức' && (
                    <button
                      type="button"
                      onClick={() => {
                        setApprovalFeedback(currentTimetable.leaderFeedback || 'Tổ trưởng đã thẩm định và duyệt thời khóa biểu lớp này.');
                        setShowApproveModal(true);
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Duyệt TKB Này</span>
                    </button>
                  )}

                  {/* Delete button (Leader or Author) */}
                  {(isLeader || currentTimetable.teacherId === currentUser.id) && (
                    <button
                      type="button"
                      onClick={() => setDeletingItem(currentTimetable)}
                      className="p-1.5 hover:bg-red-500/20 text-white/80 hover:text-white rounded-lg transition-colors"
                      title="Xóa thời khóa biểu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Note / Guidance Box */}
              {currentTimetable.note && (
                <div className="bg-teal-50/70 border-b border-teal-100 px-5 py-2.5 text-xs text-teal-900 flex items-center gap-2">
                  <span className="font-bold shrink-0">📌 Ghi chú nề nếp &amp; thời gian:</span>
                  <span className="text-slate-700">{currentTimetable.note}</span>
                </div>
              )}

              {/* Leader Feedback Box if approved */}
              {currentTimetable.leaderFeedback && (
                <div className="bg-amber-50/80 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Ý kiến duyệt của {currentTimetable.reviewedBy || `Tổ trưởng ${leaderName}`}:</strong> &ldquo;{currentTimetable.leaderFeedback}&rdquo;
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded shrink-0">
                    Đã thẩm định
                  </span>
                </div>
              )}

              {/* TIMETABLE GRID TABLE */}
              <div className="p-4 sm:p-5 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="border border-slate-200 p-2.5 font-bold w-16 text-center">Buổi</th>
                      <th className="border border-slate-200 p-2.5 font-bold w-16 text-center">Tiết</th>
                      {DAYS.map(day => (
                        <th key={day} className="border border-slate-200 p-2.5 font-bold text-center min-w-[130px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Morning Rows */}
                    {MORNING_PERIODS.map((period, idx) => (
                      <tr key={`m-${period}`} className="hover:bg-slate-50/60 transition-colors">
                        {idx === 0 && (
                          <td
                            rowSpan={MORNING_PERIODS.length}
                            className="border border-slate-200 p-2 text-center font-black bg-amber-50/50 text-amber-900 border-r-2"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span>S</span>
                              <span>Á</span>
                              <span>N</span>
                              <span>G</span>
                              <span className="text-[10px] text-amber-700 font-normal mt-1">4 tiết</span>
                            </div>
                          </td>
                        )}
                        <td className="border border-slate-200 p-2 text-center font-bold text-slate-600 bg-slate-50/40">
                          Tiết {period}
                        </td>
                        {DAYS.map(day => {
                          const subj = currentTimetable.scheduleGrid[`Sang_${day}_${period}`] || '';
                          return (
                            <td key={`cell-m-${day}-${period}`} className="border border-slate-200 p-2 align-middle">
                              {subj ? (
                                <div className={`p-2 rounded-lg border text-xs text-center transition-all ${getSubjectBadgeStyle(subj)}`}>
                                  {subj}
                                </div>
                              ) : (
                                <div className="text-center text-slate-300 italic py-1">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Mid-day Separator */}
                    <tr className="bg-slate-100/90 text-slate-500 font-semibold text-[11px]">
                      <td colSpan={7} className="border border-slate-200 py-1 px-4 text-center tracking-wider">
                        — NGHỈ TRƯA &amp; ĂN BÁN TRÚ —
                      </td>
                    </tr>

                    {/* Afternoon Rows */}
                    {AFTERNOON_PERIODS.map((period, idx) => (
                      <tr key={`a-${period}`} className="hover:bg-slate-50/60 transition-colors">
                        {idx === 0 && (
                          <td
                            rowSpan={AFTERNOON_PERIODS.length}
                            className="border border-slate-200 p-2 text-center font-black bg-indigo-50/50 text-indigo-900 border-r-2"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span>C</span>
                              <span>H</span>
                              <span>I</span>
                              <span>Ề</span>
                              <span>U</span>
                              <span className="text-[10px] text-indigo-700 font-normal mt-1">3 tiết</span>
                            </div>
                          </td>
                        )}
                        <td className="border border-slate-200 p-2 text-center font-bold text-slate-600 bg-slate-50/40">
                          Tiết {period}
                        </td>
                        {DAYS.map(day => {
                          const subj = currentTimetable.scheduleGrid[`Chieu_${day}_${period}`] || '';
                          return (
                            <td key={`cell-a-${day}-${period}`} className="border border-slate-200 p-2 align-middle">
                              {subj ? (
                                <div className={`p-2 rounded-lg border text-xs text-center transition-all ${getSubjectBadgeStyle(subj)}`}>
                                  {subj}
                                </div>
                              ) : (
                                <div className="text-center text-slate-300 italic py-1">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Info Bar */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">Khối 2 - Năm học 2026-2027</span>
                  <span>•</span>
                  <span>Tổng cộng: 35 tiết/tuần (Chuẩn GDPT 2018)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In bản thời khóa biểu này</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CARDS OVERVIEW VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTimetables.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                selectedClassId === item.id ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      {item.campus}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 mt-1">
                      Lớp {item.className}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    item.status === 'Áp dụng chính thức'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {item.status === 'Áp dụng chính thức' ? <CheckCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{item.status}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giáo viên phụ trách:</span>
                    <strong className="text-slate-800">{item.teacherName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kỳ áp dụng:</span>
                    <span>{item.effectiveTerm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày áp dụng:</span>
                    <span className="font-semibold text-slate-700">{item.effectiveDate}</span>
                  </div>
                </div>

                {item.note && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}

                {item.attachedFileName && (
                  <div className="flex items-center justify-between text-xs bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-mono text-slate-700 truncate max-w-[170px]" title={item.attachedFileName}>
                        {item.attachedFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadFile(item.attachedFileName || 'TKB_Lop.docx', item.attachedFileDataUrl)}
                      className="text-blue-700 hover:text-blue-900 font-bold p-1"
                      title="Tải tệp Word TKB"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassId(item.id);
                    setViewMode('grid');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Xem Bảng Lưới</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(item)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Chỉnh sửa TKB"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {(isLeader || item.teacherId === currentUser.id) && (
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Xóa TKB"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            onDeleteTimetable(deletingItem.id);
            setDeletingItem(null);
          }
        }}
        title="Xác nhận xóa Thời khóa biểu"
        itemName={deletingItem ? `Lớp ${deletingItem.className} (${deletingItem.campus})` : ''}
        description="Thời khóa biểu của lớp này sẽ bị xóa khỏi hệ thống của tổ khối 5."
      />

      {/* Modal: Leader Approval */}
      {showApproveModal && currentTimetable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-300" />
                  <span>Tổ Trưởng Thẩm Định &amp; Duyệt TKB</span>
                </h3>
                <p className="text-xs text-teal-100">Lớp {currentTimetable.className} • GV: {currentTimetable.teacherName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ý kiến đánh giá / Phê duyệt của Tổ trưởng {leaderName}:
                </label>
                <textarea
                  rows={3}
                  value={approvalFeedback}
                  onChange={(e) => setApprovalFeedback(e.target.value)}
                  placeholder="Ghi rõ nhận xét về số tiết các môn, bố trí phòng học, tính khoa học của TKB..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onApproveTimetable) {
                      onApproveTimetable(
                        currentTimetable.id,
                        'Áp dụng chính thức',
                        approvalFeedback.trim() || 'Tổ trưởng đã thẩm định và phê duyệt áp dụng chính thức.'
                      );
                    }
                    setShowApproveModal(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Duyệt Áp Dụng Chính Thức</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Teacher Submits / Edits Class Timetable */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-teal-300" />
                  <span>{formState.id ? 'Cập Nhật Thời Khóa Biểu Lớp' : 'Giáo Viên Gửi Thời Khóa Biểu Lớp Đang Dạy'}</span>
                </h3>
                <p className="text-xs text-teal-100">
                  Nhập bảng thời khóa biểu trực quan và đính kèm tệp văn bản (Word, Excel) để Tổ trưởng duyệt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-white/80 hover:text-white font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="submit-timetable-form" onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* General Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên dạy / Chủ nhiệm *
                  </label>
                  <select
                    value={formState.teacherId}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.assignedClass ? `(${m.assignedClass})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp Khối 2 *
                  </label>
                  <select
                    value={formState.className}
                    onChange={(e) => setFormState({ ...formState, className: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                  >
                    <option value="Lớp 2/1">Lớp 2/1</option>
                    <option value="Lớp 2/2">Lớp 2/2</option>
                    <option value="Lớp 2/3">Lớp 2/3</option>
                    <option value="Lớp 2/4">Lớp 2/4</option>
                    <option value="Môn GDTC">Môn GDTC</option>
                    <option value="Môn Tiếng Anh">Môn Tiếng Anh</option>
                    <option value="Môn Tin học">Môn Tin học</option>
                    <option value="Môn Mĩ thuật">Môn Mĩ thuật</option>
                    <option value="Môn Âm nhạc">Môn Âm nhạc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trường *
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Trường Tiểu học Mỹ Thạnh"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu áp dụng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 05/09/2026"
                    value={formState.effectiveDate}
                    onChange={(e) => setFormState({ ...formState, effectiveDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Note / Timing field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời lượng &amp; Ghi chú nề nếp lớp học (Buổi sáng, Buổi chiều)
                </label>
                <input
                  type="text"
                  placeholder="VD: Học 2 buổi/ngày: Sáng 4 tiết (7h15 - 10h30), Chiều 3 tiết (13h45 - 16h10)..."
                  value={formState.note}
                  onChange={(e) => setFormState({ ...formState, note: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* SCHEDULE INTERACTIVE GRID */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Bảng Phân Bổ Môn Học Theo Tiết (Thứ Hai Đến Thứ Sáu):
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">
                    (GV tự do sắp xếp theo đặc thù từng lớp, không bắt buộc theo mẫu cố định)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full border-collapse border border-slate-200 text-xs bg-white">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                      <tr>
                        <th className="border border-slate-200 p-2 w-14 text-center font-bold">Buổi</th>
                        <th className="border border-slate-200 p-2 w-16 text-center font-bold">Tiết</th>
                        {DAYS.map(day => (
                          <th key={day} className="border border-slate-200 p-2 font-bold text-center min-w-[130px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Morning */}
                      {MORNING_PERIODS.map((period, idx) => (
                        <tr key={`edit-m-${period}`}>
                          {idx === 0 && (
                            <td rowSpan={MORNING_PERIODS.length} className="border border-slate-200 p-1 font-bold text-center bg-amber-50 text-amber-900">
                              SÁNG
                            </td>
                          )}
                          <td className="border border-slate-200 p-1.5 font-semibold text-center text-slate-600 bg-slate-50">
                            Tiết {period}
                          </td>
                          {DAYS.map(day => {
                            const val = formState.scheduleGrid[`Sang_${day}_${period}`] || '';
                            return (
                              <td key={`edit-m-${day}-${period}`} className="border border-slate-200 p-1">
                                <input
                                  type="text"
                                  list="subjects-list"
                                  value={val}
                                  placeholder="Nhập môn..."
                                  onChange={(e) => handleCellChange('Sang', day, period, e.target.value)}
                                  className={`w-full p-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-white outline-none ${
                                    val ? 'font-semibold text-slate-800' : 'text-slate-400'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Afternoon */}
                      {AFTERNOON_PERIODS.map((period, idx) => (
                        <tr key={`edit-a-${period}`}>
                          {idx === 0 && (
                            <td rowSpan={AFTERNOON_PERIODS.length} className="border border-slate-200 p-1 font-bold text-center bg-indigo-50 text-indigo-900">
                              CHIỀU
                            </td>
                          )}
                          <td className="border border-slate-200 p-1.5 font-semibold text-center text-slate-600 bg-slate-50">
                            Tiết {period}
                          </td>
                          {DAYS.map(day => {
                            const val = formState.scheduleGrid[`Chieu_${day}_${period}`] || '';
                            return (
                              <td key={`edit-a-${day}-${period}`} className="border border-slate-200 p-1">
                                <input
                                  type="text"
                                  list="subjects-list"
                                  value={val}
                                  placeholder="Nhập môn..."
                                  onChange={(e) => handleCellChange('Chieu', day, period, e.target.value)}
                                  className={`w-full p-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-white outline-none ${
                                    val ? 'font-semibold text-slate-800' : 'text-slate-400'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Datalist for fast subject picking */}
                  <datalist id="subjects-list">
                    {POPULAR_SUBJECTS.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  * Bạn có thể gõ trực tiếp tên môn học hoặc chọn từ danh sách gợi ý.
                </p>
              </div>

              {/* Upload Attachment File (Word file .docx / .doc only) */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-blue-600" />
                    Đính Kèm Tệp Văn Bản Word TKB (.docx, .doc):
                  </span>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
                    Chỉ nhận file Word (Không nhận Excel)
                  </span>
                </div>

                <FileUploadInput
                  label=""
                  helperText="Chỉ chấp nhận tệp Microsoft Word (.docx, .doc) do giáo viên nộp lên. Không chấp nhận tệp Excel."
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  allowedTypes={['word']}
                  disallowedMessage="Chỉ chấp nhận tệp Word (.docx, .doc). Không chấp nhận tệp Excel theo quy định của Tổ chuyên môn!"
                  emptyPromptTitle="Kéo thả hoặc nhấp để chọn tệp Word (.docx, .doc) TKB của giáo viên"
                  currentFileName={formState.attachedFileName}
                  currentFileSize={formState.attachedFileSize}
                  currentFileDataUrl={formState.attachedFileDataUrl}
                  uploadActionLabel="Chọn Tệp Word TKB (.docx)"
                  onFileSelected={({ fileName, fileSize, fileDataUrl, rawFile }) => {
                    if (rawFile) {
                      const fnLower = rawFile.name.toLowerCase();
                      if (!fnLower.endsWith('.docx') && !fnLower.endsWith('.doc')) {
                        alert('⚠️ Tổ chuyên môn Khối 2 chỉ chấp nhận tệp Thời khóa biểu Word (.docx, .doc). Không chấp nhận tệp Excel!');
                        return;
                      }
                    }
                    setFormState(prev => ({
                      ...prev,
                      attachedFileName: fileName,
                      attachedFileSize: fileSize,
                      attachedFileDataUrl: fileDataUrl
                    }));
                  }}
                  onFileCleared={() => {
                    setFormState(prev => ({
                      ...prev,
                      attachedFileName: '',
                      attachedFileSize: '',
                      attachedFileDataUrl: undefined
                    }));
                  }}
                />
              </div>
            </form>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                form="submit-timetable-form"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{formState.id ? 'Lưu Thay Đổi TKB' : 'Gửi TKB Lớp Lên Ứng Dụng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fast Upload Timetable via Word (.docx, .doc) */}
      {showQuickUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-300" />
                  <span>Tải Lên Thời Khóa Biểu File Word (.docx, .doc)</span>
                </h3>
                <p className="text-xs text-blue-100">
                  Khối 2 chỉ sử dụng tệp TKB do các Giáo viên gửi lên bằng Word. Không chấp nhận Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickUploadModal(false)}
                className="text-white/80 hover:text-white font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickUpload} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Notice Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-950 font-bold mb-0.5">
                    Quy định Tổ chuyên môn Khối 2:
                  </strong>
                  Bỏ mẫu TKB chuẩn cố định. Mỗi giáo viên tự biên soạn và gửi tệp <strong>Word (.docx, .doc)</strong> thời khóa biểu lớp mình đang dạy lên hệ thống. Tổ không nhận tệp Excel.
                </div>
              </div>

              {/* Teacher, Class & Campus Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên dạy / Chủ nhiệm *
                  </label>
                  <select
                    value={quickForm.teacherId}
                    onChange={(e) => handleQuickTeacherChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.assignedClass ? `(${m.assignedClass})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp Khối 2 *
                  </label>
                  <select
                    value={quickForm.className}
                    onChange={(e) => setQuickForm({ ...quickForm, className: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="Lớp 2/1">Lớp 2/1</option>
                    <option value="Lớp 2/2">Lớp 2/2</option>
                    <option value="Lớp 2/3">Lớp 2/3</option>
                    <option value="Lớp 2/4">Lớp 2/4</option>
                    <option value="Môn GDTC">Môn GDTC</option>
                    <option value="Môn Tiếng Anh">Môn Tiếng Anh</option>
                    <option value="Môn Tin học">Môn Tin học</option>
                    <option value="Môn Mĩ thuật">Môn Mĩ thuật</option>
                    <option value="Môn Âm nhạc">Môn Âm nhạc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trường *
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Trường Tiểu học Mỹ Thạnh"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Term & Effective Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Áp dụng cho học kỳ / thời gian
                  </label>
                  <input
                    type="text"
                    value={quickForm.effectiveTerm}
                    onChange={(e) => setQuickForm({ ...quickForm, effectiveTerm: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="VD: Học kỳ I (Áp dụng từ Tuần 1)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu áp dụng *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickForm.effectiveDate}
                    onChange={(e) => setQuickForm({ ...quickForm, effectiveDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="VD: 05/09/2026"
                  />
                </div>
              </div>

              {/* Drag & Drop File Input Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Chọn hoặc Kéo thả tệp Word TKB (.docx, .doc) *</span>
                  <span className="text-[11px] text-red-600 font-normal">Không nhận file Excel (.xlsx/.xls)</span>
                </label>
                <FileUploadInput
                  label=""
                  helperText="Chỉ chấp nhận định dạng Microsoft Word (.docx, .doc) do giáo viên biên soạn. Không chấp nhận Excel."
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  allowedTypes={['word']}
                  disallowedMessage="Chỉ chấp nhận tệp Word (.docx, .doc). Không chấp nhận tệp Excel theo quy định của Tổ chuyên môn!"
                  emptyPromptTitle="Kéo thả hoặc nhấp để chọn tệp Word (.docx, .doc) TKB của giáo viên"
                  currentFileName={quickForm.fileName}
                  currentFileSize={quickForm.fileSize}
                  currentFileDataUrl={quickForm.fileDataUrl}
                  uploadActionLabel="Chọn Tệp Word TKB (.docx)"
                  onFileSelected={({ rawFile }) => {
                    if (rawFile) {
                      handleQuickFileSelected(rawFile);
                    }
                  }}
                  onFileCleared={() => {
                    setQuickForm(prev => ({
                      ...prev,
                      fileName: '',
                      fileSize: '',
                      fileType: '',
                      fileDataUrl: undefined
                    }));
                  }}
                />
              </div>

              {/* File Selected Notification */}
              {quickForm.fileName && (
                <div className="p-3 rounded-xl border border-blue-300 bg-blue-50 text-xs flex items-center gap-2.5 text-blue-950 animate-in fade-in">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">📘 Đã chọn tệp Word: {quickForm.fileName} ({quickForm.fileSize})</p>
                    <p className="text-[11px] text-blue-700">Tệp Word này sẽ được gửi đến Tổ trưởng để lưu trữ và thẩm định duyệt hồ sơ chuyên môn.</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú nề nếp / Buổi học của lớp
                </label>
                <input
                  type="text"
                  value={quickForm.note}
                  onChange={(e) => setQuickForm({ ...quickForm, note: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-teal-500"
                  placeholder="VD: Học 2 buổi/ngày: Sáng 4 tiết (7h15 - 10h30), Chiều 3 tiết (13h45 - 16h10)..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={!quickForm.fileName}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs shadow transition-all flex items-center gap-2 ${
                    quickForm.fileName
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Hoàn Tất Tải Lên &amp; Lưu TKB Word</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
