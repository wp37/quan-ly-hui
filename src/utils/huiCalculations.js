/**
 * Các hàm hỗ trợ tính toán tài chính Hụi dành cho Chủ Thảo.
 * Đảm bảo các phép tính hụi sống, hụi chết, tiền thảo và tiền nhận thực tế chính xác 100%.
 */

/**
 * Tính số tiền một hụi viên cụ thể cần đóng cho một kỳ K.
 * 
 * @param {Object} huiVien - Đối tượng hụi viên
 * @param {Object} dayHui - Đối tượng dây hụi
 * @param {number} targetKy - Kỳ cần tính tiền đóng
 * @param {number} giaHotKyNay - Giá thầu của kỳ cần tính (nếu là kỳ hiện tại)
 * @returns {number} Số tiền hụi viên này phải đóng trong kỳ đó
 */
export const calculateTienPhaiDong = (huiVien, dayHui, targetKy, giaHotKyNay = 0) => {
  const { so_tien_ky, hui_vien } = dayHui;

  // 1. Hụi chết: đã hốt TRƯỚC kỳ targetKy → đóng đủ 100% số tiền kỳ
  const daHotTruocKy = huiVien.trang_thai_hot.da_hot && huiVien.trang_thai_hot.ky_hot < targetKy;
  if (daHotTruocKy) {
    return so_tien_ky * huiVien.so_phan_mua;
  }

  // 2. Người hốt kỳ này: vẫn đóng như HỤI SỐNG (trừ giá thầu)
  // Chỉ tính chết từ kỳ SAU khi đã hốt
  const laNguoiHotKyNay = huiVien.trang_thai_hot.da_hot && huiVien.trang_thai_hot.ky_hot === targetKy;
  if (laNguoiHotKyNay) {
    return Math.max(0, so_tien_ky - giaHotKyNay) * huiVien.so_phan_mua;
  }

  // Hụi sống: Được giảm trừ dựa trên giá thầu của kỳ đó
  // Tìm xem kỳ đó ai đã hốt và giá thầu là bao nhiêu
  let giaThauK = giaHotKyNay;
  
  if (targetKy < dayHui.ky_hien_tai) {
    // Nếu tính kỳ lịch sử, tìm người đã hốt kỳ đó để lấy giá thầu thực tế
    const nguoiHotKyTarget = hui_vien.find(
      hv => hv.trang_thai_hot.da_hot && hv.trang_thai_hot.ky_hot === targetKy
    );
    if (nguoiHotKyTarget) {
      giaThauK = nguoiHotKyTarget.trang_thai_hot.gia_hot;
    }
  }

  // Tiền đóng hụi sống = (Số tiền kỳ - Giá thầu kỳ đó) * Số phần mua
  return Math.max(0, so_tien_ky - giaThauK) * huiVien.so_phan_mua;
};

/**
 * Tính số tiền thực nhận của người hốt hụi tại kỳ K.
 * 
 * @param {Object} dayHui - Đối tượng dây hụi
 * @param {number} kyHot - Kỳ hốt hụi (ví dụ: 1, 2, 3...)
 * @param {number} giaHot - Giá thầu bỏ để hốt hụi
 * @returns {number} Số tiền thực nhận sau khi thu từ hụi chết, hụi sống và trừ tiền thảo
 */
export const calculateTienNhanThucTe = (dayHui, kyHot, giaHot) => {
  const { so_tien_ky, tong_so_phan, tien_thao_moi_ky } = dayHui;

  // Số lượng phần hụi đã chết (đã hốt trước kỳ kyHot)
  // Kỳ K thì đã có (K - 1) phần hốt trước đó
  const soPhanChet = kyHot - 1;

  // Số lượng phần hụi còn sống (chưa hốt, tính cả phần của người hốt kỳ này nhưng về bản chất người hốt sẽ nhận thu nhập ròng từ các phần còn lại)
  // Số phần sống còn lại = Tổng số phần - Số phần đã chết - 1 (phần đang hốt kỳ này)
  const soPhanSong = Math.max(0, tong_so_phan - soPhanChet - 1);

  // Tiền thu từ hụi chết = số phần chết * 100% tiền kỳ
  const tienThuHuiChet = soPhanChet * so_tien_ky;

  // Tiền thu từ hụi sống = số phần sống * (tiền kỳ - giá thầu)
  const tienThuHuiSong = soPhanSong * Math.max(0, so_tien_ky - giaHot);

  // Tổng nhận trước khi trừ tiền thảo
  const tongThu = tienThuHuiChet + tienThuHuiSong;

  // Thực tế nhận = Tổng thu - Tiền thảo của chủ hụi
  return Math.max(0, tongThu - tien_thao_moi_ky);
};

/**
 * Tính toán báo cáo tài chính tổng quan cho một dây hụi
 * 
 * @param {Object} dayHui - Đối tượng dây hụi
 * @returns {Object} Các chỉ số tài chính tổng quan
 */
export const calculateDayHuiStats = (dayHui) => {
  const { so_tien_ky, tong_so_phan, ky_hien_tai, tien_thao_moi_ky, hui_vien } = dayHui;

  // 1. Tổng tiền thảo chủ hụi đã thu được tính đến kỳ hiện tại
  // Mỗi kỳ khui hụi chủ hụi thu tiền thảo
  const tongTienThaoDaThu = (ky_hien_tai - 1) * tien_thao_moi_ky;

  // 2. Số hụi viên đã hốt
  const soPhanDaHot = hui_vien.filter(hv => hv.trang_thai_hot.da_hot).length;
  const soPhanChuaHot = tong_so_phan - soPhanDaHot;

  // 3. Kỳ thầu tiếp theo
  const kyTiepTheo = ky_hien_tai;

  return {
    tongTienThaoDaThu,
    soPhanDaHot,
    soPhanChuaHot,
    kyTiepTheo
  };
};

/**
 * Tạo nội dung tin nhắn nhắc nhở qua Zalo
 * 
 * @param {Object} huiVien - Hụi viên cần nhắc
 * @param {Object} dayHui - Dây hụi tương ứng
 * @param {number} soTienDong - Số tiền chính xác cần đóng
 * @returns {string} Nội dung tin nhắn đã được định dạng
 */
export const generateZaloMessage = (huiVien, dayHui, soTienDong) => {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace(/₫/g, 'đ');
  };

  const loaiHuiVietNamese = {
    daily: 'Ngày',
    weekly: 'Tuần',
    monthly: 'Tháng'
  }[dayHui.loai_hui] || 'Kỳ';

  // Xác định trạng thái hụi đóng là hụi sống hay hụi chết
  const laHuiChet = huiVien.trang_thai_hot.da_hot && huiVien.trang_thai_hot.ky_hot < dayHui.ky_hien_tai;
  const kieuHuiText = laHuiChet ? "Hụi chết (đã hốt)" : "Hụi sống (chưa hốt)";

  return `Chào Anh/Chị ${huiVien.ten}, em là chủ thảo dây hụi "${dayHui.ten_day}".\n\n` +
         `Hôm nay khui kỳ thứ ${dayHui.ky_hien_tai} (${loaiHuiVietNamese}).\n` +
         `• Phần tham gia: ${huiVien.so_phan_mua} phần [${kieuHuiText}].\n` +
         `• Số tiền cần đóng: *${formatMoney(soTienDong)}*\n\n` +
         `Anh/Chị vui lòng chuyển khoản sớm giúp em vào tài khoản để em gom giao cho người hốt kỳ này nhé. Cảm ơn Anh/Chị nhiều ạ!`;
};
