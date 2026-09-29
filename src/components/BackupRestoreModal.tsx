/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  ShieldCheck, 
  FileJson,
  Home
} from 'lucide-react';
import { exportAllDataToJson, importDataFromJson, clearAllPersistentData } from '../utils/persistentStorage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  onGoToHome?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  onGoToHome
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportAllDataToJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SaoLuu_ToKhoi5_TanThanh_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo tệp sao lưu!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Bạn có chắc chắn muốn khôi phục dữ liệu từ tệp này? Thao tác này sẽ cập nhật dữ liệu hiện tại.')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    setImportStatus('Đang đọc và phục hồi dữ liệu...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const success = await importDataFromJson(text);
        if (success) {
          setImportStatus('Khôi phục dữ liệu thành công!');
          setTimeout(() => {
            onDataRestored();
            onClose();
          }, 1000);
        } else {
          setImportStatus('Lỗi: Tệp sao lưu không đúng định dạng!');
        }
      } catch (err) {
        console.error(err);
        setImportStatus('Lỗi khi phân tích tệp sao lưu.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Quản Lý &amp; Sao Lưu Dữ Liệu</h3>
              <p className="text-xs text-slate-300">Lưu trữ lâu dài trên thiết bị (IndexedDB)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Storage status banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">Chế độ lưu trữ lâu dài đang hoạt động</h4>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Mọi tài liệu, thời khóa biểu, công văn, thông báo họp và tệp xét thi đua bạn tải lên được lưu tự động trong cơ sở dữ liệu IndexedDB của trình duyệt. Dữ liệu không bị mất khi tải lại trang.
              </p>
            </div>
          </div>

          {/* Export section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Download className="w-4 h-4 text-blue-600" />
              <span>1. Tải Về Tệp Sao Lưu (Backup Toàn Bộ App)</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Xuất toàn bộ dữ liệu (thời khóa biểu, văn bản, kết quả thi đua, danh sách GV) ra tệp tin JSON về máy tính cá nhân để cất giữ an toàn.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full mt-2 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <FileJson className="w-4 h-4" />
              <span>{isExporting ? 'Đang xuất tệp...' : 'Tải Về Tệp Sao Lưu (.json)'}</span>
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>2. Khôi Phục Dữ Liệu Từ Tệp Sao Lưu</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Chọn tệp tin sao lưu (.json) đã tải về trước đó để nạp lại toàn bộ dữ liệu vào hệ thống.
            </p>
            <label className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Chọn Tệp Sao Lưu (.json) Để Nạp</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            {importStatus && (
              <p className="text-center font-bold text-emerald-700 text-xs mt-1">
                {importStatus}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            {onGoToHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToHome();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs border border-amber-300"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Trở về Trang chủ</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors ml-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
