import { calculateTienPhaiDong, formatDateTime } from './huiCalculations';

// Tải file Excel CSV về máy chủ offline (hỗ trợ BOM UTF-16 LE và phân cột bằng tab để không bao giờ lỗi font trên Excel)
export function downloadCSVFile(filename, tsvContent) {
  // 1. Tạo UTF-16 LE BOM (FF FE)
  const bom = [0xFF, 0xFE];
  
  // 2. Chuyển đổi chuỗi thành mảng byte UTF-16 LE (mỗi ký tự chiếm 2 byte, Byte thấp trước, Byte cao sau)
  const byteArray = [];
  for (let i = 0; i < tsvContent.length; ++i) {
    const charCode = tsvContent.charCodeAt(i);
    byteArray.push(charCode & 0xFF);         // Byte thấp
    byteArray.push((charCode & 0xFF00) >>> 8); // Byte cao
  }
  
  // 3. Kết hợp BOM và dữ liệu
  const uint8Array = new Uint8Array([...bom, ...byteArray]);
  
  // 4. Tạo Blob với mã hóa UTF-16 LE
  const blob = new Blob([uint8Array], { type: 'text/csv;charset=utf-16le;' });
  
  if (navigator.msSaveBlob) { // Hỗ trợ IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

// 1. Tải báo cáo tình trạng đóng hụi / lịch sử dây hụi chuẩn Excel
export function downloadLineReport(dayHui, allHuiVien, lichSuDong) {
  const loaiHuiText = { daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng' }[dayHui.loai_hui] || 'Kỳ';
  const esc = (val) => '"' + String(val || '').replace(/"/g, '""') + '"';

  let tsv = "";
  tsv += `BÁO CÁO TOÀN BỘ LỊCH SỬ DÂY HỤI\t\t\t\t\t\t\t\t\n`;
  tsv += `THÔNG TIN CHUNG DÂY HỤI\t\t\t\t\t\t\t\t\n`;
  tsv += `Tên dây hụi\tChu kỳ đóng\tSố tiền một kỳ (VND)\tTổng số phần hụi\tKỳ hiện tại\tTrạng thái dây\tTiền thảo mỗi kỳ (VND)\tNgày bắt đầu\tLịch khui hụi\tThời gian xuất báo cáo\n`;
  const scheduleText = dayHui.loai_hui === 'daily' ? 'Hàng ngày' :
    dayHui.loai_hui === 'weekly' ? `Mỗi ${['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(dayHui.ngay_bat_dau).getDay()]} hàng tuần` :
    `Ngày ${new Date(dayHui.ngay_bat_dau).getDate()} hàng tháng`;
  tsv += `${esc(dayHui.ten_day)}\t${esc(loaiHuiText)}\t${dayHui.so_tien_ky}\t${dayHui.tong_so_phan}\tKỳ ${dayHui.ky_hien_tai}\t${esc(dayHui.trang_thai === 'active' ? 'ĐANG CHẠY' : 'ĐÃ HOÀN THÀNH')}\t${dayHui.tien_thao_moi_ky}\t${esc(dayHui.ngay_bat_dau)}\t${esc(scheduleText)}\t${esc(formatDateTime(new Date().toISOString()))}\n`;
  tsv += `\t\t\t\t\t\t\t\t\n`;
  
  tsv += `I. DANH SÁCH HỘI VIÊN & THÔNG TIN HỐT HỤI TỔNG HỢP\t\t\t\t\t\t\t\t\n`;
  tsv += `STT\tTên hội viên\tSố điện thoại\tSố phần mua\tTrạng thái hốt\tKỳ hốt\tGiá thầu khui (VND)\tThực nhận hốt (VND)\tNgày giờ khui hốt\n`;
  allHuiVien.forEach((hv, idx) => {
    let hotStatus = "Chưa hốt";
    let kyHot = "-";
    let giaHot = "-";
    let tienNhan = "-";
    let ngayHot = "-";
    if (hv.da_hot) {
      hotStatus = "Đã hốt";
      kyHot = hv.ky_hot;
      giaHot = hv.gia_hot;
      tienNhan = hv.tien_nhan_thuc_te;
      ngayHot = formatDateTime(hv.ngay_hot);
    }
    tsv += `${idx + 1}\t${esc(hv.ten)}\t${esc(hv.sdt || '')}\t${hv.so_phan_mua}\t${esc(hotStatus)}\t${kyHot}\t${giaHot}\t${tienNhan}\t${esc(ngayHot)}\n`;
  });
  tsv += `\t\t\t\t\t\t\t\t\n`;
  
  tsv += `II. BẢNG TỔNG HỢP KẾT QUẢ KHUI HỤI QUA TỪNG KỲ\t\t\t\t\t\t\t\t\n`;
  tsv += `Kỳ khui\tNgười hốt kỳ này\tGiá thầu khui (VND)\tTổng gom hụi chết (VND)\tTổng gom hụi sống (VND)\tTiền thảo trích (VND)\tThực nhận giao hội viên (VND)\tThời gian khui\n`;
  
  const maxKhuiKy = dayHui.trang_thai === 'completed' ? dayHui.tong_so_phan : dayHui.ky_hien_tai;
  
  for (let k = 1; k <= maxKhuiKy; k++) {
    const winner = allHuiVien.find(h => h.da_hot && h.ky_hot === k);
    if (winner) {
      const soTienKy = Number(dayHui.so_tien_ky);
      const soPhanChet = k - 1;
      const soPhanSong = Math.max(0, Number(dayHui.tong_so_phan) - soPhanChet - 1);
      const deadSum = soPhanChet * soTienKy;
      const liveSum = soPhanSong * Math.max(0, soTienKy - Number(winner.gia_hot || 0));
      tsv += `${k}\t${esc(winner.ten)}\t${winner.gia_hot}\t${deadSum}\t${liveSum}\t${dayHui.tien_thao_moi_ky}\t${winner.tien_nhan_thuc_te}\t${esc(formatDateTime(winner.ngay_hot))}\n`;
    } else {
      tsv += `${k}\tCHƯA KHUI\t-\t-\t-\t-\t-\t-\n`;
    }
  }
  tsv += `\t\t\t\t\t\t\t\t\n`;
  
  tsv += `III. BẢNG CHI TIẾT TRẠNG THÁI ĐÓNG TIỀN QUA TỪNG KỲ\t\t\t\t\t\t\t\t\n`;
  tsv += `Kỳ khui\tHội viên đóng tiền\tSố điện thoại\tSố phần đóng\tVai trò đóng\tSố tiền cần đóng (VND)\tTrạng thái đóng\tNgày giờ đóng tiền\n`;
  
  for (let k = 1; k <= maxKhuiKy; k++) {
    const winner = allHuiVien.find(h => h.da_hot && h.ky_hot === k);
    const giaThauK = winner ? Number(winner.gia_hot || 0) : 0;
    
    allHuiVien.forEach(hv => {
      const payment = lichSuDong.find(p => p.hui_vien_id === hv.id && p.ky === k);
      const daDong = payment ? payment.da_dong : false;
      const laWinner = winner && winner.id === hv.id;
      const daHotTruocDay = hv.da_hot && hv.ky_hot < k;
      
      let role = "Hụi sống";
      if (laWinner) {
        role = "Người hốt kỳ này";
      } else if (daHotTruocDay) {
        role = `Hụi chết (Hốt kỳ ${hv.ky_hot})`;
      }
      
      let statusText = "";
      let ngayDongStr = "-";
      if (laWinner) {
        statusText = "Được nhận tiền hốt";
      } else if (daDong && payment) {
        statusText = "Đã đóng";
        ngayDongStr = formatDateTime(payment.ngay_dong);
      } else {
        statusText = "Chờ đóng";
      }
      
      const tienPhaiDong = calculateTienPhaiDong(hv, dayHui, k, allHuiVien, giaThauK);
      
      tsv += `${k}\t${esc(hv.ten)}\t${esc(hv.sdt || '')}\t${hv.so_phan_mua}\t${esc(role)}\t${tienPhaiDong}\t${esc(statusText)}\t${esc(ngayDongStr)}\n`;
    });
  }
  tsv += `\t\t\t\t\t\t\t\t\n`;
  
  tsv += `IV. TỔNG KẾT TÀI CHÍNH TÍCH LŨY\t\t\t\t\t\t\t\t\n`;
  const hoanThanhKy = allHuiVien.filter(h => h.da_hot).length;
  const totalCommissionLine = hoanThanhKy * Number(dayHui.tien_thao_moi_ky);
  
  tsv += `Tổng số kỳ đã khui hoàn tất\t${hoanThanhKy}\tkỳ\t\t\t\t\t\n`;
  tsv += `Tổng tiền thảo đã thu chủ thảo\t${totalCommissionLine}\tVND\t\t\t\t\t\n`;
  tsv += `Báo cáo xuất từ Phần Mềm Quản Lý Hụi - Tạo bởi Võ Ngọc Tùng | Zalo: 0814666040\t\t\t\t\t\t\t\n`;

  const filename = `TinhTrangDongHui_${dayHui.ten_day.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSVFile(filename, tsv);
}

// 2. Tải báo cáo kỳ hiện tại dạng tệp Excel CSV
export function downloadRoundReport(dayHui, allHuiVien, lichSuDong, targetKy) {
  const loaiHuiText = { daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng' }[dayHui.loai_hui] || 'Kỳ';
  const esc = (val) => '"' + String(val || '').replace(/"/g, '""') + '"';

  let tsv = "";
  tsv += `BÁO CÁO CHI TIẾT TÌNH TRẠNG KỲ HỤI HIỆN TẠI (KỲ ${targetKy})\t\t\t\t\t\t\n`;
  tsv += `Dây hụi\tChu kỳ\tKỳ hiện tại\tTổng số phần\tNgày bắt đầu\tLịch khui hụi\tNgày xuất báo cáo\t\t\t\n`;
  const scheduleText = dayHui.loai_hui === 'daily' ? 'Hàng ngày' :
    dayHui.loai_hui === 'weekly' ? `Mỗi ${['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(dayHui.ngay_bat_dau).getDay()]} hàng tuần` :
    `Ngày ${new Date(dayHui.ngay_bat_dau).getDate()} hàng tháng`;
  tsv += `${esc(dayHui.ten_day)}\tHụi ${esc(loaiHuiText)}\tKỳ ${targetKy}/${dayHui.tong_so_phan}\t${dayHui.tong_so_phan}\t${esc(dayHui.ngay_bat_dau)}\t${esc(scheduleText)}\t${esc(formatDateTime(new Date().toISOString()))}\t\t\t\n`;
  tsv += `\t\t\t\t\t\t\n`;
  
  tsv += `I. THÔNG TIN KHUI HỤI KỲ NÀY\t\t\t\t\t\t\n`;
  const winner = allHuiVien.find(h => h.da_hot && h.ky_hot === targetKy);
  
  if (winner) {
    const soTienKy = Number(dayHui.so_tien_ky);
    const soPhanChet = targetKy - 1;
    const soPhanSong = Math.max(0, Number(dayHui.tong_so_phan) - soPhanChet - 1);
    const deadSum = soPhanChet * soTienKy;
    const liveSum = soPhanSong * Math.max(0, soTienKy - Number(winner.gia_hot || 0));
    const grossSum = deadSum + liveSum;

    tsv += `Trạng thái khui\tHội viên hốt\tGiá thầu khui (VND)\tTổng gom hụi chết (VND)\tTổng gom hụi sống (VND)\tTiền thảo trích (VND)\tThực nhận giao hội viên (VND)\tThời gian khui\n`;
    tsv += `ĐÃ KHUI\t${esc(winner.ten)}\t${winner.gia_hot}\t${deadSum}\t${liveSum}\t${dayHui.tien_thao_moi_ky}\t${winner.tien_nhan_thuc_te}\t${esc(formatDateTime(winner.ngay_hot))}\n`;
  } else {
    tsv += `Trạng thái khui\tLưu ý\t\t\t\t\t\n`;
    tsv += `CHƯA KHUI KỲ NÀY\tCần thực hiện Khai Kỳ Mới để cập nhật thông tin thầu và tính tiền sống/chết.\t\t\t\t\t\n`;
  }
  
  tsv += `\t\t\t\t\t\t\n`;
  tsv += `II. DANH SÁCH CHI TIẾT ĐÓNG TIỀN KỲ NÀY\t\t\t\t\t\t\n`;
  tsv += `STT\tTên hội viên\tSố điện thoại\tSố phần đóng\tVai trò đóng\tSố tiền cần đóng (VND)\tTrạng thái đóng\tNgày giờ đóng tiền\n`;
  
  const giaThauKyNay = winner ? Number(winner.gia_hot || 0) : 0;
  
  allHuiVien.forEach((hv, index) => {
    const payment = lichSuDong.find(p => p.hui_vien_id === hv.id && p.ky === targetKy);
    const daDong = payment ? payment.da_dong : false;
    
    const laNguoiHotKyNay = winner && winner.id === hv.id;
    const daHotTruocDay = hv.da_hot && hv.ky_hot < targetKy;
    
    let loaiHuiNguoiChoi = "Hụi sống";
    if (laNguoiHotKyNay) {
      loaiHuiNguoiChoi = "Hốt kỳ này";
    } else if (daHotTruocDay) {
      loaiHuiNguoiChoi = `Hụi chết (Hốt kỳ ${hv.ky_hot})`;
    }
    
    const soTienPhaiDong = calculateTienPhaiDong(hv, dayHui, targetKy, allHuiVien, giaThauKyNay);
    
    let statusStr = "";
    let ngayDongStr = "-";
    if (laNguoiHotKyNay) {
      statusStr = "Được nhận tiền hốt";
    } else if (daDong && payment) {
      statusStr = "Đã đóng";
      ngayDongStr = formatDateTime(payment.ngay_dong);
    } else {
      statusStr = "Chờ đóng";
    }
    
    tsv += `${index + 1}\t${esc(hv.ten)}\t${esc(hv.sdt || '')}\t${hv.so_phan_mua}\t${esc(loaiHuiNguoiChoi)}\t${soTienPhaiDong}\t${esc(statusStr)}\t${esc(ngayDongStr)}\n`;
  });
  
  tsv += `\t\t\t\t\t\t\n`;
  tsv += `Báo cáo xuất từ Phần Mềm Quản Lý Hụi - Tạo bởi Võ Ngọc Tùng | Zalo: 0814666040\t\t\t\t\t\t\t\n`;

  const filename = `BaoCaoKy_${targetKy}_${dayHui.ten_day.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSVFile(filename, tsv);
}
