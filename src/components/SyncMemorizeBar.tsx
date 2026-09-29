/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  CheckCircle2, 
  Download, 
  Users, 
  Mail, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Home
} from 'lucide-react';
import { TeacherMember } from '../types';
import { isHostServerDevice } from '../utils/onlineSync';

interface SyncMemorizeBarProps {
  currentUser: TeacherMember;
  userEmail: string;
  onChangeUserEmail: (email: string) => void;
  members: TeacherMember[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSavedTime: string | null;
  lastSavedBy: string | null;
  onManualSaveAndMemorize: () => Promise<void>;
  onPullOnlineUpdates: () => Promise<void>;
  onExportBackup: () => void;
  totalDocumentsCount: number;
  activePeers?: number;
  activeTab?: string;
  onGoToHome?: () => void;
}

export const SyncMemorizeBar: React.FC<SyncMemorizeBarProps> = ({
  currentUser,
  userEmail,
  onChangeUserEmail,
  members,
  isOnline,
  isSyncing,
  lastSavedTime,
  lastSavedBy,
  onManualSaveAndMemorize,
  onPullOnlineUpdates,
  onExportBackup,
  totalDocumentsCount,
  activePeers = 1,
  activeTab,
  onGoToHome
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inputEmail, setInputEmail] = useState(userEmail);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    setInputEmail(userEmail);
  }, [userEmail]);

  const handleSaveClick = async () => {
    await onManualSaveAndMemorize();
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 4000);
  };

  const handleSaveEmail = (emailToSet: string) => {
    onChangeUserEmail(emailToSet);
    setShowEmailModal(false);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md border-y border-emerald-500/30">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Left: Title & Status Badges */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-emerald-800/80 border border-emerald-400/40 px-3 py-1.5 rounded-lg shadow-inner">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 text-emerald-100">
                  {isOnline ? <Cloud className="w-4 h-4 text-emerald-300" /> : <CloudOff className="w-4 h-4 text-rose-300" />}
                  <span>{isOnline ? 'Chế độ Online: Đồng bộ tức thì' : 'Ngoại tuyến (Offline)'}</span>
                </span>
                {isOnline && (
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-200 px-1.5 py-0.5 rounded font-mono border border-emerald-500/50" title="Số lượng máy tính/thiết bị giáo viên đang kết nối trực tiếp">
                    {activePeers} máy online
                  </span>
                )}
              </div>

              <div className="text-xs text-emerald-100/90 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Thanh lệnh ghi nhớ &amp; bảo toàn nội dung tải lên trước khi thoát</span>
              </div>

              {/* Active Email Account Badge */}
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="group flex items-center gap-1.5 text-xs bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-600/60 hover:border-emerald-400/70 px-2.5 py-1 rounded-md transition-all"
                title="Bấm để đổi hoặc cấu hình tài khoản email đang đồng bộ"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300">Tài khoản:</span>
                <strong className="text-white font-mono">{userEmail || 'Chưa đặt email'}</strong>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-600/40 ml-0.5">
                  Đổi
                </span>
              </button>

              {/* Machine Role Badge */}
              {isHostServerDevice(userEmail) ? (
                <span className="text-[11px] bg-amber-400/20 text-amber-300 font-extrabold px-2.5 py-1 rounded-md border border-amber-400/40 flex items-center gap-1 shadow-xs" title="Máy chủ ngoctokhoi2@gmail.com: Có toàn quyền quản trị và xóa tài liệu">
                  🖥️ Máy chủ (ngoctokhoi2@gmail.com)
                </span>
              ) : (
                <span className="text-[11px] bg-sky-900/60 text-sky-200 font-semibold px-2.5 py-1 rounded-md border border-sky-400/40 flex items-center gap-1 shadow-xs" title="Máy chia sẻ: Chỉ có quyền xem & tải về, không có chức năng xóa">
                  💻 Máy chia sẻ (Chỉ xem &amp; Tải về)
                </span>
              )}
            </div>

            {/* Right: Command Actions */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Total items memorized indicator */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-200/80 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-700/40">
                <span>Lưu giữ:</span>
                <strong className="text-emerald-300">{totalDocumentsCount}</strong>
                <span>tài liệu/mục</span>
              </div>

              {/* Action: Trở về trang chủ của app */}
              {onGoToHome && (
                <button
                  type="button"
                  onClick={onGoToHome}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-200 ring-2 ring-amber-300/60"
                  title="Bấm để trở về trang chủ của ứng dụng (Báo cáo HS Hàng tháng)"
                >
                  <Home className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Trở về Trang chủ</span>
                </button>
              )}

              {/* Primary Command: GHI NHỚ & LƯU TẤT CẢ TRƯỚC KHI THOÁT */}
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 border border-emerald-300/40"
                title="Lưu ngay toàn bộ dữ liệu vào bộ nhớ máy và đồng bộ lên server trực tuyến cho mọi tài khoản email"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Save className="w-4 h-4 text-white" />
                )}
                <span>Ghi nhớ &amp; Lưu ngay</span>
              </button>

              {/* Action: Đồng bộ trực tuyến */}
              <button
                type="button"
                onClick={onPullOnlineUpdates}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-all border border-slate-600/70 hover:border-slate-500"
                title="Tải lại nội dung mới nhất từ các giáo viên/email khác vừa cập nhật"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Lấy bản mới</span>
              </button>

              {/* Action: Tải sao lưu .json */}
              <button
                type="button"
                onClick={onExportBackup}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-all border border-slate-600/70 hover:border-slate-500"
                title="Tải tệp sao lưu dữ liệu (.json) về máy tính cá nhân"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">Tải về máy</span>
              </button>

              {/* Action: Hướng dẫn chia sẻ cho các email */}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 bg-teal-800/80 hover:bg-teal-700 text-teal-100 text-xs px-2.5 py-1.5 rounded-lg border border-teal-500/40 transition-all"
                title="Xem hướng dẫn chia sẻ cho các email cùng xem dữ liệu trực tuyến"
              >
                <Users className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden md:inline">Chia sẻ email</span>
              </button>
            </div>

          </div>

          {/* Subline status & exit protection notice */}
          <div className="mt-1.5 pt-1.5 border-t border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-emerald-200/75 gap-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {lastSavedTime ? (
                  <>
                    Đã ghi nhớ lúc: <strong className="text-white">{lastSavedTime}</strong>
                    {lastSavedBy && (
                      <span className="ml-1 text-emerald-300">
                        (Bởi: {lastSavedBy})
                      </span>
                    )}
                  </>
                ) : (
                  'Tất cả tài liệu tải lên tự động được lưu trữ và đồng bộ với mọi tài khoản email được chia sẻ.'
                )}
              </span>
            </div>
            
            <div className="text-emerald-300/80 italic text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Cơ chế bảo vệ trước khi tắt tab: Dữ liệu luôn được lưu vào bộ nhớ lâu dài trước khi thoát app.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner when manually memorized */}
      {saveSuccessNotice && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 shadow-md transition-all flex items-center justify-between border-b border-emerald-400">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>
                <strong>Đã ghi nhớ &amp; lưu giữ thành công toàn bộ nội dung tải lên!</strong> Dữ liệu đã được lưu trữ vĩnh viễn trên máy và đồng bộ trực tuyến. Mọi tài khoản email được chia sẻ ứng dụng đều xem được đầy đủ.
              </span>
            </div>
            <button
              onClick={() => setSaveSuccessNotice(false)}
              className="text-white/80 hover:text-white text-sm font-bold ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal: Đổi / Cấu hình tài khoản Email đang đồng bộ */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-300" />
                  <h3 className="font-bold text-base">Cấu hình Email Đồng Bộ Trực Tuyến</h3>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-white/80 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1">
                Nhập email của bạn hoặc chọn nhanh giáo viên để hệ thống ghi nhận ai đã tải lên hoặc chỉnh sửa nội dung.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập địa chỉ Email của bạn:
                </label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="ví dụ: ngoctokhoi2@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hoặc chọn nhanh theo tài khoản giáo viên trong tổ:
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {/* Default / Admin email */}
                  <button
                    type="button"
                    onClick={() => setInputEmail('ngoctokhoi2@gmail.com')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                      inputEmail === 'ngoctokhoi2@gmail.com'
                        ? 'bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300'
                        : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <span>ngoctokhoi2@gmail.com (Email Quản trị viên)</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Mặc định</span>
                  </button>

                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setInputEmail(m.email || '')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        inputEmail === m.email
                          ? 'bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div>
                        <strong>{m.name}</strong>{' '}
                        <span className="text-slate-500 text-[11px]">({m.assignedClass})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{m.email}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế Online hoạt động thế nào?</strong>
                  <p className="mt-0.5 text-slate-600">
                    Khi bạn hoặc bất kỳ email nào được chia sẻ truy cập app, mọi nội dung tải lên (báo cáo, thời khóa biểu, kế hoạch dạy học, đề thi) sẽ tự động lưu vào bộ nhớ chung trực tuyến. Mọi tài khoản khác mở app đều nhìn thấy dữ liệu mới nhất.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
              {onGoToHome && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    onGoToHome();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow-xs border border-amber-300"
                  title="Trở về Trang chủ (Báo cáo HS)"
                >
                  <Home className="w-3.5 h-3.5 text-slate-950" />
                  <span>Trở về Trang chủ</span>
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEmail(inputEmail)}
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Xác nhận Email này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hướng dẫn chia sẻ và xem trực tuyến cho các Email */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-teal-800 to-slate-900 p-4 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-300" />
                  <h3 className="font-bold text-base">Chia Sẻ &amp; Đồng Bộ Trực Tuyến Khối 2</h3>
                </div>
                <div className="flex items-center gap-2">
                  {onGoToHome && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareModal(false);
                        onGoToHome();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg shadow-sm transition-all"
                      title="Trở về trang chủ ngay"
                    >
                      <Home className="w-3.5 h-3.5 text-slate-950" />
                      <span>Về Trang chủ</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-white/80 hover:text-white text-lg font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-teal-100/80 mt-1">
                Hướng dẫn cách chia sẻ app và đảm bảo mọi tài khoản email đều xem được dữ liệu cập nhật
              </p>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Nút tác vụ nhanh Trở về trang chủ */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-lg p-3 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <strong className="text-amber-950 text-xs block">Cần quay lại làm việc tại Trang chủ?</strong>
                    <span className="text-[11px] text-amber-800">Nhấn nút bên cạnh để đóng chia sẻ và về ngay Trang chủ (Báo cáo HS).</span>
                  </div>
                </div>
                {onGoToHome && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      onGoToHome();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs rounded-lg shadow-sm transition-all shrink-0 border border-amber-300"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-950" />
                    <span>Trở về Trang chủ</span>
                  </button>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-amber-800 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Chế độ Online Toàn Diện cho Tất Cả Tài Khoản Email
                </h4>
                <p>
                  Ứng dụng đã được kích hoạt <strong>Chế độ Online (Máy chủ chia sẻ chung)</strong>: Khi bất kỳ giáo viên nào thuộc tổ hoặc tài khoản email nào được chia sẻ tải tài liệu lên (Kế hoạch bài dạy, Đề thi, Thời khóa biểu, Báo cáo sĩ số), dữ liệu sẽ được lưu giữ vĩnh viễn trên hệ thống trực tuyến.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">3 Quy tắc Ghi nhớ an toàn trước khi thoát app:</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Nhấn nút &quot;Ghi nhớ &amp; Lưu ngay&quot;</strong> trên thanh lệnh màu xanh phía trên sau khi hoàn tất tải file hoặc nhập số liệu.
                  </li>
                  <li>
                    <strong>Tự động lưu khi tắt tab</strong>: Hệ thống có cơ chế bắt sự kiện đóng trang (beforeunload) để tự động bảo vệ dữ liệu chưa kịp bấm nút.
                  </li>
                  <li>
                    <strong>Tải bản sao lưu (.json)</strong>: Để an toàn 100%, bạn có thể nhấn &quot;Tải về máy&quot; để giữ một bản sao lưu cục bộ trên máy tính cá nhân.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-700">Liên kết ứng dụng chia sẻ:</span>
                  <span className="text-[11px] text-emerald-600 font-bold">Online</span>
                </div>
                <div className="bg-white border border-slate-300 rounded p-2 text-slate-600 font-mono text-[11px] select-all break-all">
                  {typeof window !== 'undefined' ? window.location.origin + '/to2/' : 'https://ais-pre-nge6omfnckqhchyy73lbql-905539756508.asia-southeast1.run.app/to2/'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  💡 Bạn có thể gửi đường link này cho các giáo viên trong khối. Bất kỳ ai mở link đều xem được đầy đủ tài liệu đã được tải lên!
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
              {onGoToHome && (
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    onGoToHome();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm hover:shadow transition-all border border-amber-300"
                >
                  <Home className="w-4 h-4 text-slate-950" />
                  <span>Trở về Trang chủ</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg ml-auto"
              >
                Đã hiểu &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
