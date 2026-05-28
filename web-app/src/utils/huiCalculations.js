// Định dạng tiền tệ
export function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace(/₫/g, 'đ');
}

// Tự động định dạng số có dấu chấm phân cách hàng nghìn khi người dùng gõ
export function formatNumberString(val) {
  if (!val) return '';
  let cleanVal = String(val).replace(/\D/g, "");
  if (cleanVal === "") return "";
  return new Intl.NumberFormat('vi-VN').format(parseInt(cleanVal));
}

// Chuyển chuỗi định dạng hàng nghìn thành số nguyên thô
export function parseNumberString(str) {
  if (!str) return 0;
  const cleanStr = String(str).replace(/\D/g, "");
  return parseInt(cleanStr) || 0;
}

// Định dạng chuỗi ngày giờ đầy đủ (HH:MM ngày DD/MM/YYYY) làm bằng chứng đóng hụi
export function formatDateTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${hours}:${minutes}:${seconds} ngày ${date}`;
  } catch (e) {
    return isoString;
  }
}

// Tính số tiền một hụi viên phải đóng tại một kỳ
export function calculateTienPhaiDong(hv, dayHui, targetKy, allHuiVien = [], giaThauKyNay = 0) {
  const soTienKy = Number(dayHui.so_tien_ky || 0);
  const soPhanMua = Number(hv.so_phan_mua || 1);

  // Hụi chết (đã hốt trước kỳ targetKy hoặc đang hốt kỳ này)
  const daHotTruocKy = hv.da_hot && hv.ky_hot < targetKy;
  const laNguoiHotKyNay = hv.da_hot && hv.ky_hot === targetKy;

  if (daHotTruocKy || laNguoiHotKyNay) {
    return soTienKy * soPhanMua;
  }

  // Hụi sống: Giảm trừ theo giá thầu khui của kỳ đó
  let giaThauK = Number(giaThauKyNay);

  if (targetKy < dayHui.ky_hien_tai) {
    // Tìm giá thầu kỳ quá khứ
    const winner = allHuiVien.find(h => h.da_hot && h.ky_hot === targetKy);
    if (winner) {
      giaThauK = Number(winner.gia_hot || 0);
    }
  }

  return Math.max(0, soTienKy - giaThauK) * soPhanMua;
}

// Tính tiền người hốt thực tế nhận được (Trừ đi tiền thảo)
export function calculateTienNhanThucTe(dayHui, kyHot, giaHot) {
  const soTienKy = Number(dayHui.so_tien_ky || 0);
  const tongSoPhan = Number(dayHui.tong_so_phan || 0);
  const tienThaoMoiKy = Number(dayHui.tien_thao_moi_ky || 0);

  const soPhanChet = kyHot - 1;
  const soPhanSong = Math.max(0, tongSoPhan - soPhanChet - 1);

  const thuChet = soPhanChet * soTienKy;
  const thuSong = soPhanSong * Math.max(0, soTienKy - Number(giaHot || 0));

  return Math.max(0, thuChet + thuSong - tienThaoMoiKy);
}
