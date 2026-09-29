import React, { useState } from 'react';
import { Copy, Check, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState<boolean>(false);

  const promptText = `Bạn hãy đóng vai trò Senior Fullstack Engineer xây dựng ứng dụng web hoàn chỉnh, thẩm mỹ và chuyên nghiệp bằng React + TypeScript + Tailwind CSS dành cho:
TỰA ĐỀ ỨNG DỤNG:
"UBND Xã Mỹ Lạc – Trường Tiểu Học Mỹ Lạc – Tổ Khối 2"
Phương châm chuẩn quốc hiệu:
CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập - Tự do - Hạnh phúc

I. QUẢN LÝ THÀNH VIÊN VÀ ĐẶC ĐIỂM TỔ CHUYÊN MÔN:
1. Danh sách gồm 7 thành viên Khối 2 (Năm học 2026-2027):
   - Cô Lê Thị Hồng (Năm sinh 1976, Chủ nhiệm Lớp 2/1)
   - Cô Nguyễn Thị Kim Ngọc (Năm sinh 1980, Tổ trưởng Chuyên môn Khối 2, Tài khoản máy chủ ngoctokhoi2@gmail.com)
   - Cô Lê Thị Hồng Thắm (Năm sinh 1974, Chủ nhiệm Lớp 2/3)
   - Cô Hồ Thị Phương Trúc (Năm sinh 1995, Chủ nhiệm Lớp 2/4)
   - Thầy Nguyễn Văn Toản (Năm sinh 1986, Dạy GDTC)
   - Thầy Bùi An Bình (Năm sinh 1986, Dạy GDTC)
   - Cô Lê Thị Ngọc Thùy (Năm sinh 1972, Thư viện - Thiết bị)
2. Cho phép tùy biến: Dễ dàng thay đổi tên Giáo viên, điểm trường, lớp phân công và đổi tên Tổ / Tên Trường khác trong phần Cài đặt.
3. Cho phép chuyển đổi vai trò người thao tác (Tổ trưởng Nguyễn Kim Ngọc hoặc các GV thành viên).

II. 7 THANH LỆNH CHỨC NĂNG CHÍNH:

1. THANH LỆNH 1: GV Báo Cáo Sĩ Số Học Sinh Từng Tháng (kèm HS Khuyết Tật)
   - Thống kê tháng 9 đến tháng 5: Tổng số HS, Nữ, Dân tộc thiểu số, chuyển đến, chuyển đi, lưu ban.
   - Quản lý danh sách học sinh khuyết tật học hòa nhập (Họ tên, dạng tật, biện pháp hỗ trợ theo Thông tư 27/2020).
   - Tự động tính tổng toàn khối và từng phân hiệu, hỗ trợ in ấn xuất báo cáo gửi Ban Giám Hiệu.

2. THANH LỆNH 2: GV Báo Cáo Theo Dõi Học Sinh Chậm Tiến Bộ Từng Môn
   - Theo dõi học sinh chưa hoàn thành nhiệm vụ từng môn (Toán, Tiếng Việt, Tiếng Anh, Khoa học...).
   - Chi tiết: Khó khăn gặp phải, Biện pháp kèm cặp/phụ đạo của GV, Kết quả tiến bộ định kỳ.
   - Chức năng: Thêm mới học sinh cần giúp đỡ, đánh dấu "Đã tiến bộ" để rút khỏi danh sách, xóa hoặc chỉnh sửa.

3. THANH LỆNH 3: Kế Hoạch Tổ & Phân Phối Chương Trình
   - Tải lên các Kế hoạch GD Tổ, Phân phối chương trình 35 tuần, KH tích hợp GDQPAN, STEM, GD địa phương.
   - Toàn bộ giáo viên trong tổ đều xem được và bấm nút tải về máy tính cá nhân.
   - Phân quyền: Tổ trưởng có quyền xóa tệp nếu thành viên gửi lên sai.

4. THANH LỆNH 4: Thư Mục KHDH Cá Nhân & Ngân Hàng Đề Thi Bảo Mật
   - Phân loại theo thư mục: KHDH (kế hoạch dạy học theo tuần), Đề thi GHK I, Đề thi HK I, Đề thi GHK II, Đề thi HK II.
   - GV từng lớp nộp đề thi, ma trận 4 mức độ, bảng đặc tả và đáp án.
   - BẢO MẬT ĐẶC BIỆT: Thư mục đề thi được khóa bảo mật. Muốn xem và thẩm định, Tổ trưởng phải nhập mật khẩu quy định ban đầu là "Tt112233" (có thể đổi). Tổ trưởng duyệt xong thì hệ thống mới mở quyền cho phép tải về.

5. THANH LỆNH 5: KHBD Minh Họa & Sinh Hoạt Chuyên Đề
   - GV gửi bài Kế hoạch bài dạy (KHBD) và phương án thuyết minh sư phạm (lý do chọn bài, dự kiến khó khăn của HS, giải pháp tháo gỡ theo CV 2345).
   - Các GV trong tổ tham gia thảo luận, gửi ý kiến đóng góp theo 4 khía cạnh: Chuẩn bị, Hoạt động học của HS, Tương tác GV-HS, Đánh giá.
   - Tổ trưởng kết luận, chốt biên bản sinh hoạt chuyên môn theo nghiên cứu bài học.

6. THANH LỆNH 6: Công Văn Chỉ Đạo & Thông Báo Họp Của Tổ
   - Tổ trưởng phát thông báo, lịch họp định kỳ của tổ, gửi đường link họp trực tuyến (Google Meet / Zoom kèm thời gian, mật mã).
   - Đính kèm công văn chỉ đạo của Phòng GD&ĐT và Trường. Nếu gửi sai nội dung, Tổ trưởng có quyền xóa/sửa.

7. THANH LỆNH 7: Thông Báo Kết Quả Xét Thi Đua Tổ Viên
   - Tổ trưởng công bố kết quả bình xét thi đua của từng thành viên theo từng đợt: Học kỳ I, Học kỳ II, Cả năm.
   - Tiêu chí: Hồ sơ giáo án, Giờ dạy thao giảng/dự giờ, Chất lượng học sinh, Sáng kiến đổi mới, Đề xuất danh hiệu (Lao động Tiên tiến, CSTĐ Cơ sở, Giấy khen...), Xếp loại chung (Xuất sắc, Tốt, Hoàn thành). Sai TT có quyền sửa hoặc xóa.

III. YÊU CẦU GIAO DIỆN & KỸ THUẬT:
- Giao diện phong cách hành chính sư phạm trang nhã, màu cờ đỏ vàng trang nghiêm kết hợp nền slate hiện đại.
- 100% tiếng Việt chuẩn văn phong tiểu học Việt Nam.
- Dữ liệu lưu trữ bền vững (LocalStorage) và có nút sao lưu / khôi phục dữ liệu gốc.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Mẫu Prompt Chuẩn Cho Google AI Studio</h3>
              <p className="text-xs text-amber-100">
                Bạn có thể sao chép prompt này để tạo hoặc tái tạo app quản lý chuyên môn Khối 2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Info box */}
        <div className="p-5 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shrink-0">
          <BookOpen className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Ứng dụng của bạn đã được khởi tạo và đang chạy hoàn chỉnh ngay tại đây!</strong>
            <p className="text-slate-600 mt-0.5">
              Dưới đây là toàn bộ bản prompt đặc tả kỹ thuật chi tiết đã được tối ưu hóa chuẩn theo cấu trúc yêu cầu của bạn (gồm 15 thành viên, 7 thanh lệnh, mật khẩu Tt112233). Bạn có thể bấm nút <strong>&ldquo;Sao chép Prompt&rdquo;</strong> để lưu lại dùng cho các dự án sau.
            </p>
          </div>
        </div>

        {/* Prompt content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed selection:bg-amber-500 selection:text-slate-950">
          <pre className="whitespace-pre-wrap">{promptText}</pre>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {copied ? '✓ Đã sao chép vào bộ nhớ tạm (Clipboard)' : 'Sẵn sàng để dán vào Google AI Studio'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-xs hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã Sao Chép Thành Công!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Prompt Chuẩn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
