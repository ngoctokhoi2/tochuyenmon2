/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  TeacherMember, 
  MonthlyReport, 
  StrugglingStudent, 
  TeamPlanDocument, 
  ExamAndLessonPlan, 
  LessonStudyTopic, 
  SchoolDirective, 
  MeetingNotice, 
  EmulationRecord, 
  EmulationDocument, 
  ClassTimetable 
} from '../types';

// Danh sách Giáo viên Khối 2 - Trường Tiểu Học Mỹ Lạc (Năm học 2026-2027)
// Căn cứ danh sách phân công chuyên môn chính thức
export const INITIAL_MEMBERS: TeacherMember[] = [
  {
    id: 'gv-1',
    stt: 1,
    name: 'Lê Thị Hồng',
    birthDate: '1976',
    isPartyMember: false,
    campus: 'Trường chính',
    assignedClass: 'Lớp 2/1',
    totalStudents: 32,
    femaleStudents: 15,
    yearJoined: 1998,
    isLeader: false,
    phone: '0912 345 201',
    email: 'thihong.thmylac@gmail.com'
  },
  {
    id: 'gv-2',
    stt: 2,
    name: 'Nguyễn Thị Kim Ngọc',
    birthDate: '1980',
    isPartyMember: true,
    campus: 'Trường chính',
    assignedClass: 'Tổ trưởng Chuyên môn Khối 2',
    totalStudents: 31,
    femaleStudents: 16,
    yearJoined: 2002,
    isLeader: true,
    phone: '0912 345 202',
    email: 'ngoctokhoi2@gmail.com'
  },
  {
    id: 'gv-3',
    stt: 3,
    name: 'Lê Thị Hồng Thắm',
    birthDate: '1974',
    isPartyMember: true,
    campus: 'Trường chính',
    assignedClass: 'Lớp 2/3',
    totalStudents: 30,
    femaleStudents: 14,
    yearJoined: 1996,
    isLeader: false,
    phone: '0912 345 203',
    email: 'hongtham.thmylac@gmail.com'
  },
  {
    id: 'gv-4',
    stt: 4,
    name: 'Hồ Thị Phương Trúc',
    birthDate: '1995',
    isPartyMember: false,
    campus: 'Trường chính',
    assignedClass: 'Lớp 2/4',
    totalStudents: 32,
    femaleStudents: 17,
    yearJoined: 2018,
    isLeader: false,
    phone: '0912 345 204',
    email: 'phuongtruc.thmylac@gmail.com'
  },
  {
    id: 'gv-5',
    stt: 5,
    name: 'Nguyễn Văn Toản',
    birthDate: '1986',
    isPartyMember: false,
    campus: 'Trường chính',
    assignedClass: 'Dạy GDTC',
    totalStudents: 0,
    femaleStudents: 0,
    yearJoined: 2010,
    isLeader: false,
    phone: '0912 345 205',
    email: 'vantoan.thmylac@gmail.com'
  },
  {
    id: 'gv-6',
    stt: 6,
    name: 'Bùi An Bình',
    birthDate: '1986',
    isPartyMember: false,
    campus: 'Trường chính',
    assignedClass: 'Dạy GDTC',
    totalStudents: 0,
    femaleStudents: 0,
    yearJoined: 2011,
    isLeader: false,
    phone: '0912 345 206',
    email: 'anbinh.thmylac@gmail.com'
  },
  {
    id: 'gv-7',
    stt: 7,
    name: 'Lê Thị Ngọc Thùy',
    birthDate: '1972',
    isPartyMember: true,
    campus: 'Trường chính',
    assignedClass: 'Thư viện - Thiết bị',
    totalStudents: 0,
    femaleStudents: 0,
    yearJoined: 1995,
    isLeader: false,
    phone: '0912 345 207',
    email: 'ngocthuy.thmylac@gmail.com'
  }
];

// Khởi tạo các mảng dữ liệu trống - Không dùng dữ liệu mẫu giả định
// Tất cả tài liệu, TKB, KHDH, đề thi, công văn, thi đua chỉ hiển thị khi giáo viên tải lên và được lưu trữ lâu dài
export const INITIAL_MONTHLY_REPORTS: MonthlyReport[] = [];
export const INITIAL_STRUGGLING_STUDENTS: StrugglingStudent[] = [];
export const INITIAL_TEAM_DOCUMENTS: TeamPlanDocument[] = [];
export const INITIAL_EXAMS_AND_PLANS: ExamAndLessonPlan[] = [];
export const INITIAL_LESSON_STUDIES: LessonStudyTopic[] = [];
export const INITIAL_DIRECTIVES: SchoolDirective[] = [];
export const INITIAL_MEETINGS: MeetingNotice[] = [];
export const INITIAL_EMULATIONS: EmulationRecord[] = [];
export const INITIAL_EMULATION_DOCUMENTS: EmulationDocument[] = [];
export const INITIAL_TIMETABLES: ClassTimetable[] = [];

// Khung Thời Khóa Biểu tiêu chuẩn Khối 2 (Chương trình GDPT 2018)
export const STANDARD_TIMETABLE_GRID: Record<string, string> = {
  'Sang_Thứ Hai_1': 'Sinh hoạt dưới cờ',
  'Sang_Thứ Hai_2': 'Tiếng Việt (Đọc)',
  'Sang_Thứ Hai_3': 'Toán',
  'Sang_Thứ Hai_4': 'Đạo đức',
  'Chieu_Thứ Hai_1': 'Tiếng Anh',
  'Chieu_Thứ Hai_2': 'Giáo dục thể chất',
  'Chieu_Thứ Hai_3': 'Hoạt động trải nghiệm',

  'Sang_Thứ Ba_1': 'Toán',
  'Sang_Thứ Ba_2': 'Tiếng Việt (Viết)',
  'Sang_Thứ Ba_3': 'Tự nhiên và Xã hội',
  'Sang_Thứ Ba_4': 'Âm nhạc',
  'Chieu_Thứ Ba_1': 'Giáo dục thể chất',
  'Chieu_Thứ Ba_2': 'Mĩ thuật',
  'Chieu_Thứ Ba_3': 'Tự học có hướng dẫn',

  'Sang_Thứ Tư_1': 'Tiếng Việt (Luyện từ & câu)',
  'Sang_Thứ Tư_2': 'Toán',
  'Sang_Thứ Tư_3': 'Tiếng Anh',
  'Sang_Thứ Tư_4': 'Tự nhiên và Xã hội',
  'Chieu_Thứ Tư_1': 'Tích hợp STEM / Kỹ năng sống',
  'Chieu_Thứ Tư_2': 'Rèn chữ - Giữ vở',
  'Chieu_Thứ Tư_3': 'Phụ đạo Toán & Tiếng Việt',

  'Sang_Thứ Năm_1': 'Toán',
  'Sang_Thứ Năm_2': 'Tiếng Việt (Đọc)',
  'Sang_Thứ Năm_3': 'Đạo đức',
  'Sang_Thứ Năm_4': 'Giáo dục địa phương',
  'Chieu_Thứ Năm_1': 'Tiếng Anh',
  'Chieu_Thứ Năm_2': 'Hoạt động trải nghiệm',
  'Chieu_Thứ Năm_3': 'Tự học có hướng dẫn',

  'Sang_Thứ Sáu_1': 'Tiếng Việt (Viết)',
  'Sang_Thứ Sáu_2': 'Toán',
  'Sang_Thứ Sáu_3': 'Tiếng Anh',
  'Sang_Thứ Sáu_4': 'Hoạt động trải nghiệm',
  'Chieu_Thứ Sáu_1': 'Kỹ năng sống / STEM',
  'Chieu_Thứ Sáu_2': 'Ôn tập củng cố tuần',
  'Chieu_Thứ Sáu_3': 'Sinh hoạt lớp (Tổng kết tuần)'
};

export const INITIAL_APP_SETTINGS = {
  headerTitle: 'UBND Xã Mỹ Lạc – Trường Tiểu Học Mỹ Lạc – Tổ Khối 2',
  schoolName: 'TRƯỜNG TIỂU HỌC MỸ LẠC',
  teamName: 'TỔ CHUYÊN MÔN KHỐI 2',
  academicYear: 'NĂM HỌC 2026-2027',
  communeName: 'UBND XÃ MỸ LẠC',
  secretPasswordLeader: 'Tt112233'
};
