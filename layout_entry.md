# TÀI LIỆU THIẾT KẾ CẤU TRÚC BỐ TRÍ CÁC NÚT MỚI
## PHẦN MỀM QUẢN LÝ HỤI CHỦ THẢO (OFFLINE 100%)

Tài liệu này ghi lại chi tiết kiến trúc bố trí, cấu trúc mã nguồn (HTML/CSS/JS) và chức năng của các nút bấm mới được bổ sung vào hệ thống theo yêu cầu của Chủ Thảo.

---

### I. NÚT XUẤT FILE BÁO CÁO KẾ BÊN TÊN DÂY HỤI (TRANG CHỦ)

#### 1. Bố trí trực quan
- **Vị trí**: Nằm ngay kế bên **Tên Dây Hụi** trên mỗi thẻ Dây Hụi (`.day-hui-card`) tại Trang chủ.
- **Biểu tượng**: Biểu tượng Tải xuống (Download icon) màu tím mờ tinh tế nền bán trong suốt (`rgba(99, 102, 241, 0.15)`).
- **Hiệu ứng hover**: Khi di chuột qua, nút chuyển sang màu tím đậm và hơi phóng to nhẹ, tạo hiệu ứng chuyển động mượt mà (Micro-animation).

#### 2. Cấu trúc HTML & CSS tích hợp
```html
<div class="card-header">
  <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
    <!-- Tên dây hụi -->
    <div class="card-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">
      ${item.ten_day}
    </div>
    <!-- Nút tải báo cáo tình trạng đóng hụi ngay kế bên tên dây hụi -->
    <button class="btn-card-action" onclick="downloadLineReport('${item.id}', event)" title="Xuất báo cáo tình trạng đóng hụi">
      <svg class="svg-icon" viewBox="0 0 24 24" style="width: 12px; height: 12px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    </button>
  </div>
  <!-- Chevron mở trang chi tiết -->
  <svg class="svg-icon chevron" viewBox="0 0 24 24" style="flex-shrink: 0;">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
</div>
```

#### 3. Xử lý Logic Javascript đặc biệt
Hàm xử lý `downloadLineReport` sử dụng `event.stopPropagation()` để chặn hoàn toàn hành vi lan truyền sự kiện Click (Event Bubbling). Người dùng có thể click tải file báo cáo nhanh bất kỳ lúc nào mà không lo bị hệ thống chuyển hướng vào màn hình chi tiết:
```javascript
function downloadLineReport(lineId, event) {
  if (event) {
    event.stopPropagation(); // KHÔNG MỞ CHI TIẾT KHI CLICK NÚT TẢI XUỐNG
  }
  // Logic lấy dữ liệu và kết xuất file text ...
}
```

---

### II. HÀNG NÚT HÀNH ĐỘNG Ở TRANG CHI TIẾT DÂY HỤI

#### 1. Bố trí trực quan
- **Vị trí**: Nằm ngay bên dưới nút màu cam **"Khai Kỳ Mới (Khui Hụi)"** và phía trên tiêu đề **"Danh sách hụi viên"** của màn hình chi tiết.
- **Bố cục**: Gồm 2 nút bấm lấp đầy chiều ngang (mỗi nút chiếm 50% độ rộng của khung) chia đều cân đối, bo tròn mềm mại góc 14px.

#### 2. Các nút và chức năng
1. **Nút Đóng Nhanh Tất Cả** (Màu xanh Emerald Green):
   - Chức năng: Đóng nhanh tiền hụi cho tất cả hội viên chưa đóng trong kỳ hiện tại bằng một chạm.
   - Giải thuật: Tự động phát hiện giá thầu kỳ này để tính số tiền sống/chết chính xác. Đánh dấu `da_dong: true` và ghi nhận mốc thời gian thực đầy đủ `ngay_dong: new Date().toISOString()`.
2. **Nút Tải Báo Cáo Kỳ** (Màu tím Indigo Blue):
   - Chức năng: Xuất nhanh file tóm tắt chi tiết toàn bộ các chỉ số thu gom tiền, tiền thảo và trạng thái đóng tiền của riêng kỳ hiện tại.

#### 3. Cấu trúc HTML tích hợp
```html
<div class="detail-actions-row" id="detail-actions-row">
  <button class="btn-detail-action btn-success-theme" id="btn-pay-all" onclick="markAllPaidCurrentRound()">
    <svg class="svg-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
    Đóng Nhanh Tất Cả
  </button>
  <button class="btn-detail-action btn-primary-theme" id="btn-download-round" onclick="downloadRoundReport()">
    <svg class="svg-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    Tải Báo Cáo Kỳ
  </button>
</div>
```

---

### III. HƯỚNG DẪN DOWNLOAD / XUẤT FILE PHỤC VỤ LƯU TRỮ CHUẨN EXCEL

1. **Báo cáo tình trạng đóng hụi toàn bộ dây (Lịch sử dây hụi)**: 
   - **Vị trí**: Click nút Download [📥] ngay kế bên tên dây hụi tại trang chủ.
   - **Tệp tin**: Định dạng `.csv` chuẩn Excel, mã hóa **UTF-16 LE** với ký hiệu BOM `0xFF, 0xFE` và phân cách bằng ký tự tab (`\t`) giúp Excel tự động chia cột và hiển thị tiếng Việt hoàn hảo.
   - **Cấu trúc dữ liệu bốn phần**:
     - *Thông tin chung dây hụi*: Tên dây, chu kỳ, số tiền kỳ, tổng số phần, kỳ hiện tại, tiền thảo, ngày bắt đầu.
     - *Phần I: Danh sách hội viên & Thông tin hốt hụi tổng hợp*: STT, Tên hội viên, SĐT, Số phần mua, Trạng thái hốt, Kỳ hốt, Giá thầu khui, Thực nhận hốt, Ngày giờ khui hốt.
     - *Phần II: Bảng tổng hợp kết quả khui hụi qua từng kỳ*: Kỳ khui, Người hốt kỳ này, Giá thầu khui, Tổng gom hụi chết, Tổng gom hụi sống, Tiền thảo trích, Thực nhận giao hội viên, Thời gian khui.
     - *Phần III: Bảng chi tiết trạng thái đóng tiền qua từng kỳ*: Kỳ khui, Hội viên đóng tiền, SĐT, Số phần đóng, Vai trò đóng, Số tiền cần đóng, Trạng thái đóng, Ngày giờ đóng tiền.
     - *Phần IV: Tổng kết tài chính tích lũy*: Tổng số kỳ đã khui hoàn tất, Tổng tiền thảo chủ thảo đã thu.

2. **Báo cáo chi tiết kỳ hiện tại**:
   - **Vị trí**: Vào màn hình chi tiết dây hụi, click nút **"Tải Báo Cáo Kỳ"** màu xanh dương.
   - **Tệp tin**: BaoCaoKy_[Kỳ]_[Tên_Dây]_[Ngày_Tải].csv.
   - **Cấu trúc dữ liệu**:
     - *Thông tin chung kỳ hụi*: Tên dây hụi, chu kỳ, kỳ hiện tại, tổng số phần, ngày xuất báo cáo.
     - *Phần I: Thông tin khui hụi kỳ này*: Trạng thái khui, Hội viên hốt, Giá thầu khui, Tổng gom hụi chết, Tổng gom hụi sống, Tiền thảo trích, Thực nhận giao hội viên, Thời gian khui.
     - *Phần II: Danh sách chi tiết đóng tiền kỳ này*: STT, Tên hội viên, SĐT, Số phần đóng, Vai trò đóng (Hụi sống/Hốt kỳ này/Hụi chết), Số tiền cần đóng, Trạng thái đóng, Ngày giờ đóng tiền.

### IV. CÁC ƯU ĐIỂM CHUẨN HÓA EXCEL CỦA PHẦN MỀM
- **Không bao giờ lỗi font tiếng Việt (Mới)**: Sử dụng chuẩn mã hóa **UTF-16 LE** kết hợp BOM (`0xFF, 0xFE`) ở mức độ byte. Đây là định dạng Unicode được Microsoft Excel hỗ trợ tốt nhất trên Windows, bảo đảm các ký tự tiếng Việt có dấu luôn hiển thị sắc nét và chuẩn xác 100%.
- **Tự động chia cột hoàn hảo (Tab Delimited)**: Sử dụng ký tự phân cách Tab (`\t`) kết hợp với UTF-16 LE giúp Excel tự động phân chia các ô cột rõ ràng ngay khi nhấp đúp trực tiếp vào file, tránh hoàn toàn lỗi xung đột dấu phân cách vùng (Regional Settings) của Windows.
- **Hỗ trợ tính toán số học**: Toàn bộ các trường số tiền (Số tiền một kỳ, tiền thầu, thực nhận, số tiền đóng, tiền thảo) đều được ghi nhận bằng số nguyên gốc dạng chuỗi số, không chứa ký tự phân cách hàng nghìn hay chữ "đ" giúp bạn sử dụng trực tiếp các hàm `=SUM()`, `=AVERAGE()` của Excel một cách hoàn hảo.

*Tài liệu được kết xuất tự động bởi Trợ Lý AI Antigravity phục vụ Chủ Thảo.*
