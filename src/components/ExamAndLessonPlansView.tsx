import React, { useState } from 'react';
import { ExamAndLessonPlan, ExamCategory, TeacherMember } from '../types';
import { 
  FolderLock, 
  Folder, 
  Lock, 
  Unlock, 
  Upload, 
  Download, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Key, 
  Trash2, 
  FileCheck,
  FileSpreadsheet,
  FileText,
  Clock,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Send
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType } from '../utils/fileHelpers';
import { isHostServerDevice } from '../utils/onlineSync';

interface ExamAndLessonPlansViewProps {
  items: ExamAndLessonPlan[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  userEmail?: string;
  isHostServer?: boolean;
  secretPasswordLeader: string;
  onSaveItem: (item: ExamAndLessonPlan) => void;
  onApproveItem: (id: string, status: 'Đã duyệt' | 'Yêu cầu chỉnh sửa', reviewNote: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdatePassword: (newPass: string) => void;
}

const FOLDERS: ExamCategory[] = [
  'KHDH',
  'Đề thi GHK I',
  'Đề thi HK I',
  'Đề thi GHK II',
  'Đề thi HK II'
];

// Mẫu nhận xét nhanh dành cho Tổ trưởng khi duyệt đề thi và KHDH
const QUICK_REVIEW_NOTES = [
  'Đề bám sát ma trận Thông tư 27, phân hóa tốt 4 mức độ, duyệt cho photo.',
  'Ma trận, bảng đặc tả và đáp án chi tiết, biểu điểm rõ ràng, đạt chuẩn.',
  'KHDH đúng tiến trình 4 hoạt động theo CV 2345, mục tiêu năng lực rõ ràng, duyệt.',
  'Kế hoạch bài dạy tích hợp QPAN và giáo dục STEM sinh động, đạt yêu cầu.',
  'Yêu cầu bổ sung bảng đặc tả ma trận và điều chỉnh mức độ 3, 4 cho phù hợp.',
  'Cần bổ sung thêm biểu điểm và thang điểm chi tiết cho các câu tự luận.',
  'Cần điều chỉnh lại thời lượng phân bổ và câu hỏi phân hóa cho học sinh.'
];

export const ExamAndLessonPlansView: React.FC<ExamAndLessonPlansViewProps> = ({
  items,
  members,
  currentUser,
  userEmail,
  isHostServer: propIsHostServer,
  secretPasswordLeader,
  onSaveItem,
  onApproveItem,
  onDeleteItem,
  onUpdatePassword
}) => {
  const isHost = typeof propIsHostServer === 'boolean'
    ? propIsHostServer
    : isHostServerDevice(userEmail);
  const [activeFolder, setActiveFolder] = useState<ExamCategory>('Đề thi GHK I');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(Boolean(currentUser.isLeader));
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  // Status Filter & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'Chờ duyệt' | 'Đã duyệt' | 'Yêu cầu chỉnh sửa'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'exam' | 'khdh'>('exam');

  // Review Modal State (Leader inspects and approves/returns results)
  const [reviewingItem, setReviewingItem] = useState<ExamAndLessonPlan | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');

  // Re-submit Modal State (Teacher resubmits corrected plan/exam)
  const [reSubmitItem, setReSubmitItem] = useState<ExamAndLessonPlan | null>(null);
  const [reSubmitFile, setReSubmitFile] = useState<{ fileName: string; fileSize: string; fileDataUrl?: string }>({
    fileName: '',
    fileSize: '',
    fileDataUrl: undefined
  });
  const [reSubmitNote, setReSubmitNote] = useState<string>('');

  // Delete Modal State
  const [deletingItem, setDeletingItem] = useState<ExamAndLessonPlan | null>(null);

  // Form Data for New Upload
  const [formData, setFormData] = useState<{
    folderCategory: ExamCategory;
    title: string;
    classId: string;
    subject: string;
    fileName: string;
    fileSize: string;
    fileDataUrl?: string;
    matrixIncluded: boolean;
    answerKeyIncluded: boolean;
    contentPreview: string;
  }>({
    folderCategory: 'Đề thi GHK I',
    title: '',
    classId: currentUser.id,
    subject: 'Toán',
    fileName: '',
    fileSize: '820 KB',
    fileDataUrl: undefined,
    matrixIncluded: true,
    answerKeyIncluded: true,
    contentPreview: ''
  });

  const isExamFolder = activeFolder.startsWith('Đề thi');
  const isLeaderAuthorized = currentUser.isLeader || isUnlocked;

  const handleOpenUpload = (mode: 'exam' | 'khdh', targetFolder?: ExamCategory) => {
    setUploadMode(mode);
    const chosenFolder: ExamCategory = targetFolder 
      ? targetFolder 
      : (mode === 'khdh' ? 'KHDH' : (activeFolder.startsWith('Đề thi') ? activeFolder : 'Đề thi GHK I'));
    const teacher = members.find(m => m.id === currentUser.id) || members[0];
    
    setFormData({
      folderCategory: chosenFolder,
      title: mode === 'exam' 
        ? `Đề kiểm tra ${chosenFolder} môn Toán - Lớp ${teacher.assignedClass || '5'}` 
        : `KHDH môn Toán - Tuần 1 đến 9 - Lớp ${teacher.assignedClass || '5'}`,
      classId: teacher.id,
      subject: 'Toán',
      fileName: '',
      fileSize: '820 KB',
      fileDataUrl: undefined,
      matrixIncluded: true,
      answerKeyIncluded: true,
      contentPreview: mode === 'exam' 
        ? 'Đề gồm 10 câu (7 câu trắc nghiệm 7 điểm, 3 câu tự luận 3 điểm). Có ma trận và đáp án chi tiết.' 
        : 'Kế hoạch dạy học chi tiết theo phân phối chương trình và SGK mới.'
    });
    setShowUploadModal(true);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === secretPasswordLeader) {
      setIsUnlocked(true);
      setPasswordError('');
      setEnteredPassword('');
    } else {
      setPasswordError('Mật khẩu không chính xác! (Mật khẩu mặc định của Tổ trưởng là: Tt112233)');
    }
  };

  const handleQuickUnlockLeader = () => {
    setIsUnlocked(true);
    setPasswordError('');
  };

  /**
   * Tải tệp tài liệu xuống máy tính:
   * - Tổ trưởng (hoặc đã mở khóa): Luôn luôn được tải xuống để xem, kiểm tra, thẩm định
   * - Giáo viên tác giả: Tải được bản nộp của chính mình
   * - Mọi giáo viên trong tổ: Được tải về bản chính thức sau khi ĐÃ DUYỆT
   */
  const handleDownload = (item: ExamAndLessonPlan, forceLeaderInspection: boolean = false) => {
    const isAuthor = currentUser.id === item.teacherId;
    const isApproved = item.status === 'Đã duyệt';

    if (!isLeaderAuthorized && !isAuthor && !isApproved && !forceLeaderInspection) {
      alert(
        `Tài liệu đang ở trạng thái "${item.status}".\n\n` +
        `Theo quy chế chuyên môn, Đề thi và KHDH cá nhân phải được Tổ trưởng thẩm định và duyệt đạt yêu cầu thì mới mở quyền tải về cho các giáo viên!`
      );
      return;
    }

    const fallbackContent = `TRƯỜNG TIỂU HỌC MỸ THẠNH - TỔ CHUYÊN MÔN KHỐI 2\n` +
      `Thư mục: ${item.folderCategory}\n` +
      `Tiêu đề: ${item.title}\n` +
      `Lớp: ${item.className} (${item.campus})\n` +
      `Giáo viên nộp bài: ${item.teacherName}\n` +
      `Môn học: ${item.subject}\n` +
      `Trạng thái duyệt: ${item.status}\n` +
      `Ngày nộp: ${item.submittedAt}\n` +
      `Ngày thẩm định duyệt: ${item.reviewedAt || 'Chưa duyệt'}\n` +
      `Ý kiến phê duyệt của Tổ trưởng: ${item.reviewNote || (isApproved ? 'Đề bám sát chuẩn kiến thức kĩ năng, đạt yêu cầu.' : 'Đang chờ thẩm định.')}\n\n` +
      `--- NỘI DUNG MA TRẬN & ĐỀ THI / KẾ HOẠCH DẠY HỌC ---\n` +
      `${item.contentPreview || 'Nội dung bám sát ma trận và chương trình giáo dục phổ thông theo hướng dẫn...'}`;

    downloadFile(item.fileName || `${item.title}.docx`, item.fileDataUrl, fallbackContent);
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = members.find(m => m.id === formData.classId) || currentUser;
    const finalFileName = formData.fileName || `${formData.title.replace(/\s+/g, '_')}.docx`;

    const newItem: ExamAndLessonPlan = {
      id: 'exam-' + Date.now(),
      folderCategory: formData.folderCategory,
      title: formData.title,
      className: teacher.assignedClass,
      campus: teacher.campus,
      subject: formData.subject,
      teacherId: teacher.id,
      teacherName: teacher.name,
      fileName: finalFileName,
      fileSize: formData.fileSize || '820 KB',
      fileDataUrl: formData.fileDataUrl,
      submittedAt: new Date().toLocaleDateString('vi-VN'),
      status: 'Chờ duyệt',
      matrixIncluded: formData.matrixIncluded,
      answerKeyIncluded: formData.answerKeyIncluded,
      contentPreview: formData.contentPreview
    };

    onSaveItem(newItem);
    setShowUploadModal(false);
    setFormData({
      folderCategory: activeFolder,
      title: '',
      classId: currentUser.id,
      subject: 'Toán',
      fileName: '',
      fileSize: '820 KB',
      fileDataUrl: undefined,
      matrixIncluded: true,
      answerKeyIncluded: true,
      contentPreview: ''
    });
  };

  // Filter items in active folder
  const currentCategoryItems = items.filter(it => it.folderCategory === activeFolder);
  
  const filteredItems = currentCategoryItems.filter(it => {
    if (statusFilter !== 'all' && it.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = it.title.toLowerCase().includes(q);
      const matchTeacher = it.teacherName.toLowerCase().includes(q);
      const matchClass = it.className.toLowerCase().includes(q);
      const matchSubject = it.subject.toLowerCase().includes(q);
      if (!matchTitle && !matchTeacher && !matchClass && !matchSubject) return false;
    }
    return true;
  });

  const pendingCount = currentCategoryItems.filter(it => it.status === 'Chờ duyệt').length;
  const approvedCount = currentCategoryItems.filter(it => it.status === 'Đã duyệt').length;
  const rejectedCount = currentCategoryItems.filter(it => it.status === 'Yêu cầu chỉnh sửa').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh 4
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                KHDH Cá Nhân &amp; Ngân Hàng Đề Thi Bảo Mật
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Thư mục sắp xếp theo KHDH cá nhân và Ngân hàng đề thi GHK, HK của từng lớp. Tổ trưởng tải tệp xuống thẩm định, duyệt và trả kết quả cho GV. Sau khi duyệt, giáo viên được tải về sử dụng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenUpload('exam')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              title="Tải lên đề thi GHK I, HK I, GHK II, HK II (kèm ma trận và đáp án định dạng Word/Excel)"
            >
              <Upload className="w-4 h-4" />
              <span>Nộp Đề Thi (Word/Excel)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenUpload('khdh', 'KHDH')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              title="Tải lên kế hoạch bài dạy cá nhân (Word/PDF)"
            >
              <Upload className="w-4 h-4" />
              <span>Nộp KHDH Cá Nhân</span>
            </button>

            {currentUser.isLeader && (
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(true)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Đổi mật khẩu TT</span>
              </button>
            )}
          </div>
        </div>

        {/* Folder navigation tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100">
          {FOLDERS.map(f => {
            const isConfidential = f.startsWith('Đề thi');
            const count = items.filter(it => it.folderCategory === f).length;
            const isSelected = activeFolder === f;

            return (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFolder(f)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isConfidential ? (
                  isLeaderAuthorized ? (
                    <Unlock className="w-3.5 h-3.5 text-yellow-300" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )
                ) : (
                  <Folder className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span>{f}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Status Bar for Exam Folders */}
      {isExamFolder && (
        <div className={`p-4 rounded-2xl border transition-all ${
          isLeaderAuthorized 
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300' 
            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${isLeaderAuthorized ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isLeaderAuthorized ? <ShieldCheck className="w-5 h-5" /> : <FolderLock className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                  <span>Thư mục {activeFolder}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isLeaderAuthorized ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isLeaderAuthorized ? 'Đã xác thực quyền Tổ trưởng' : 'Chế độ bảo mật đề thi'}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isLeaderAuthorized ? (
                    <span>
                      Thầy/cô đang có toàn quyền <strong>Tải xuống xem &amp; thẩm định</strong> tất cả đề thi, duyệt và trả kết quả cho giáo viên.
                    </span>
                  ) : (
                    <span>
                      Giáo viên nộp đề thi không cần mật khẩu. <strong>Sau khi được Tổ trưởng duyệt, thầy/cô được tải về sử dụng</strong>. Tổ trưởng mở khóa bảo mật để thẩm định các đề đang chờ.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isLeaderAuthorized ? (
                <button
                  type="button"
                  onClick={() => setIsUnlocked(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-300 hover:bg-emerald-100 text-emerald-800 transition-colors"
                >
                  Khóa quyền TT
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {currentUser.isLeader && (
                    <button
                      type="button"
                      onClick={handleQuickUnlockLeader}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở khóa TT nhanh</span>
                    </button>
                  )}
                  <form onSubmit={handleUnlock} className="flex items-center gap-1.5">
                    <input
                      type="password"
                      placeholder="Mật khẩu TT (Tt112233)"
                      value={enteredPassword}
                      onChange={(e) => {
                        setEnteredPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className="px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl outline-none font-mono w-40 sm:w-44 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Mở khóa</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 font-bold mt-2 pl-9">{passwordError}</p>
          )}
        </div>
      )}

      {/* Workflow Guidance & Status Filter Bar (Thanh Quy Trình Duyệt & Tải Xuống) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Workflow indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide shrink-0">
              Quy trình chuẩn
            </span>
            <span className="text-slate-700 font-medium">
              1. GV nộp đề/KHDH ➔ 2. Tổ trưởng tải xuống xem &amp; thẩm định ➔ 3. Tổ trưởng duyệt &amp; trả kết quả ➔ 4. GV tải bản đã duyệt
            </span>
          </div>

          {pendingCount > 0 && isLeaderAuthorized && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Có {pendingCount} hồ sơ đang chờ Tổ trưởng xem &amp; duyệt!</span>
            </span>
          )}
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({currentCategoryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Chờ duyệt')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                statusFilter === 'Chờ duyệt'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ duyệt ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Đã duyệt')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                statusFilter === 'Đã duyệt'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đã duyệt - Được tải về ({approvedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Yêu cầu chỉnh sửa')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                statusFilter === 'Yêu cầu chỉnh sửa'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cần sửa ({rejectedCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo môn, lớp, giáo viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thông báo phân quyền: Máy lẻ chỉ xem và tải xuống, chỉ máy chủ mới được xóa */}
      {!isHost && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Chế độ Máy lẻ (Máy chia sẻ):</p>
              <p className="text-amber-900 mt-0.5">
                Các máy lẻ chỉ có quyền <strong>Xem nội dung</strong> và <strong>Tải xuống</strong> tài liệu. Nút xóa tài liệu đã được ẩn tự động, chỉ có <strong>Máy chủ (ngoctokhoi2@gmail.com)</strong> mới có quyền xóa.
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-amber-200/90 text-amber-950 font-extrabold px-3 py-1.5 rounded-lg shrink-0 border border-amber-300">
            🔒 Chỉ xem &amp; Tải xuống
          </span>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <Folder className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <p className="font-semibold text-slate-700">
                Không tìm thấy hồ sơ nào trong thư mục &ldquo;{activeFolder}&rdquo;
                {statusFilter !== 'all' ? ` (Trạng thái: ${statusFilter})` : ''}.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Bấm nút bên dưới để nộp đề thi hoặc kế hoạch dạy học lên thư mục này.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              {isExamFolder ? (
                <button
                  type="button"
                  onClick={() => handleOpenUpload('exam', activeFolder)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nộp Đề Thi Lên Ngay</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenUpload('khdh', 'KHDH')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nộp KHDH Cá Nhân Ngay</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isApproved = item.status === 'Đã duyệt';
            const isRejected = item.status === 'Yêu cầu chỉnh sửa';
            const isPending = item.status === 'Chờ duyệt';
            const isAuthor = currentUser.id === item.teacherId;
            const canReview = isLeaderAuthorized;
            // STRICT RULE: Only host machine (máy chủ ngoctokhoi2@gmail.com) is allowed to delete!
            // Client machines (máy lẻ) MUST HIDE the delete button. They can only view and download.
            const canDelete = isHost;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4.5 flex flex-col justify-between transition-all hover:shadow-md ${
                  isApproved
                    ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white ring-1 ring-emerald-200/50'
                    : isRejected
                    ? 'border-rose-300 bg-gradient-to-b from-rose-50/20 to-white'
                    : 'border-amber-200 bg-gradient-to-b from-amber-50/15 to-white'
                }`}
              >
                <div className="space-y-3">
                  {/* Card top badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                      {item.className}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isApproved && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                      {isRejected && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      <span>{item.status}</span>
                    </span>
                  </div>

                  {/* Title and subject */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.title}
                    </h4>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>Môn: <strong className="text-slate-700">{item.subject}</strong></span>
                      <span>Điểm trường: <strong>{item.campus}</strong></span>
                    </div>
                  </div>

                  {/* Submitter & File Info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>GV nộp: <strong className="text-slate-800">{item.teacherName}</strong></span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.submittedAt}</span>
                    </div>
                    <div className="flex gap-2 text-[11px] text-slate-500">
                      {item.matrixIncluded && <span className="text-blue-700 font-semibold">✓ Có Ma trận</span>}
                      {item.answerKeyIncluded && <span className="text-emerald-700 font-semibold">✓ Có Đáp án</span>}
                    </div>
                    
                    {item.fileName && (() => {
                      const type = detectFileType(item.fileName);
                      return (
                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 truncate text-slate-700 font-medium">
                            {type === 'word' ? (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-black text-[9px] uppercase">Word</span>
                            ) : type === 'excel' ? (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded font-black text-[9px] uppercase">Excel</span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-black text-[9px] uppercase">PDF</span>
                            )}
                            <span className="truncate max-w-[170px] sm:max-w-[200px]" title={item.fileName}>
                              {item.fileName}
                            </span>
                          </span>
                          <span className="text-slate-400 font-mono shrink-0 ml-1">({item.fileSize})</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* KHU VỰC KẾT QUẢ THẨM ĐỊNH CỦA TỔ TRƯỞNG & THANH TẢI VỀ */}
                  {isApproved && (
                    <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>ĐÃ ĐƯỢC TỔ TRƯỞNG PHÊ DUYỆT</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-200/70 px-2 py-0.2 rounded font-mono">
                          {item.reviewedAt || 'Đã duyệt'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-100 italic">
                        &ldquo;{item.reviewNote || 'Đề bám sát chuẩn kiến thức kĩ năng, đã duyệt cho photo và sử dụng.'}&rdquo;
                      </div>

                      {/* Thanh Tải Về Dành Cho Giáo Viên Sau Khi Được Duyệt */}
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                        title="Tải về bản đề thi / KHDH chính thức đã được Tổ trưởng phê duyệt"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải Về Bản Đã Duyệt Cho GV ({item.fileName})</span>
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>ĐANG CHỜ TỔ TRƯỞNG THẨM ĐỊNH</span>
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.2 rounded font-semibold">
                          Chờ duyệt
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Tổ trưởng tải tệp xuống kiểm tra ma trận, đặc tả và đáp án trước khi duyệt. Sau khi duyệt, giáo viên được tải về bản chính thức.
                      </p>

                      {/* Nút tác vụ thẩm định dành cho Tổ trưởng */}
                      {isLeaderAuthorized ? (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(item, true)}
                            className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                            title="Tải tệp của giáo viên về máy để mở xem, thẩm định"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải xuống xem</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewingItem(item);
                              setReviewNoteInput(item.reviewNote || '');
                            }}
                            className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                            title="Duyệt hoặc yêu cầu chỉnh sửa và gửi kết quả cho GV"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Duyệt &amp; trả kết quả</span>
                          </button>
                        </div>
                      ) : isAuthor ? (
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="py-1 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải bản nộp của tôi</span>
                          </button>
                          <span className="text-[11px] text-amber-700 italic">Đang chờ TT duyệt...</span>
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Chờ Tổ trưởng duyệt để tải về</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-3 bg-rose-50/90 border border-rose-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>TỔ TRƯỞNG YÊU CẦU CHỈNH SỬA</span>
                        </span>
                        <span className="text-[10px] text-rose-800 bg-rose-200/70 px-2 py-0.2 rounded font-mono">
                          {item.reviewedAt || 'Cần sửa'}
                        </span>
                      </div>

                      <div className="text-xs text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-[11px] text-rose-950 block mb-0.5">
                          Ý kiến góp ý của Tổ trưởng:
                        </span>
                        <p className="italic">&ldquo;{item.reviewNote || 'Cần điều chỉnh lại theo góp ý chuyên môn.'}&rdquo;</p>
                      </div>

                      {/* Hành động dành cho GV hoặc Tổ trưởng */}
                      {isLeaderAuthorized ? (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(item, true)}
                            className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải xem lại</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingItem(item);
                              setReviewNoteInput(item.reviewNote || '');
                            }}
                            className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Thẩm định lại</span>
                          </button>
                        </div>
                      ) : isAuthor ? (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Bản cũ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReSubmitItem(item);
                              setReSubmitFile({ fileName: '', fileSize: '' });
                              setReSubmitNote('');
                            }}
                            className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Nộp Lại Bản Đã Sửa</span>
                          </button>
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>GV đang chỉnh sửa lại theo góp ý</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {canReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingItem(item);
                          setReviewNoteInput(item.reviewNote || '');
                        }}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                        title="Tổ trưởng thẩm định và trả kết quả cho GV"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Duyệt hồ sơ</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        title="Xóa đề thi / KHDH này (Yêu cầu mật khẩu Tổ trưởng)"
                        className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {/* Nút tải tệp phụ trợ */}
                  <button
                    type="button"
                    onClick={() => handleDownload(item, canReview)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      isApproved || canReview || isAuthor
                        ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title={
                      !isApproved && !canReview && !isAuthor
                        ? 'Tổ trưởng chưa duyệt nên chưa thể tải về'
                        : 'Tải tệp về máy'
                    }
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Teacher Re-submits Corrected Document */}
      {reSubmitItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-red-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-200" />
                  <span>Nộp Lại Bản Đã Chỉnh Sửa</span>
                </h3>
                <p className="text-xs text-amber-100 truncate max-w-sm">
                  {reSubmitItem.title} - Lớp {reSubmitItem.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReSubmitItem(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form
              id="resubmit-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reSubmitFile.fileName) {
                  alert('Vui lòng chọn tệp đã chỉnh sửa từ máy tính của bạn!');
                  return;
                }
                const updated: ExamAndLessonPlan = {
                  ...reSubmitItem,
                  fileName: reSubmitFile.fileName,
                  fileSize: reSubmitFile.fileSize || '800 KB',
                  fileDataUrl: reSubmitFile.fileDataUrl || reSubmitItem.fileDataUrl,
                  status: 'Chờ duyệt',
                  submittedAt: new Date().toLocaleDateString('vi-VN'),
                  reviewNote: undefined,
                  reviewedAt: undefined,
                  contentPreview: reSubmitNote || reSubmitItem.contentPreview
                };
                onSaveItem(updated);
                setReSubmitItem(null);
                setReSubmitFile({ fileName: '', fileSize: '' });
                setReSubmitNote('');
              }}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {/* Previous feedback from leader */}
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-900 block flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Ý kiến yêu cầu chỉnh sửa của Tổ trưởng:
                </span>
                <p className="text-xs text-rose-800 italic bg-white/70 p-2 rounded-lg border border-rose-100">
                  &ldquo;{reSubmitItem.reviewNote || 'Cần điều chỉnh lại theo góp ý chuyên môn.'}&rdquo;
                </p>
              </div>

              {/* Upload corrected file */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn tệp đề thi / KHDH mới đã hoàn thiện chỉnh sửa (Word/Excel) *
                </label>
                <FileUploadInput
                  currentFileName={reSubmitFile.fileName}
                  currentFileSize={reSubmitFile.fileSize}
                  currentFileDataUrl={reSubmitFile.fileDataUrl}
                  uploadActionLabel="Đưa Bản Sửa Lên"
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setReSubmitFile({ fileName, fileSize, fileDataUrl });
                  }}
                  onFileCleared={() => {
                    setReSubmitFile({ fileName: '', fileSize: '', fileDataUrl: undefined });
                  }}
                  required
                />
              </div>

              {/* Note what was changed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú những điểm đã tiếp thu &amp; sửa đổi cho Tổ trưởng
                </label>
                <textarea
                  rows={2}
                  value={reSubmitNote}
                  onChange={(e) => setReSubmitNote(e.target.value)}
                  placeholder="Ví dụ: Đã bổ sung ma trận đặc tả chi tiết và chỉnh lại thang điểm câu 8 theo góp ý..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setReSubmitItem(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="resubmit-form"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Gửi Lại Cho Tổ Trưởng Thẩm Định</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Item (Exam or KHDH) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 flex items-center justify-between text-white shrink-0 ${
              formData.folderCategory.startsWith('Đề thi')
                ? 'bg-gradient-to-r from-red-600 to-amber-700'
                : 'bg-gradient-to-r from-blue-700 to-indigo-800'
            }`}>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span>
                    {formData.folderCategory.startsWith('Đề thi')
                      ? 'Nộp Đề Kiểm Tra & Đáp Án'
                      : 'Nộp Kế Hoạch Dạy Học Cá Nhân'}
                  </span>
                </h3>
                <p className="text-xs text-white/80">
                  Thư mục: <strong>{formData.folderCategory}</strong> • Đính kèm file Word/Excel/PDF
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

            <form id="upload-exam-form" onSubmit={handleSaveUpload} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thư mục lưu trữ *
                  </label>
                  <select
                    value={formData.folderCategory}
                    onChange={(e) => setFormData({ ...formData, folderCategory: e.target.value as ExamCategory })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {FOLDERS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên / Lớp nộp bài *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.assignedClass} - {m.name} ({m.campus})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Môn học *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Toán">Toán</option>
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="Lịch sử & Địa lý">Lịch sử &amp; Địa lý</option>
                  <option value="Khoa học">Khoa học</option>
                  <option value="Tin học & Công nghệ">Tin học &amp; Công nghệ</option>
                  <option value="Đạo đức">Đạo đức</option>
                  <option value="Toán & Tiếng Việt">Toán &amp; Tiếng Việt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề đề thi / Kế hoạch dạy học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề kiểm tra GHK I môn Toán 5 kèm ma trận & đáp án..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* File upload from computer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tải tệp từ máy tính (Word .docx, Excel .xlsx hoặc PDF) *
                </label>
                <FileUploadInput
                  currentFileName={formData.fileName}
                  currentFileSize={formData.fileSize}
                  currentFileDataUrl={formData.fileDataUrl}
                  uploadActionLabel={formData.folderCategory.startsWith('Đề thi') ? 'Đưa Đề Thi Lên Hệ Thống' : 'Đưa KHDH Lên Hệ Thống'}
                  onUploadAction={() => {
                    const formEl = document.getElementById('upload-exam-form') as HTMLFormElement | null;
                    if (formEl) formEl.requestSubmit();
                  }}
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setFormData(prev => ({
                      ...prev,
                      fileName,
                      fileSize,
                      fileDataUrl
                    }));
                  }}
                  onFileCleared={() => {
                    setFormData(prev => ({
                      ...prev,
                      fileName: '',
                      fileSize: '',
                      fileDataUrl: undefined
                    }));
                  }}
                  required
                />
              </div>

              {formData.fileName && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Đã nạp tệp: <span className="font-mono underline">{formData.fileName}</span></span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded uppercase">
                      Sẵn sàng tải lên
                    </span>
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] ${
                      formData.folderCategory.startsWith('Đề thi')
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {formData.folderCategory.startsWith('Đề thi')
                        ? 'Bấm Vào Đây Để Tải Đề Thi Lên Hệ Thống Ngay'
                        : 'Bấm Vào Đây Để Tải KHDH Lên Hệ Thống Ngay'}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={formData.matrixIncluded}
                    onChange={(e) => setFormData({ ...formData, matrixIncluded: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Đã có Ma trận &amp; Bảng đặc tả</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={formData.answerKeyIncluded}
                    onChange={(e) => setFormData({ ...formData, answerKeyIncluded: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Đã có Đáp án &amp; Biểu điểm</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt cấu trúc ma trận đề hoặc nội dung
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả 4 mức độ nhận thức, số câu trắc nghiệm, tự luận..."
                  value={formData.contentPreview}
                  onChange={(e) => setFormData({ ...formData, contentPreview: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                />
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="upload-exam-form"
                className={`px-6 py-2.5 font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 text-white ${
                  formData.folderCategory.startsWith('Đề thi')
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {formData.folderCategory.startsWith('Đề thi')
                    ? 'Tải Đề Thi & Lưu Vào Hệ Thống'
                    : 'Tải KHDH & Lưu Vào Hệ Thống'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Leader Review & Approval (Thẩm Định & Duyệt Trả Kết Quả Cho GV) */}
      {reviewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <span>Thẩm Định &amp; Duyệt Hồ Sơ Chuyên Môn</span>
                </h3>
                <p className="text-xs text-slate-300">{reviewingItem.folderCategory} • {reviewingItem.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Item Summary Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Lớp: <strong className="text-slate-800">{reviewingItem.className}</strong> ({reviewingItem.campus})</span>
                  <span>Môn: <strong className="text-slate-800">{reviewingItem.subject}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Giáo viên: <strong className="text-slate-800">{reviewingItem.teacherName}</strong></span>
                  <span className="text-slate-400">Nộp ngày: {reviewingItem.submittedAt}</span>
                </div>
                <div className="flex gap-2 text-[11px] text-slate-600 pt-1">
                  {reviewingItem.matrixIncluded && <span className="text-blue-700 font-semibold">✓ Kèm Ma trận &amp; đặc tả</span>}
                  {reviewingItem.answerKeyIncluded && <span className="text-emerald-700 font-semibold">✓ Kèm Đáp án &amp; biểu điểm</span>}
                </div>
              </div>

              {/* THANH TẢI TỆP XUỐNG XEM & THẨM ĐỊNH DÀNH CHO TỔ TRƯỞNG */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-amber-950 block">Tệp đính kèm của giáo viên:</span>
                  <span className="text-xs text-amber-900 font-mono truncate block max-w-[220px] sm:max-w-[270px]">
                    {reviewingItem.fileName} ({reviewingItem.fileSize})
                  </span>
                  <span className="text-[10px] text-amber-700 block">
                    Bấm tải về để mở đọc, kiểm tra câu hỏi, ma trận &amp; đáp án trước khi duyệt.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(reviewingItem, true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 hover:scale-105 active:scale-95"
                  title="Tải tệp này về máy để Tổ trưởng xem kỹ trước khi duyệt"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Xuống Xem</span>
                </button>
              </div>

              {/* Quick Comment Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mẫu nhận xét nhanh của Tổ trưởng (bấm chọn):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REVIEW_NOTES.map((note, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewNoteInput(note)}
                      className="text-[11px] text-left p-1.5 px-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-lg transition-colors leading-tight"
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Note Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét &amp; Ý kiến thẩm định của Tổ trưởng trả kết quả cho GV *
                </label>
                <textarea
                  rows={3}
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder="Ghi nhận xét về độ khó, bám sát chuẩn kiến thức, mức độ phân hóa, hoặc yêu cầu chỉnh sửa..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onApproveItem(
                    reviewingItem.id,
                    'Yêu cầu chỉnh sửa',
                    reviewNoteInput.trim() || 'Cần điều chỉnh lại theo góp ý chuyên môn của Tổ trưởng'
                  );
                  setReviewingItem(null);
                }}
                className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Yêu Cầu Chỉnh Sửa &amp; Trả Kết Quả</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApproveItem(
                      reviewingItem.id,
                      'Đã duyệt',
                      reviewNoteInput.trim() || 'Đề bám sát chuẩn kiến thức kĩ năng, đã duyệt cho photo và sử dụng.'
                    );
                    setReviewingItem(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Duyệt Đạt Chuẩn &amp; Cho Phép GV Tải Về</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Đổi Mật Khẩu Tổ Trưởng
            </h3>
            <p className="text-xs text-slate-500">
              Mật khẩu này bảo vệ kho đề thi của khối 5. Mật khẩu hiện tại: <strong>{secretPasswordLeader}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="text"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-medium rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPassword.trim().length >= 4) {
                    onUpdatePassword(newPassword.trim());
                    setShowPasswordChangeModal(false);
                    setNewPassword('');
                    alert('Đã cập nhật mật khẩu Tổ trưởng thành công!');
                  } else {
                    alert('Mật khẩu tối thiểu 4 ký tự!');
                  }
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
              >
                Lưu Mật Khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Password Authentication */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            onDeleteItem(deletingItem.id);
            setDeletingItem(null);
          }
        }}
        title="Xác nhận xóa tài liệu trong Thư mục Bảo mật"
        itemName={deletingItem ? `${deletingItem.title} (${deletingItem.className})` : ''}
        description="Để bảo đảm an toàn dữ liệu và bảo mật ngân hàng đề thi, bạn cần nhập đúng mật khẩu Tổ trưởng để xóa hồ sơ này."
        requirePassword={true}
        correctPassword={secretPasswordLeader}
      />
    </div>
  );
};
