import React, { useState } from 'react';
import { Trash2, Lock, AlertTriangle, Key } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  requirePassword?: boolean;
  correctPassword?: string;
  description?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  requirePassword = false,
  correctPassword = 'Tt112233',
  description
}) => {
  if (!isOpen) return null;

  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirePassword) {
      if (inputPassword.trim() !== correctPassword) {
        setError('Mật khẩu bảo mật không chính xác! (Mật khẩu Tổ trưởng mặc định: Tt112233)');
        return;
      }
    }
    onConfirm();
    onClose();
    setInputPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-base">{title || 'Xác nhận xóa nội dung'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1 leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 p-3.5 rounded-xl border border-red-200 text-xs text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Bạn có chắc chắn muốn xóa nội dung gửi sai này?</p>
              <p className="text-slate-700 mt-1 break-words font-semibold">
                &ldquo;{itemName}&rdquo;
              </p>
              {description && <p className="text-slate-500 mt-1">{description}</p>}
            </div>
          </div>

          {requirePassword && (
            <div className="space-y-2 bg-amber-50 p-3.5 rounded-xl border border-amber-300">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Nội dung thuộc Thanh lệnh bảo mật (Yêu cầu mật khẩu để xóa)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Nhập mật khẩu Tổ trưởng để xác thực quyền xóa (Mật khẩu ban đầu: <strong className="text-amber-800 font-mono">Tt112233</strong>):
              </p>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Nhập mật khẩu (Tt112233)"
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-amber-400 rounded-lg outline-none font-mono focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
              {error && <p className="text-[11px] text-red-600 font-bold">{error}</p>}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xác nhận xóa vĩnh viễn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
