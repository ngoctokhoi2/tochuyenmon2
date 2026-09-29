// Helper functions for Word, Excel, and PDF file uploads and downloads

export interface UploadedFileInfo {
  fileName: string;
  fileSize: string;
  fileType: 'word' | 'excel' | 'pdf' | 'other';
  fileDataUrl?: string; // base64 data url for real client-side downloads
}

export function detectFileType(fileName: string): 'word' | 'excel' | 'pdf' | 'other' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'word';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'excel';
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function readFileAsDataUrl(file: File): Promise<{ fileName: string; fileSize: string; fileType: 'word' | 'excel' | 'pdf' | 'other'; fileDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: detectFileType(file.name),
        fileDataUrl: reader.result as string
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function downloadFile(fileName: string, fileDataUrl?: string, fallbackContent?: string) {
  if (fileDataUrl) {
    const link = document.createElement('a');
    link.href = fileDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback: create dynamic Blob according to file type
  const type = detectFileType(fileName);
  let mimeType = 'text/plain;charset=utf-8';
  let content = fallbackContent || `TRƯỜNG TIỂU HỌC MỸ LẠC - TỔ KHỐI 2\nTài liệu: ${fileName}\nNgày xuất: ${new Date().toLocaleDateString('vi-VN')}`;

  if (type === 'excel') {
    // Generate clean CSV/Excel compatible file
    mimeType = 'application/vnd.ms-excel;charset=utf-8';
    if (!fallbackContent) {
      content = `\uFEFFTRƯỜNG TIỂU HỌC MỸ LẠC\nTỔ CHUYÊN MÔN KHỐI 2\n\nTên tệp: ${fileName}\nNgày tạo: ${new Date().toLocaleDateString('vi-VN')}\n`;
    }
  } else if (type === 'word') {
    mimeType = 'application/msword;charset=utf-8';
    if (!fallbackContent) {
      content = `TRƯỜNG TIỂU HỌC MỸ LẠC - TỔ KHỐI 2\nCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nTÀI LIỆU CHUYÊN MÔN KHỐI 2\nTên tài liệu: ${fileName}\n\n${content}`;
    }
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Advanced Excel export using xlsx
export function exportTimetableToExcelFile(
  className: string,
  teacherName: string,
  campus: string,
  effectiveTerm: string,
  scheduleGrid: Record<string, string>,
  note?: string,
  leaderName: string = 'Nguyễn Kim Ngọc'
) {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();

    const data: any[][] = [
      ['UBND XÃ MỸ LẠC - TRƯỜNG TIỂU HỌC MỸ LẠC'],
      ['TỔ CHUYÊN MÔN KHỐI 2 - NĂM HỌC 2026 - 2027'],
      [`THỜI KHÓA BIỂU LỚP: ${className.toUpperCase()}`],
      [`Điểm trường: ${campus}`, `Học kỳ: ${effectiveTerm}`, `GVCN/GV dạy: ${teacherName}`],
      [],
      ['Buổi', 'Tiết', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'],
      ['Sáng', 'Tiết 1', scheduleGrid['Sang_Thứ Hai_1'] || '', scheduleGrid['Sang_Thứ Ba_1'] || '', scheduleGrid['Sang_Thứ Tư_1'] || '', scheduleGrid['Sang_Thứ Năm_1'] || '', scheduleGrid['Sang_Thứ Sáu_1'] || ''],
      ['Sáng', 'Tiết 2', scheduleGrid['Sang_Thứ Hai_2'] || '', scheduleGrid['Sang_Thứ Ba_2'] || '', scheduleGrid['Sang_Thứ Tư_2'] || '', scheduleGrid['Sang_Thứ Năm_2'] || '', scheduleGrid['Sang_Thứ Sáu_2'] || ''],
      ['Sáng', 'Tiết 3', scheduleGrid['Sang_Thứ Hai_3'] || '', scheduleGrid['Sang_Thứ Ba_3'] || '', scheduleGrid['Sang_Thứ Tư_3'] || '', scheduleGrid['Sang_Thứ Năm_3'] || '', scheduleGrid['Sang_Thứ Sáu_3'] || ''],
      ['Sáng', 'Tiết 4', scheduleGrid['Sang_Thứ Hai_4'] || '', scheduleGrid['Sang_Thứ Ba_4'] || '', scheduleGrid['Sang_Thứ Tư_4'] || '', scheduleGrid['Sang_Thứ Năm_4'] || '', scheduleGrid['Sang_Thứ Sáu_4'] || ''],
      ['Chiều', 'Tiết 1', scheduleGrid['Chieu_Thứ Hai_1'] || '', scheduleGrid['Chieu_Thứ Ba_1'] || '', scheduleGrid['Chieu_Thứ Tư_1'] || '', scheduleGrid['Chieu_Thứ Năm_1'] || '', scheduleGrid['Chieu_Thứ Sáu_1'] || ''],
      ['Chiều', 'Tiết 2', scheduleGrid['Chieu_Thứ Hai_2'] || '', scheduleGrid['Chieu_Thứ Ba_2'] || '', scheduleGrid['Chieu_Thứ Tư_2'] || '', scheduleGrid['Chieu_Thứ Năm_2'] || '', scheduleGrid['Chieu_Thứ Sáu_2'] || ''],
      ['Chiều', 'Tiết 3', scheduleGrid['Chieu_Thứ Hai_3'] || '', scheduleGrid['Chieu_Thứ Ba_3'] || '', scheduleGrid['Chieu_Thứ Tư_3'] || '', scheduleGrid['Chieu_Thứ Năm_3'] || '', scheduleGrid['Chieu_Thứ Sáu_3'] || ''],
      [],
      [`Ghi chú: ${note || 'Học 2 buổi/ngày theo Chương trình GDPT 2018'}`],
      [],
      ['GIÁO VIÊN CHỦ NHIỆM', '', '', '', 'TỔ TRƯỞNG CHUYÊN MÔN'],
      [teacherName, '', '', '', leaderName]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, `TKB ${className}`);
    XLSX.writeFile(wb, `TKB_Lop_${className.replace(/[^a-zA-Z0-9]/g, '_')}_TanThanh.xlsx`);
  }).catch(err => {
    console.error('Không thể xuất file excel:', err);
    // Fallback to csv
    downloadFile(`TKB_${className}.csv`, undefined, 'Buổi,Tiết,Thứ Hai,Thứ Ba,Thứ Tư,Thứ Năm,Thứ Sáu\n');
  });
}

// Parse timetable cells from an uploaded Excel or CSV file
export async function parseTimetableFromExcelFile(file: File): Promise<Record<string, string> | null> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return null;

    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return null;

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) return null;

    const result: Record<string, string> = {};
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'] as const;

    // Detect column indexes for days of the week
    const dayColMap: { [key: string]: number } = {};
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const text = String(row[c] || '').toLowerCase().trim();
        if (text.includes('thứ hai') || text.includes('thứ 2')) dayColMap['Thứ Hai'] = c;
        if (text.includes('thứ ba') || text.includes('thứ 3')) dayColMap['Thứ Ba'] = c;
        if (text.includes('thứ tư') || text.includes('thứ 4')) dayColMap['Thứ Tư'] = c;
        if (text.includes('thứ năm') || text.includes('thứ 5')) dayColMap['Thứ Năm'] = c;
        if (text.includes('thứ sáu') || text.includes('thứ 6')) dayColMap['Thứ Sáu'] = c;
      }
      if (Object.keys(dayColMap).length >= 3) break;
    }

    // Default to columns 2..6 if not specifically titled
    if (Object.keys(dayColMap).length < 3) {
      dayColMap['Thứ Hai'] = 2;
      dayColMap['Thứ Ba'] = 3;
      dayColMap['Thứ Tư'] = 4;
      dayColMap['Thứ Năm'] = 5;
      dayColMap['Thứ Sáu'] = 6;
    }

    let currentSession: 'Sang' | 'Chieu' = 'Sang';
    let morningPeriodCounter = 0;
    let afternoonPeriodCounter = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const rowText = row.map(c => String(c || '').toLowerCase()).join(' ');

      if (rowText.includes('chiều') && !rowText.includes('sáng')) {
        currentSession = 'Chieu';
      } else if (rowText.includes('sáng') && !rowText.includes('chiều')) {
        currentSession = 'Sang';
      }

      // Check if row has period identifier
      let period: number | null = null;
      for (let c = 0; c < Math.min(row.length, 3); c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        const m = val.match(/tiết\s*([1-4])/i) || val.match(/^([1-4])$/);
        if (m) {
          period = parseInt(m[1], 10);
          break;
        }
      }

      // If no explicit period word, but has subjects in day columns
      const hasSubjectContent = Object.values(dayColMap).some(idx => {
        const cell = String(row[idx] || '').trim();
        return cell.length > 1 && !cell.toLowerCase().includes('thứ') && !cell.toLowerCase().includes('buổi');
      });

      if (!period && hasSubjectContent) {
        if (currentSession === 'Sang') {
          if (morningPeriodCounter < 4) {
            morningPeriodCounter++;
            period = morningPeriodCounter;
          } else {
            currentSession = 'Chieu';
            afternoonPeriodCounter++;
            period = afternoonPeriodCounter;
          }
        } else {
          if (afternoonPeriodCounter < 3) {
            afternoonPeriodCounter++;
            period = afternoonPeriodCounter;
          }
        }
      }

      if (period && period >= 1) {
        if ((currentSession === 'Sang' && period <= 4) || (currentSession === 'Chieu' && period <= 3)) {
          days.forEach(day => {
            const col = dayColMap[day];
            if (col !== undefined && row[col] !== undefined) {
              const subjectName = String(row[col]).trim();
              if (subjectName && subjectName !== '-' && subjectName !== 'null' && subjectName !== 'undefined') {
                result[`${currentSession}_${day}_${period}`] = subjectName;
              }
            }
          });
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.error('Lỗi khi đọc file Excel:', err);
    return null;
  }
}

