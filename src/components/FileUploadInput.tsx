import React, { useRef } from 'react';
import { FileText, FileSpreadsheet, File, Upload, X, CheckCircle } from 'lucide-react';
import { detectFileType, formatFileSize, readFileAsDataUrl } from '../utils/fileHelpers';

interface FileUploadInputProps {
  label?: string;
  helperText?: string;
  currentFileName?: string;
  currentFileSize?: string;
  currentFileDataUrl?: string;
  onFileSelected: (info: { fileName: string; fileSize: string; fileType: 'word' | 'excel' | 'pdf' | 'other'; fileDataUrl: string; rawFile?: File }) => void;
  onFileCleared?: () => void;
  required?: boolean;
  onUploadAction?: () => void;
  uploadActionLabel?: string;
  accept?: string;
  allowedTypes?: ('word' | 'excel' | 'pdf' | 'other')[];
  disallowedMessage?: string;
  emptyPromptTitle?: string;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label = 'Tải lên tài liệu đính kèm (Word .doc/.docx hoặc Excel .xls/.xlsx)',
  helperText = 'Hỗ trợ định dạng: Microsoft Word (.docx, .doc), Microsoft Excel (.xlsx, .xls), PDF (.pdf)',
  currentFileName,
  currentFileSize,
  onFileSelected,
  onFileCleared,
  required = false,
  onUploadAction,
  uploadActionLabel,
  accept = '.doc,.docx,.xls,.xlsx,.csv,.pdf',
  allowedTypes,
  disallowedMessage,
  emptyPromptTitle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const detected = detectFileType(file.name);
    if (allowedTypes && !allowedTypes.includes(detected)) {
      alert(disallowedMessage || `Hệ thống không chấp nhận định dạng này. Vui lòng chọn tệp hợp lệ!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const fileInfo = await readFileAsDataUrl(file);
      onFileSelected({ ...fileInfo, rawFile: file });
    } catch (err) {
      console.error('Lỗi khi đọc tệp:', err);
    }
  };

  const fileType = currentFileName ? detectFileType(currentFileName) : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {currentFileName ? (
        /* Selected file display box */
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {fileType === 'word' && (
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              {fileType === 'excel' && (
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              )}
              {fileType === 'pdf' && (
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                  <File className="w-5 h-5" />
                </div>
              )}
              {fileType === 'other' && (
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                  <File className="w-5 h-5" />
                </div>
              )}

              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-800 truncate block">
                    {currentFileName}
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                    fileType === 'word' ? 'bg-blue-600 text-white' :
                    fileType === 'excel' ? 'bg-emerald-600 text-white' :
                    fileType === 'pdf' ? 'bg-rose-600 text-white' : 'bg-slate-600 text-white'
                  }`}>
                    {fileType === 'word' ? 'Word' : fileType === 'excel' ? 'Excel' : fileType?.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {currentFileSize || 'Đã chọn từ máy'} • Sẵn sàng tải lên và lưu trữ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Đổi tệp
              </button>
              {onFileCleared && (
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    onFileCleared();
                  }}
                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Gỡ tệp này"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 -mx-3 -mb-3 p-2.5 rounded-b-xl border-emerald-100">
            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã chọn tệp từ máy tính thành công!</span>
            </span>

            {onUploadAction ? (
              <button
                type="button"
                onClick={onUploadAction}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadActionLabel || 'Tải Lên Ngay'}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        /* Empty click-to-upload area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-4 text-center cursor-pointer transition-colors group"
        >
          <div className="flex justify-center items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            {(!allowedTypes || allowedTypes.includes('excel')) && (
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            )}
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
            {emptyPromptTitle || 'Nhấp chuột để chọn tệp Word (.docx) hoặc Excel (.xlsx) từ máy tính'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
};
