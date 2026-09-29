import React from 'react';
import { 
  Users, 
  TrendingDown, 
  BookOpen, 
  Lock, 
  Presentation, 
  FileText, 
  Video,
  Award,
  CalendarRange,
  Globe,
  RefreshCw,
  Zap
} from 'lucide-react';

export type TabType = 
  | 'reports' 
  | 'struggling' 
  | 'team-plans' 
  | 'exams-plans' 
  | 'lesson-study' 
  | 'directives' 
  | 'meetings'
  | 'timetable'
  | 'emulation';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  counts: {
    reportsCount: number;
    strugglingCount: number;
    teamPlansCount: number;
    examsCount: number;
    lessonStudiesCount: number;
    directivesCount: number;
    meetingsCount: number;
    emulationCount: number;
    timetableCount: number;
  };
  isOnline?: boolean;
  isSyncing?: boolean;
  activePeers?: number;
  onSyncNow?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  counts,
  isOnline = true,
  isSyncing = false,
  activePeers = 1,
  onSyncNow
}) => {
  const tabs = [
    {
      id: 'reports' as TabType,
      label: '1. Báo cáo HS Hàng tháng',
      sublabel: 'Sĩ số & HS khuyết tật',
      icon: Users,
      badge: counts.reportsCount,
      color: 'blue'
    },
    {
      id: 'struggling' as TabType,
      label: '2. HS Chậm tiến bộ',
      sublabel: 'Kế hoạch phụ đạo từng môn',
      icon: TrendingDown,
      badge: counts.strugglingCount,
      color: 'rose'
    },
    {
      id: 'team-plans' as TabType,
      label: '3. Kế hoạch Tổ & PPCT',
      sublabel: 'Tích hợp QPAN, STEM, ĐP',
      icon: BookOpen,
      badge: counts.teamPlansCount,
      color: 'emerald'
    },
    {
      id: 'exams-plans' as TabType,
      label: '4. KHDH & Đề thi',
      sublabel: 'Bảo mật MK Tổ trưởng',
      icon: Lock,
      badge: counts.examsCount,
      color: 'amber',
      isSecret: true
    },
    {
      id: 'lesson-study' as TabType,
      label: '5. KHBD & NCBH Chuyên đề',
      sublabel: 'Nghiên cứu bài học minh họa',
      icon: Presentation,
      badge: counts.lessonStudiesCount,
      color: 'purple'
    },
    {
      id: 'directives' as TabType,
      label: '6. Công văn chỉ đạo',
      sublabel: 'Văn bản chỉ đạo các cấp',
      icon: FileText,
      badge: counts.directivesCount,
      color: 'indigo'
    },
    {
      id: 'meetings' as TabType,
      label: '7. Thông báo họp (Zoom)',
      sublabel: 'Địa chỉ phòng Zoom trực tuyến',
      icon: Video,
      badge: counts.meetingsCount,
      color: 'cyan'
    },
    {
      id: 'timetable' as TabType,
      label: '8. Thời khóa biểu (TKB)',
      sublabel: 'TKB các lớp & báo giảng',
      icon: CalendarRange,
      badge: counts.timetableCount,
      color: 'teal'
    },
    {
      id: 'emulation' as TabType,
      label: '9. Xét thi đua (Word/Excel)',
      sublabel: 'Đính kèm kết quả thi đua',
      icon: Award,
      badge: counts.emulationCount,
      color: 'yellow'
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Strip: Online Mode Status for All Tabs */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Chế độ Online: 9/9 Thanh lệnh đồng bộ tức thì</span>
            </span>
            <span className="hidden md:inline-block text-slate-500">
              Mọi thay đổi trên từng thanh lệnh tự động cập nhật đồng loạt tới Tổ trưởng <strong className="text-slate-700">ngoctokhoi2@gmail.com</strong> và các giáo viên
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activePeers > 1 && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                {activePeers} thiết bị đang kết nối
              </span>
            )}
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-0.5 rounded-md transition-all active:scale-95 disabled:opacity-50"
                title="Bấm để đồng bộ tức thì cả 9 thanh lệnh lên đám mây"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
                ) : (
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                )}
                <span>Đồng bộ 9 thanh lệnh</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="overflow-x-auto no-scrollbar py-2">
          <div className="flex space-x-1 sm:space-x-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-red-50 text-red-800 border-2 border-red-600 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : tab.isSecret
                        ? 'bg-amber-100 text-amber-700'
                        : tab.id === 'meetings'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {tab.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

