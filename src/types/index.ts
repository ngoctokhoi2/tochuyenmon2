export interface TeacherMember {
  id: string;
  stt: number;
  name: string;
  birthDate: string;
  isPartyMember: boolean; // Đảng viên
  campus: string; // Trường chính (Trường TH Mỹ Thạnh)
  assignedClass: string; // Lớp 2/1, Lớp 2/2, Lớp 2/3, Lớp 2/4 hoặc GV Chuyên trách Khối 2
  totalStudents: number;
  femaleStudents: number;
  yearJoined: number;
  isLeader?: boolean; // Tổ trưởng chuyên môn
  phone?: string;
  email?: string;
}

export interface DisabledStudentInfo {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  disabilityType: string; // Khuyết tật vận động, trí tuệ, thị giác, nghe nói...
  note: string;
}

export interface MonthlyReport {
  id: string;
  month: string; // Tháng 9, 10, 11, 12, 1, 2, 3, 4, 5
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  campus: string;
  totalStudents: number;
  femaleStudents: number;
  ethnicStudents: number; // Dân tộc thiểu số
  disabledStudentsCount: number;
  disabledStudents: DisabledStudentInfo[];
  studentsMovedIn: number;
  studentsMovedOut: number;
  dropouts: number;
  absenteeismNotes: string;
  submittedAt: string;
  status: 'Đã nộp' | 'Chờ duyệt' | 'Đã duyệt';
  reviewedBy?: string;
  reviewedAt?: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
}

export interface StrugglingStudent {
  id: string;
  name: string;
  className: string;
  campus: string;
  teacherId: string;
  teacherName: string;
  subject: string; // Toán, Tiếng Việt, Tiếng Anh, Khoa học, Lịch sử & Địa lý...
  weaknessDetail: string; // Chưa thuộc bảng cửu chương, đọc chậm, viết hoa sai...
  supportAction: string; // Kèm riêng giờ tự học, phân công bạn hỗ trợ, liên hệ PH...
  progressStatus: 'Cần nỗ lực nhiều' | 'Đang cải thiện' | 'Đã hoàn thành mục tiêu';
  currentScoreOrLevel: string; // Điểm KT gần nhất / Nhận xét CHT -> HT
  dateAdded: string;
  resolvedDate?: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
}

export interface TeamPlanDocument {
  id: string;
  title: string;
  category: 'Kế hoạch GD Tổ' | 'Phân phối CT' | 'KH Tích hợp QPAN' | 'KH STEM' | 'KH GD Địa phương' | 'Khác';
  description: string;
  fileName: string;
  fileSize: string;
  fileDataUrl?: string;
  uploadedBy: string;
  teacherId: string;
  uploadedAt: string;
  fileContentText?: string;
}

export type ExamCategory = 'KHDH' | 'Đề thi GHK I' | 'Đề thi HK I' | 'Đề thi GHK II' | 'Đề thi HK II';

export interface ExamAndLessonPlan {
  id: string;
  folderCategory: ExamCategory;
  title: string;
  className: string;
  campus: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  fileName: string;
  fileSize: string;
  fileDataUrl?: string;
  submittedAt: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Yêu cầu chỉnh sửa';
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  matrixIncluded: boolean; // Kèm ma trận đề
  answerKeyIncluded: boolean; // Kèm đáp án hướng dẫn chấm
  contentPreview?: string;
}

export type LessonActivityAspect = 
  | 'Khởi động'
  | 'Khám phá'
  | 'Luyện tập'
  | 'Vận dụng'
  | 'Mục tiêu & Chuẩn bị'
  | 'Đánh giá & Khác';

export interface LessonStudyFeedback {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherClass?: string;
  campus?: string;
  feedbackText: string;
  aspect: LessonActivityAspect;
  createdAt: string;
}

export interface LessonStudyTopic {
  id: string;
  topicTitle: string; // Tên bài / Chuyên đề
  subject: string;
  unit: string;
  teachingTeacherId: string;
  teachingTeacherName: string;
  teachingClass: string;
  campus: string;
  implementationDate: string;
  rationalePlan: string; // Phương án thuyết minh
  lessonPlanDocName: string; // File KHBD đính kèm
  lessonPlanDocSize?: string;
  lessonPlanFileDataUrl?: string;
  lessonPlanContent: string;
  feedbacks: LessonStudyFeedback[];
  conclusionByLeader?: string;
  status: 'Đang chuẩn bị' | 'Đã dạy minh họa' | 'Đã hoàn thành sinh hoạt';
}

export interface SchoolDirective {
  id: string;
  code: string; // Số hiệu công văn
  title: string;
  issuingAuthority?: string; // Cơ quan ban hành (Phòng GD&ĐT, BGH Trường, Tổ CM...)
  category: 'Công văn chỉ đạo' | 'Hướng dẫn chuyên môn' | 'Kế hoạch năm học' | 'Thông tư - Quyết định' | 'Khác';
  content: string;
  effectiveDate?: string;
  signerName?: string;
  senderName: string;
  createdAt: string;
  isUrgent?: boolean;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
}

export interface MeetingNotice {
  id: string;
  code: string; // Số hiệu thông báo
  title: string;
  meetingTime: string; // Thời gian họp (VD: 14h30 Thứ Năm, ngày 28/09/2026)
  zoomLink: string; // Link vào trực tiếp Zoom (https://zoom.us/j/...)
  zoomMeetingId: string; // ID phòng họp Zoom
  zoomPasscode: string; // Mật mã phòng Zoom
  locationType: 'Trực tuyến qua Zoom' | 'Trực tiếp tại trường' | 'Kết hợp trực tiếp & Zoom';
  locationDetail?: string; // Địa điểm cụ thể
  agenda: string; // Nội dung chương trình cuộc họp
  attendees: string; // Thành phần triệu tập
  senderName: string; // Người gửi thông báo (Tổ trưởng Nguyễn Kim Ngọc)
  createdAt: string;
  isUrgent?: boolean;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
}

export interface EmulationPeriod {
  period: 'Học kỳ I' | 'Học kỳ II' | 'Cả năm';
}

export interface EmulationDocument {
  id: string;
  title: string; // Tiêu đề bảng xét thi đua / biên bản
  period: 'Học kỳ I' | 'Học kỳ II' | 'Cả năm';
  academicYear: string;
  fileType: 'excel' | 'word' | 'pdf';
  fileName: string;
  fileSize: string;
  fileDataUrl?: string;
  uploadedBy: string;
  teacherId?: string;
  uploadedAt: string;
  note?: string;
}

export interface EmulationRecord {
  id: string;
  period: 'Học kỳ I' | 'Học kỳ II' | 'Cả năm';
  teacherId: string;
  teacherName: string;
  campus: string;
  assignedClass: string;
  lessonObservationsScore: string; // Giờ dạy thao giảng / dự giờ (Tốt / Khá)
  recordBooksRating: 'Tốt' | 'Khá' | 'Đạt'; // Hồ sơ sổ sách
  studentProgressRating: 'Tốt' | 'Khá' | 'Đạt'; // Chất lượng học sinh
  innovationInitiative: string; // Sáng kiến / Bài học đổi mới
  proposedTitle: 'Lao động Tiên tiến' | 'Chiến sĩ thi đua cơ sở' | 'Giấy khen UBND huyện' | 'Hoàn thành tốt NV' | 'Hoàn thành NV';
  overallEvaluation: 'Hoàn thành Xuất sắc' | 'Hoàn thành Tốt' | 'Hoàn thành' | 'Chưa hoàn thành';
  notes: string;
  evaluatedAt: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
}

export interface ClassTimetable {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  campus: string;
  effectiveTerm: string; // Ví dụ: 'Học kỳ I (Áp dụng từ Tuần 1)'
  effectiveDate: string; // Ngày bắt đầu áp dụng (VD: 05/09/2026)
  note?: string; // Ghi chú (VD: Lớp học 2 buổi/ngày, Sáng 4 tiết, Chiều 3 tiết)
  scheduleGrid: Record<string, string>; // key: `${session}_${day}_${period}`, VD: 'Sang_Thứ Hai_1': 'Chào cờ'
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileDataUrl?: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Áp dụng chính thức';
  reviewedBy?: string;
  leaderFeedback?: string;
  submittedAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  headerTitle: string;
  schoolName: string;
  teamName: string;
  academicYear: string;
  communeName: string;
  secretPasswordLeader: string;
}


