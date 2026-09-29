import React from 'react';
import { TeacherMember } from '../types';
import { Users, Sparkles, Settings, ShieldCheck, Download, RefreshCw, HardDrive } from 'lucide-react';

interface HeaderProps {
  settings: {
    headerTitle: string;
    schoolName: string;
    teamName: string;
    academicYear: string;
    communeName: string;
  };
  currentUser: TeacherMember;
  members: TeacherMember[];
  onSelectUser: (user: TeacherMember) => void;
  onOpenSettings: () => void;
  onOpenPromptModal: () => void;
  onResetData: () => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  members,
  onSelectUser,
  onOpenSettings,
  onOpenPromptModal,
  onResetData,
  onOpenBackupModal
}) => {
  const totalStudents = members.reduce((sum, m) => sum + (m.totalStudents || 0), 0);
  const totalFemale = members.reduce((sum, m) => sum + (m.femaleStudents || 0), 0);

  return (
    <header className="bg-gradient-to-r from-red-800 via-red-700 to-amber-800 text-white shadow-md border-b-4 border-yellow-400">
      {/* National Emblem & Top Motto Banner */}
      <div className="bg-red-950/60 px-4 py-1.5 border-b border-red-500/30 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-1 text-center md:text-left">
          <div className="font-semibold uppercase tracking-wider text-amber-200 flex items-center gap-2">
            <span>{settings.communeName}</span>
            <span>•</span>
            <span>{settings.schoolName}</span>
          </div>
          <div className="font-medium text-amber-100 italic tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập - Tự do - Hạnh phúc
          </div>
        </div>
      </div>

      {/* Main Brand & Identity */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-400 text-red-900 font-extrabold flex items-center justify-center text-xl shadow-inner shrink-0 border-2 border-yellow-200">
              K2
            </div>
            <div>
              <div className="inline-block bg-yellow-400/20 text-yellow-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-yellow-400/40 mb-1">
                {settings.academicYear}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {settings.headerTitle}
              </h1>
              <p className="text-red-100 text-xs sm:text-sm font-medium mt-0.5">
                Hệ thống Quản lý Chuyên môn • Báo cáo Học sinh • Kế hoạch Dạy học & Ngân hàng Đề thi Bảo mật
              </p>
            </div>
          </div>

          {/* Quick Metrics & User Session Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-xs flex items-center gap-3">
              <div>
                <span className="text-red-200 block text-[10px] uppercase font-bold">Thành viên tổ</span>
                <span className="font-bold text-yellow-300 text-sm">{members.length} GV</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div>
                <span className="text-red-200 block text-[10px] uppercase font-bold">Tổng số HS khối 2</span>
                <span className="font-bold text-white text-sm">{totalStudents} <span className="text-xs text-yellow-200 font-normal">({totalFemale} nữ)</span></span>
              </div>
            </div>

            {/* Current Active User Switcher */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-1.5 border border-white/20 flex items-center gap-2">
              <div className="pl-2">
                <span className="text-[10px] text-yellow-300 block uppercase font-bold">
                  {currentUser.isLeader ? '★ Tổ trưởng Chuyên môn' : 'Thành viên Tổ'}
                </span>
                <select
                  aria-label="Chọn người dùng hiện tại"
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = members.find(m => m.id === e.target.value);
                    if (found) onSelectUser(found);
                  }}
                  className="bg-red-900 text-white font-medium text-xs sm:text-sm rounded px-2 py-1 outline-none border border-yellow-400/50 cursor-pointer max-w-[200px] truncate"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.isLeader ? `★ ${m.name} (Tổ trưởng)` : `${m.name} - ${m.assignedClass || m.campus}`}
                    </option>
                  ))}
                </select>
              </div>
              {currentUser.isLeader && (
                <div title="Quyền Tổ trưởng: Toàn quyền duyệt đề thi, xóa bài viết sai, công bố thi đua" className="p-1.5 bg-yellow-400 text-red-950 rounded font-bold text-xs flex items-center gap-1 shadow">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Tổ</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {onOpenBackupModal && (
                <button
                  type="button"
                  onClick={onOpenBackupModal}
                  title="Lưu trữ lâu dài & Sao lưu / Phục hồi dữ liệu"
                  className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-emerald-400/40 transition-colors shadow-2xs"
                >
                  <HardDrive className="w-4 h-4 text-emerald-200" />
                  <span className="hidden md:inline">Sao Lưu Dữ Liệu</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenPromptModal}
                title="Xem và sao chép mẫu Prompt tạo app trên Google AI Studio"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-red-700" />
                <span className="hidden sm:inline">Prompt AI Studio</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                title="Thay đổi Tên GV, Tên Tổ, Trường, Điểm trường"
                className="bg-white/15 hover:bg-white/25 text-white font-medium px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-white/20 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Cài đặt Tổ & GV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
