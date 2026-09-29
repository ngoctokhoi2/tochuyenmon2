import React, { useState } from 'react';
import { LessonStudyTopic, LessonStudyFeedback, LessonActivityAspect, TeacherMember } from '../types';
import { 
  Presentation, 
  PlusCircle, 
  Download, 
  MessageSquare, 
  Send, 
  Trash2, 
  Printer, 
  FileText, 
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Upload,
  User,
  Clock,
  Filter,
  Check,
  Award
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FileUploadInput } from './FileUploadInput';
import { downloadFile, detectFileType } from '../utils/fileHelpers';

interface LessonStudyViewProps {
  topics: LessonStudyTopic[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  onSaveTopic: (topic: LessonStudyTopic) => void;
  onAddFeedback: (topicId: string, feedback: LessonStudyFeedback) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteFeedback?: (topicId: string, feedbackId: string) => void;
}

// 4 Hoạt động chính theo tiến trình bài dạy Công văn 2345/BGDĐT & CT GDPT 2018
export const ACTIVITY_CONFIGS: {
  key: LessonActivityAspect;
  number: string;
  label: string;
  shortLabel: string;
  icon: string;
  badgeClass: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  suggestions: string[];
}[] = [
  {
    key: 'Khởi động',
    number: '1',
    label: 'Hoạt động 1: Khởi động',
    shortLabel: 'Khởi động',
    icon: '🚀',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    bgLightClass: 'bg-amber-50/60',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    description: 'Tạo tâm thế hứng thú học tập, kết nối kiến thức và vốn sống đã có của học sinh vào bài học mới.',
    suggestions: [
      'Trò chơi khởi động tạo không khí hào hứng, kết nối kiến thức cũ tự nhiên và hiệu quả.',
      'Nên rút ngắn thời lượng khởi động từ 7 phút xuống còn 4-5 phút để tập trung cho hoạt động Khám phá.',
      'Tình huống mở đầu gắn liền với thực tế, kích thích trí tò mò và hứng thú của học sinh.',
      'Cần chú ý huy động toàn bộ học sinh cùng tham gia khởi động, tránh chỉ gọi một vài em nổi trội.'
    ]
  },
  {
    key: 'Khám phá',
    number: '2',
    label: 'Hoạt động 2: Khám phá',
    shortLabel: 'Khám phá',
    icon: '💡',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    bgLightClass: 'bg-blue-50/60',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-700',
    description: 'Tổ chức cho học sinh thao tác với đồ dùng, quan sát, thảo luận cặp đôi/nhóm để tự phát hiện và chiếm lĩnh kiến thức.',
    suggestions: [
      'Học sinh được tự thao tác với đồ dùng trực quan và tự phát hiện ra kiến thức trọng tâm rất tích cực.',
      'Nên tăng thời gian cho học sinh chia sẻ cặp đôi để các em tự tin trình bày trước lớp.',
      'Giáo viên cần hỗ trợ kịp thời các nhóm học sinh còn lúng túng khi thực hiện thao tác đo và đọc số.',
      'Hệ thống câu hỏi gợi mở của giáo viên rõ ràng, dẫn dắt học sinh tiếp cận kiến thức logic.'
    ]
  },
  {
    key: 'Luyện tập',
    number: '3',
    label: 'Hoạt động 3: Luyện tập',
    shortLabel: 'Luyện tập',
    icon: '✍️',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    bgLightClass: 'bg-emerald-50/60',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
    description: 'Thực hành áp dụng kiến thức vào giải quyết bài tập, củng cố và rèn luyện kỹ năng, phân hóa đối tượng.',
    suggestions: [
      'Hệ thống bài tập phân hóa rõ ràng từ cơ bản đến nâng cao, phù hợp với từng đối tượng học sinh.',
      'Cần chuẩn bị phiếu bài tập có gợi ý màu sắc cho học sinh khuyết tật hòa nhập / tiếp thu chậm.',
      'Nên tổ chức cho học sinh đổi vở chấm chéo cặp đôi để rèn năng lực tự đánh giá và hỗ trợ bạn bè.',
      'Lượng bài tập vừa sức, học sinh hoàn thành tốt trong khoảng thời gian quy định.'
    ]
  },
  {
    key: 'Vận dụng',
    number: '4',
    label: 'Hoạt động 4: Vận dụng',
    shortLabel: 'Vận dụng',
    icon: '🌟',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    bgLightClass: 'bg-purple-50/60',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-700',
    description: 'Vận dụng kiến thức, kỹ năng vào thực tiễn cuộc sống hoặc tình huống mới, sáng tạo và mở rộng.',
    suggestions: [
      'Nội dung vận dụng gắn với thực tế xung quanh (đọc bao bì, đo kích thước vật dụng) rất thiết thực.',
      'Khuyến khích học sinh về nhà tìm hiểu thêm cùng người thân để mở rộng vốn hiểu biết.',
      'Hoạt động trải nghiệm sáng tạo giúp học sinh thấy được ý nghĩa thiết thực của bài học.'
    ]
  },
  {
    key: 'Mục tiêu & Chuẩn bị',
    number: '★',
    label: 'Mục tiêu, Chuẩn bị & Khác',
    shortLabel: 'Mục tiêu & Khác',
    icon: '📋',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    bgLightClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-700',
    description: 'Góp ý về yêu cầu cần đạt (phẩm chất, năng lực), thiết bị dạy học, không gian lớp học.',
    suggestions: [
      'Mục tiêu bài dạy bám sát yêu cầu cần đạt theo Chương trình GDPT 2018 môn học.',
      'Đồ dùng và thiết bị dạy học chuẩn bị chu đáo, ứng dụng công nghệ thông tin sinh động.'
    ]
  }
];

export const LessonStudyView: React.FC<LessonStudyViewProps> = ({
  topics,
  members,
  currentUser,
  onSaveTopic,
  onAddFeedback,
  onDeleteTopic,
  onDeleteFeedback
}) => {
  const [activeTopicId, setActiveTopicId] = useState<string>(topics[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deletingTopic, setDeletingTopic] = useState<LessonStudyTopic | null>(null);
  const [deletingFeedback, setDeletingFeedback] = useState<{ topicId: string; feedback: LessonStudyFeedback } | null>(null);

  // Tab lọc ý kiến theo 4 hoạt động
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | LessonActivityAspect>('all');

  // Form đóng góp ý kiến
  const [feedbackTeacherId, setFeedbackTeacherId] = useState<string>(currentUser.id);
  const [feedbackAspect, setFeedbackAspect] = useState<LessonActivityAspect>('Khởi động');
  const [feedbackText, setFeedbackText] = useState<string>('');

  // New topic form
  const [topicForm, setTopicForm] = useState<{
    topicTitle: string;
    subject: string;
    unit: string;
    teachingTeacherId: string;
    implementationDate: string;
    rationalePlan: string;
    lessonPlanDocName: string;
    lessonPlanDocSize: string;
    lessonPlanFileDataUrl?: string;
  }>({
    topicTitle: '',
    subject: 'Toán',
    unit: 'Chủ đề',
    teachingTeacherId: currentUser.id,
    implementationDate: '',
    rationalePlan: '',
    lessonPlanDocName: '',
    lessonPlanDocSize: '1.5 MB',
    lessonPlanFileDataUrl: undefined
  });

  const selectedTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = members.find(m => m.id === topicForm.teachingTeacherId) || currentUser;
    const finalDocName = topicForm.lessonPlanDocName || `KHBD_${topicForm.topicTitle.replace(/\s+/g, '_')}.docx`;

    const newTopic: LessonStudyTopic = {
      id: 'ls-' + Date.now(),
      topicTitle: topicForm.topicTitle,
      subject: topicForm.subject,
      unit: topicForm.unit,
      teachingTeacherId: teacher.id,
      teachingTeacherName: teacher.name,
      teachingClass: teacher.assignedClass,
      campus: teacher.campus,
      implementationDate: topicForm.implementationDate || new Date().toLocaleDateString('vi-VN'),
      rationalePlan: topicForm.rationalePlan,
      lessonPlanDocName: finalDocName,
      lessonPlanDocSize: topicForm.lessonPlanDocSize || '1.5 MB',
      lessonPlanFileDataUrl: topicForm.lessonPlanFileDataUrl,
      lessonPlanContent: 'Kế hoạch bài dạy chi tiết phát triển phẩm chất và năng lực theo Công văn 2345/BGDĐT.',
      feedbacks: [],
      status: 'Đang chuẩn bị'
    };

    onSaveTopic(newTopic);
    setActiveTopicId(newTopic.id);
    setShowAddModal(false);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !selectedTopic) return;

    const teacher = members.find(m => m.id === feedbackTeacherId) || currentUser;

    const newFb: LessonStudyFeedback = {
      id: 'fb-' + Date.now(),
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherClass: teacher.assignedClass,
      campus: teacher.campus,
      feedbackText: feedbackText.trim(),
      aspect: feedbackAspect,
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    onAddFeedback(selectedTopic.id, newFb);
    setFeedbackText('');
  };

  const selectedActivityConfig = ACTIVITY_CONFIGS.find(c => c.key === feedbackAspect) || ACTIVITY_CONFIGS[0];

  // Lọc ý kiến theo hoạt động được chọn
  const filteredFeedbacks = (selectedTopic?.feedbacks || []).filter(fb => {
    if (activeActivityFilter === 'all') return true;
    return fb.aspect === activeActivityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Thanh lệnh 5
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                KHBD Minh Họa &amp; Thảo Luận Chuyên Đề Khối 2
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Thảo luận phân tích bài học theo 4 hoạt động: <strong>Khởi động, Khám phá, Luyện tập, Vận dụng</strong>. Các thành viên trong tổ đóng góp ý kiến phân tích hoạt động học của học sinh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const teacher = members.find(m => m.id === currentUser.id) || members[0];
                setTopicForm({
                  topicTitle: '',
                  subject: 'Toán',
                  unit: 'Chủ đề',
                  teachingTeacherId: teacher.id,
                  implementationDate: new Date().toLocaleDateString('vi-VN'),
                  rationalePlan: '',
                  lessonPlanDocName: '',
                  lessonPlanDocSize: '',
                  lessonPlanFileDataUrl: undefined
                });
                setShowAddModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi Bài KHBD Chuyên Đề Mới</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 border border-slate-300"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên Bản Góp Ý</span>
            </button>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        {topics.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Chuyên đề:
            </span>
            {topics.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTopicId(t.id);
                  setActiveActivityFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 max-w-[280px] truncate ${
                  (selectedTopic?.id === t.id)
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.topicTitle} ({t.teachingClass})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area: Topic Detail & Comments Thread */}
      {!selectedTopic ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <Presentation className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold">Chưa có bài KHBD chuyên đề nào được gửi.</p>
          <p className="text-xs text-slate-400 mt-1">
            Bấm &ldquo;Gửi Bài KHBD Chuyên Đề Mới&rdquo; để bắt đầu sinh hoạt chuyên môn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Lesson Plan & Rationale Detail */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Môn {selectedTopic.subject}
                    </span>
                    <span className="text-xs text-slate-500">{selectedTopic.unit}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mt-1.5 leading-snug">
                    {selectedTopic.topicTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingTopic(selectedTopic)}
                  title="Xóa chuyên đề gửi sai"
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>

              {/* Teacher metadata badge */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Giáo viên dạy minh họa:</span>
                  <strong className="text-slate-800">{selectedTopic.teachingTeacherName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Lớp thực hiện:</span>
                  <strong className="text-slate-800">{selectedTopic.teachingClass} ({selectedTopic.campus})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Dự kiến thực hiện:</span>
                  <strong className="text-purple-700">{selectedTopic.implementationDate}</strong>
                </div>
              </div>

              {/* Attached KHBD File Box */}
              {(() => {
                const docType = detectFileType(selectedTopic.lessonPlanDocName);
                return (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {docType === 'word' ? (
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : docType === 'excel' ? (
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 truncate block">{selectedTopic.lessonPlanDocName}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            docType === 'word' ? 'bg-blue-600 text-white' :
                            docType === 'excel' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                          }`}>
                            {docType === 'word' ? 'Word' : docType === 'excel' ? 'Excel' : 'Đính kèm'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Giáo án định dạng chuẩn CV 2345/BGDĐT • {selectedTopic.lessonPlanDocSize || '1.5 MB'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fallback = `TRƯỜNG TIỂU HỌC MỸ LẠC\nKẾ HOẠCH BÀI DẠY MINH HỌA\nTên bài: ${selectedTopic.topicTitle}\nNgười dạy: ${selectedTopic.teachingTeacherName}\nLớp: ${selectedTopic.teachingClass}\n\n${selectedTopic.rationalePlan}`;
                        downloadFile(selectedTopic.lessonPlanDocName, selectedTopic.lessonPlanFileDataUrl, fallback);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải KHBD</span>
                    </button>
                  </div>
                );
              })()}

              {/* Rationale Plan */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Phương Án Thuyết Minh Ý Tưởng Sư Phạm Dạy Minh Họa
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-serif">
                  {selectedTopic.rationalePlan}
                </div>
              </div>

              {selectedTopic.conclusionByLeader && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <strong className="block text-amber-900 flex items-center gap-1.5 font-bold">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Kết luận chỉ đạo của Tổ trưởng chuyên môn:</span>
                  </strong>
                  <p className="leading-relaxed pl-5">{selectedTopic.conclusionByLeader}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Feedback & Discussion from Colleagues By 4 Activities */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full justify-between space-y-4">
              <div>
                {/* Header with Title and counts */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span>Góp Ý Kiến Theo 4 Hoạt Động Bài Dạy ({selectedTopic.feedbacks?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    Công văn 2345/BGDĐT
                  </span>
                </div>

                {/* 4 Activity Tabs Filter */}
                <div className="pt-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveActivityFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        activeActivityFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả ({selectedTopic.feedbacks?.length || 0})
                    </button>

                    {ACTIVITY_CONFIGS.map(act => {
                      const count = (selectedTopic.feedbacks || []).filter(f => f.aspect === act.key).length;
                      const isSelected = activeActivityFilter === act.key;

                      return (
                        <button
                          key={act.key}
                          type="button"
                          onClick={() => {
                            setActiveActivityFilter(act.key);
                            setFeedbackAspect(act.key);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : `${act.bgLightClass} ${act.textClass} ${act.borderClass} hover:opacity-90`
                          }`}
                        >
                          <span>{act.icon}</span>
                          <span>{act.shortLabel}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSelected ? 'bg-purple-800 text-white' : 'bg-white/80 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback List Display */}
                <div className="space-y-3 mt-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1.5">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        {activeActivityFilter === 'all'
                          ? 'Chưa có ý kiến góp ý nào cho chuyên đề này.'
                          : `Chưa có ý kiến nào cho phần "${activeActivityFilter}".`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Hãy chọn thành viên và gửi góp ý theo hoạt động này ở khung bên dưới!
                      </p>
                    </div>
                  ) : (
                    filteredFeedbacks.map((fb) => {
                      const actConfig = ACTIVITY_CONFIGS.find(c => c.key === fb.aspect) || ACTIVITY_CONFIGS[0];
                      const canDelete = currentUser.isLeader || currentUser.id === fb.teacherId;

                      return (
                        <div
                          key={fb.id}
                          className={`p-3.5 rounded-2xl border transition-all ${actConfig.bgLightClass} ${actConfig.borderClass}`}
                        >
                          {/* Top: Teacher Name & Activity Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-xs shrink-0">
                                {fb.teacherName.split(' ').pop()?.charAt(0) || 'G'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900">
                                    {fb.teacherName}
                                  </span>
                                  {fb.teacherClass && (
                                    <span className="text-[10px] bg-white text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                                      Lớp {fb.teacherClass}
                                    </span>
                                  )}
                                  {fb.campus && (
                                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                                      ({fb.campus})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-300" />
                                  <span>{fb.createdAt}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 bg-white ${actConfig.badgeClass}`}>
                                <span>{actConfig.icon}</span>
                                <span>{actConfig.shortLabel}</span>
                              </span>

                              {canDelete && onDeleteFeedback && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingFeedback({ topicId: selectedTopic.id, feedback: fb })}
                                  title="Xóa ý kiến góp ý này"
                                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-white transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Feedback Content */}
                          <div className="mt-2.5 bg-white/90 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed">
                            {fb.feedbackText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* INPUT FORM: GÓP Ý KIẾN THEO TỪNG HOẠT ĐỘNG CÓ TÊN GV */}
              <form onSubmit={handleSendFeedback} className="pt-3 border-t border-slate-200 space-y-3 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>ĐÓNG GÓP Ý KIẾN TIẾT DẠY MINH HỌA</span>
                  </span>
                  <span className="text-[11px] text-slate-500 italic">
                    Theo nghiên cứu bài học
                  </span>
                </div>

                {/* Chọn thành viên GV góp ý */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Thành viên (Giáo viên) vào góp ý kiến: *
                  </label>
                  <select
                    value={feedbackTeacherId}
                    onChange={(e) => setFeedbackTeacherId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.assignedClass} ({m.campus}) {m.isLeader ? '★ Tổ trưởng' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn 1 trong 4 Hoạt động */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Chọn hoạt động bài dạy để góp ý: *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {ACTIVITY_CONFIGS.filter(c => c.key !== 'Mục tiêu & Chuẩn bị').map(act => {
                      const isSelected = feedbackAspect === act.key;
                      return (
                        <button
                          key={act.key}
                          type="button"
                          onClick={() => setFeedbackAspect(act.key)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center gap-1 border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm scale-[1.02]'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-base">{act.icon}</span>
                          <span className="leading-tight">{act.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional 5th button: Mục tiêu & Khác */}
                  <div className="pt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFeedbackAspect('Mục tiêu & Chuẩn bị')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors ${
                        feedbackAspect === 'Mục tiêu & Chuẩn bị'
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📋 Góp ý Mục tiêu / Chuẩn bị / Khác
                    </button>
                  </div>
                </div>

                {/* Activity Description & Quick suggestions chips */}
                <div className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${selectedActivityConfig.bgLightClass} ${selectedActivityConfig.borderClass}`}>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold flex items-center gap-1">
                      <span>{selectedActivityConfig.icon}</span>
                      <span>Mục tiêu {selectedActivityConfig.label}:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 italic">Bấm gợi ý bên dưới để nạp nhanh</span>
                  </div>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    {selectedActivityConfig.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedActivityConfig.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFeedbackText(prev => prev ? `${prev} ${sug}` : sug);
                        }}
                        className="text-[10px] text-left p-1.5 px-2 bg-white/95 hover:bg-white text-slate-700 hover:text-purple-900 border border-slate-200/80 rounded-lg shadow-2xs transition-colors leading-tight"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder={`Nhập ý kiến phân tích hoạt động học của học sinh trong phần ${selectedActivityConfig.shortLabel}...`}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Góp ý bởi: <strong>{members.find(m => m.id === feedbackTeacherId)?.name || currentUser.name}</strong> ({selectedActivityConfig.shortLabel})
                  </span>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Ý Kiến Đóng Góp</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Topic */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTopic)}
        onClose={() => setDeletingTopic(null)}
        onConfirm={() => {
          if (deletingTopic) {
            onDeleteTopic(deletingTopic.id);
            setDeletingTopic(null);
          }
        }}
        title="Xác nhận xóa Bài KHBD Chuyên đề"
        itemName={deletingTopic ? deletingTopic.topicTitle : ''}
        description="Toàn bộ nội dung bài dạy minh họa và các ý kiến đóng góp của giáo viên sẽ bị xóa."
      />

      {/* Delete Confirmation Modal for Feedback */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingFeedback)}
        onClose={() => setDeletingFeedback(null)}
        onConfirm={() => {
          if (deletingFeedback && onDeleteFeedback) {
            onDeleteFeedback(deletingFeedback.topicId, deletingFeedback.feedback.id);
            setDeletingFeedback(null);
          }
        }}
        title="Xác nhận xóa ý kiến đóng góp"
        itemName={deletingFeedback ? `Ý kiến của: ${deletingFeedback.feedback.teacherName} (${deletingFeedback.feedback.aspect})` : ''}
        description="Ý kiến đóng góp này sẽ được gỡ khỏi bài chuyên đề."
      />

      {/* Modal: Add Lesson Study Topic */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-purple-300" />
                  <span>Đăng Bài KHBD &amp; Thuyết Minh Chuyên Đề</span>
                </h3>
                <p className="text-xs text-purple-100">
                  Chuẩn bị dạy minh họa sinh hoạt chuyên môn theo nghiên cứu bài học
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form id="add-lesson-study-form" onSubmit={handleCreateTopic} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên bài dạy / Chuyên đề minh họa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dạy học hình thành khái niệm số thập phân (Toán 5)"
                  value={topicForm.topicTitle}
                  onChange={(e) => setTopicForm({ ...topicForm, topicTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn học *</label>
                  <select
                    value={topicForm.subject}
                    onChange={(e) => setTopicForm({ ...topicForm, subject: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Lịch sử & Địa lý">Lịch sử &amp; Địa lý</option>
                    <option value="Tin học & Công nghệ">Tin học &amp; Công nghệ</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giáo viên dạy *</label>
                  <select
                    value={topicForm.teachingTeacherId}
                    onChange={(e) => setTopicForm({ ...topicForm, teachingTeacherId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.assignedClass})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày thực hiện *</label>
                  <input
                    type="text"
                    placeholder="VD: 15/10/2026"
                    value={topicForm.implementationDate}
                    onChange={(e) => setTopicForm({ ...topicForm, implementationDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phương án thuyết minh sư phạm (Lý do chọn, giải pháp, dự kiến khó khăn của HS) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ ý tưởng đổi mới phương pháp, cách tổ chức hoạt động học, hỗ trợ học sinh..."
                  value={topicForm.rationalePlan}
                  onChange={(e) => setTopicForm({ ...topicForm, rationalePlan: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <FileUploadInput
                  label="Tệp Kế hoạch bài dạy (KHBD) đính kèm (Word .docx hoặc Excel .xlsx)"
                  helperText="Hỗ trợ tải lên file Word (.docx, .doc), bảng biểu Excel (.xlsx, .xls) hoặc PDF (.pdf)"
                  currentFileName={topicForm.lessonPlanDocName}
                  currentFileSize={topicForm.lessonPlanDocSize}
                  currentFileDataUrl={topicForm.lessonPlanFileDataUrl}
                  uploadActionLabel="Đưa KHBD Lên Chuyên Đề"
                  onUploadAction={() => {
                    const formEl = document.getElementById('add-lesson-study-form') as HTMLFormElement | null;
                    if (formEl) formEl.requestSubmit();
                  }}
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setTopicForm(prev => ({
                      ...prev,
                      lessonPlanDocName: fileName,
                      lessonPlanDocSize: fileSize,
                      lessonPlanFileDataUrl: fileDataUrl,
                      topicTitle: prev.topicTitle || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
                    }));
                  }}
                  onFileCleared={() => {
                    setTopicForm(prev => ({
                      ...prev,
                      lessonPlanDocName: '',
                      lessonPlanDocSize: '1.5 MB',
                      lessonPlanFileDataUrl: undefined
                    }));
                  }}
                />
              </div>

              {topicForm.lessonPlanDocName && (
                <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="text-xs text-purple-900 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Đã chọn: <span className="font-mono underline">{topicForm.lessonPlanDocName}</span></span>
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Đăng KHBD Lên Ngay</span>
                  </button>
                </div>
              )}
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="add-lesson-study-form"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Đăng Chuyên Đề &amp; KHBD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report View (Visible only during window.print()) */}
      {selectedTopic && (
        <div className="hidden print:block p-8 bg-white text-black space-y-6 text-sm">
          <div className="text-center space-y-1 border-b pb-4">
            <p className="font-bold text-xs uppercase">TRƯỜNG TIỂU HỌC MỸ LẠC - TỔ CHUYÊN MÔN KHỐI 2</p>
            <h1 className="font-black text-lg uppercase tracking-wide">
              BIÊN BẢN THẢO LUẬN &amp; GÓP Ý KẾ HOẠCH BÀI DẠY MINH HỌA
            </h1>
            <p className="text-xs italic">
              (Sinh hoạt chuyên môn theo nghiên cứu bài học - Thực hiện Công văn 2345/BGDĐT)
            </p>
          </div>

          <div className="border p-3 rounded space-y-1 text-xs">
            <div><strong>Tên chuyên đề / bài học:</strong> {selectedTopic.topicTitle}</div>
            <div><strong>Môn học:</strong> {selectedTopic.subject} ({selectedTopic.unit})</div>
            <div className="grid grid-cols-3 gap-2">
              <div><strong>Giáo viên dạy minh họa:</strong> {selectedTopic.teachingTeacherName}</div>
              <div><strong>Lớp thực hiện:</strong> {selectedTopic.teachingClass} ({selectedTopic.campus})</div>
              <div><strong>Ngày thực hiện:</strong> {selectedTopic.implementationDate}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-base uppercase border-b pb-1">
              NỘI DUNG GÓP Ý CỦA CÁC THÀNH VIÊN THEO 4 HOẠT ĐỘNG:
            </h2>

            {ACTIVITY_CONFIGS.map(act => {
              const actFeedbacks = (selectedTopic.feedbacks || []).filter(f => f.aspect === act.key);
              return (
                <div key={act.key} className="space-y-1.5">
                  <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border">
                    {act.label}
                  </h3>
                  {actFeedbacks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-3">Không có ý kiến bổ sung.</p>
                  ) : (
                    <div className="space-y-2 pl-3">
                      {actFeedbacks.map((f, idx) => (
                        <div key={f.id} className="text-xs">
                          <strong>{idx + 1}. Thầy/Cô: {f.teacherName} {f.teacherClass ? `(${f.teacherClass})` : ''}:</strong>
                          <p className="pl-4 italic">&ldquo;{f.feedbackText}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {selectedTopic.conclusionByLeader && (
              <div className="mt-4 border p-3 rounded bg-slate-50 text-xs space-y-1">
                <strong className="block uppercase">KẾT LUẬN CỦA TỔ TRƯỞNG CHUYÊN MÔN:</strong>
                <p className="italic">{selectedTopic.conclusionByLeader}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 text-center pt-8 text-xs">
            <div>
              <p className="font-bold uppercase">NGƯỜI GHI BIÊN BẢN</p>
              <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
              <p className="italic text-[11px]">(Ký và ghi rõ họ tên)</p>
              <div className="h-14"></div>
              <p className="font-bold">{members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
