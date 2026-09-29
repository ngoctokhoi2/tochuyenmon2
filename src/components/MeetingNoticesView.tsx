/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MeetingNotice, TeacherMember } from '../types';
import { 
  Video, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  FileText,
  AlertCircle,
  MapPin,
  Sparkles
} from 'lucide-react';
import { FileUploadInput } from './FileUploadInput';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { downloadFile } from '../utils/fileHelpers';
import { isHostServerDevice } from '../utils/onlineSync';

interface MeetingNoticesViewProps {
  meetings: MeetingNotice[];
  members: TeacherMember[];
  currentUser: TeacherMember;
  userEmail?: string;
  isHostServer?: boolean;
  onSaveMeeting: (meeting: MeetingNotice) => void;
  onDeleteMeeting: (id: string) => void;
}

export const MeetingNoticesView: React.FC<MeetingNoticesViewProps> = ({
  meetings,
  members,
  currentUser,
  userEmail,
  isHostServer: propIsHostServer,
  onSaveMeeting,
  onDeleteMeeting
}) => {
  const leaderName = members.find(m => m.isLeader)?.name || 'Nguyễn Kim Ngọc';
  // STRICT RULE: Only host machine with account ngoctokhoi2@gmail.com can delete. Shared machines cannot delete!
  const isHostServer = typeof propIsHostServer === 'boolean'
    ? propIsHostServer
    : isHostServerDevice(userEmail);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingNotice | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    title: string;
    meetingTime: string;
    zoomLink: string;
    zoomMeetingId: string;
    zoomPasscode: string;
    locationType: MeetingNotice['locationType'];
    locationDetail: string;
    agenda: string;
    attendees: string;
    senderName: string;
    isUrgent: boolean;
    attachedFileName: string;
    attachedFileSize: string;
    attachedFileDataUrl?: string;
  }>({
    code: '',
    title: '',
    meetingTime: '',
    zoomLink: 'https://zoom.us/j/84688998899',
    zoomMeetingId: '846 8899 8899',
    zoomPasscode: 'Khoi2MyLac',
    locationType: 'Trực tuyến qua Zoom',
    locationDetail: 'Phòng họp trực tuyến Zoom Tổ Khối 2',
    agenda: '',
    attendees: 'Toàn thể giáo viên Tổ Khối 2 - Trường Tiểu Học Mỹ Lạc',
    senderName: `Tổ trưởng ${leaderName}`,
    isUrgent: false,
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileDataUrl: undefined
  });

  const handleCopyZoomInfo = (meeting: MeetingNotice) => {
    const textToCopy = `📌 THÔNG BÁO HỌP: ${meeting.title}\n⏰ Thời gian: ${meeting.meetingTime}\n💻 Link Zoom: ${meeting.zoomLink}\n🆔 ID cuộc họp: ${meeting.zoomMeetingId}\n🔑 Mật mã: ${meeting.zoomPasscode}\n👥 Thành phần: ${meeting.attendees}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.meetingTime.trim()) {
      alert('Vui lòng nhập tiêu đề cuộc họp và thời gian tổ chức!');
      return;
    }

    const newMeeting: MeetingNotice = {
      id: 'meet-' + Date.now(),
      code: formData.code.trim() || `TB-${Date.now().toString().slice(-4)}/TCM2`,
      title: formData.title.trim(),
      meetingTime: formData.meetingTime.trim(),
      zoomLink: formData.zoomLink.trim(),
      zoomMeetingId: formData.zoomMeetingId.trim(),
      zoomPasscode: formData.zoomPasscode.trim(),
      locationType: formData.locationType,
      locationDetail: formData.locationDetail.trim(),
      agenda: formData.agenda.trim(),
      attendees: formData.attendees.trim(),
      senderName: formData.senderName.trim() || `Tổ trưởng ${leaderName}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      isUrgent: formData.isUrgent,
      attachedFileName: formData.attachedFileName || undefined,
      attachedFileSize: formData.attachedFileSize || undefined,
      attachedFileDataUrl: formData.attachedFileDataUrl
    };

    onSaveMeeting(newMeeting);
    setShowModal(false);
    setFormData({
      code: '',
      title: '',
      meetingTime: '',
      zoomLink: 'https://zoom.us/j/84688998899',
      zoomMeetingId: '846 8899 8899',
      zoomPasscode: 'Khoi2MyLac',
      locationType: 'Trực tuyến qua Zoom',
      locationDetail: 'Phòng họp trực tuyến Zoom Tổ Khối 2',
      agenda: '',
      attendees: 'Toàn thể giáo viên Tổ Khối 2 - Trường Tiểu Học Mỹ Lạc',
      senderName: `Tổ trưởng ${leaderName}`,
      isUrgent: false,
      attachedFileName: '',
      attachedFileSize: '',
      attachedFileDataUrl: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-100 text-cyan-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-cyan-700" />
                <span>Thanh lệnh: Thông báo họp (Zoom)</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tổ trưởng điều hành: <strong>Cô {leaderName}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">
              Lịch Họp &amp; Địa Chỉ Họp Trực Tuyến Zoom Khối 2
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phát hành giấy triệu tập, thông báo họp chuyên môn, kèm đầy đủ <strong>Đường link, ID và Mật mã phòng Zoom trực tuyến</strong> để giáo viên vào họp nhanh chóng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Thông Báo Họp Mới</span>
          </button>
        </div>

        {/* Thông báo quyền quản trị cho máy chia sẻ */}
        {!isHostServer && (
          <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Chế độ máy chia sẻ:</strong> Bạn có quyền xem lịch họp, sao chép ID và tham gia phòng Zoom trực tuyến. Các máy chia sẻ <strong>không có chức năng xóa tài liệu</strong>, chỉ có nút tải xuống. Chỉ có máy chủ Tài khoản <strong>ngoctokhoi2@gmail.com</strong> mới xóa được.</span>
          </div>
        )}
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Chưa Có Lịch Họp Nào Được Tạo</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Hệ thống không sử dụng dữ liệu họp mẫu. Tổ trưởng hoặc giáo viên bấm nút bên dưới để tạo lịch họp chuyên môn mới kèm đường link Zoom trực tuyến.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Thông Báo Họp Zoom Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                m.isUrgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {m.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {m.locationType}
                    </span>
                    {m.isUrgent && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        HỌP GẤP
                      </span>
                    )}
                  </div>

                  {isHostServer && (
                    <button
                      type="button"
                      onClick={() => setDeletingMeeting(m)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Xóa thông báo họp (Chỉ máy chủ ngoctokhoi2@gmail.com)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug mb-3">
                  {m.title}
                </h3>

                {/* Date & Time info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Clock className="w-4 h-4 text-cyan-700" />
                    <span>{m.meetingTime}</span>
                  </span>
                  {m.locationDetail && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.locationDetail}</span>
                    </span>
                  )}
                </div>

                {/* ZOOM ONLINE MEETING BOX - CỰC KỲ RÕ RÀNG */}
                {m.zoomLink && (
                  <div className="p-3.5 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50 border-2 border-cyan-300 rounded-2xl mb-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-950">
                        <Video className="w-4 h-4 text-cyan-700" />
                        <span>ĐỊA CHỈ HỌP TRỰC TUYẾN ZOOM</span>
                      </div>
                      <span className="text-[10px] bg-cyan-200/80 text-cyan-900 font-bold px-2 py-0.5 rounded-full">
                        Phòng họp chuyên môn
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2 rounded-xl border border-cyan-100 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">ID Cuộc họp:</span>
                        <strong className="text-cyan-900 text-sm">{m.zoomMeetingId || 'Chưa cung cấp'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Mật mã (Passcode):</span>
                        <strong className="text-amber-700 text-sm">{m.zoomPasscode || 'Không có'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={m.zoomLink.startsWith('http') ? m.zoomLink : `https://${m.zoomLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
                      >
                        <Video className="w-4 h-4" />
                        <span>Tham Gia Họp Zoom Ngay</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyZoomInfo(m)}
                        className="px-3 py-2 bg-white hover:bg-cyan-100 text-cyan-900 font-semibold text-xs rounded-xl border border-cyan-300 flex items-center gap-1 transition-colors shrink-0"
                        title="Sao chép toàn bộ thông tin phòng Zoom gửi Zalo"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-cyan-700" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Agenda & Attendees */}
                {m.agenda && (
                  <div className="text-xs text-slate-700 mb-2">
                    <strong className="block text-slate-900 mb-0.5">Nội dung cuộc họp:</strong>
                    <p className="whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 leading-relaxed">
                      {m.agenda}
                    </p>
                  </div>
                )}

                {m.attendees && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>Thành phần: {m.attendees}</span>
                  </div>
                )}
              </div>

              {/* Bottom footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Người thông báo: <strong className="text-slate-700">{m.senderName}</strong></span>
                
                {m.attachedFileName && (
                  <button
                    type="button"
                    onClick={() => downloadFile(m.attachedFileName!, m.attachedFileDataUrl, 'application/pdf')}
                    className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{m.attachedFileName}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Meeting */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="bg-cyan-800 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-cyan-300" />
                  <span>Tạo Thông Báo Họp &amp; Cài Đặt Phòng Zoom</span>
                </h3>
                <p className="text-xs text-cyan-200">Phát hành lịch họp Tổ Khối 2</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số hiệu thông báo</label>
                  <input
                    type="text"
                    placeholder="VD: TB-01/TCM2"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình thức họp</label>
                  <select
                    value={formData.locationType}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Trực tuyến qua Zoom">Trực tuyến qua Zoom</option>
                    <option value="Kết hợp trực tiếp & Zoom">Kết hợp trực tiếp &amp; Zoom</option>
                    <option value="Trực tiếp tại trường">Trực tiếp tại trường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề cuộc họp *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Họp Tổ Chuyên Môn Khối 2 định kỳ tuần 4 tháng 9 & sinh hoạt chuyên đề..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời gian tổ chức họp *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 14h30 Thứ Năm, ngày 28/09/2026"
                  value={formData.meetingTime}
                  onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* KHUNG THÔNG TIN PHÒNG ZOOM */}
              <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl space-y-3">
                <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-cyan-700" />
                  <span>Địa chỉ phòng họp Zoom trực tuyến:</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Đường dẫn Zoom (Link)</label>
                  <input
                    type="text"
                    placeholder="https://zoom.us/j/84688998899"
                    value={formData.zoomLink}
                    onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                    className="w-full border border-cyan-300 rounded-lg p-2 bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ID Cuộc họp Zoom</label>
                    <input
                      type="text"
                      placeholder="846 8899 8899"
                      value={formData.zoomMeetingId}
                      onChange={(e) => setFormData({ ...formData, zoomMeetingId: e.target.value })}
                      className="w-full border border-cyan-300 rounded-lg p-2 bg-white font-mono font-bold text-cyan-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mật mã (Passcode)</label>
                    <input
                      type="text"
                      placeholder="Khoi5TanThanh"
                      value={formData.zoomPasscode}
                      onChange={(e) => setFormData({ ...formData, zoomPasscode: e.target.value })}
                      className="w-full border border-cyan-300 rounded-lg p-2 bg-white font-mono font-bold text-amber-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung chương trình cuộc họp (Agenda)</label>
                <textarea
                  rows={3}
                  placeholder="1. Đánh giá tình hình chuyên môn tháng qua&#10;2. Thống nhất kế hoạch dạy học tuần tới&#10;3. Ý kiến chỉ đạo của Tổ trưởng..."
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thành phần tham dự</label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* File attachment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Đính kèm tài liệu họp (nếu có)</label>
                <FileUploadInput
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onFileSelected={({ fileName, fileSize, fileDataUrl }) => {
                    setFormData({
                      ...formData,
                      attachedFileName: fileName,
                      attachedFileSize: fileSize,
                      attachedFileDataUrl: fileDataUrl
                    });
                  }}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isUrgentMeeting"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <label htmlFor="isUrgentMeeting" className="font-semibold text-slate-700 text-xs cursor-pointer">
                  Đánh dấu là cuộc họp khẩn / đột xuất
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Phát Hành Thông Báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deletingMeeting && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeletingMeeting(null)}
          onConfirm={() => {
            onDeleteMeeting(deletingMeeting.id);
            setDeletingMeeting(null);
          }}
          title="Xác nhận xóa thông báo họp"
          itemName={deletingMeeting.title}
          description="Thông báo họp này sẽ bị gỡ khỏi lịch họp của Tổ Khối 2."
        />
      )}
    </div>
  );
};
