import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileDown,
  Printer,
  Share2,
  Trash2,
  Users,
  Check,
  X,
  MessageSquare,
  Coins,
  Sparkles
} from 'lucide-react';
import {
  formatMoney,
  formatNumberString,
  parseNumberString,
  formatDateTime,
  calculateTienPhaiDong,
  calculateTienNhanThucTe
} from '../utils/huiCalculations';
import { downloadRoundReport } from '../utils/excelExporter';

export default function DetailScreen({
  dayHui,
  huiVienList,
  lichSuDong,
  onBack,
  onTogglePayment,
  onMarkAllPaid,
  onKhuiHui,
  onDeleteHui,
  loadingReportId,
  setLoadingReportId
}) {
  const [isKhuiModalOpen, setIsKhuiModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Khui form state
  const [selectedWinnerId, setSelectedWinnerId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [khuiSubmitting, setKhuiSubmitting] = useState(false);

  // Receipt modal state
  const [receiptWinnerId, setReceiptWinnerId] = useState('');
  const [receiptKy, setReceiptKy] = useState(1);

  const percent = Math.round((dayHui.ky_hien_tai / dayHui.tong_so_phan) * 100);

  // Filter members that haven't hotted yet
  const listChuaHot = huiVienList.filter(h => !h.da_hot);

  // Calculate live bid in current round if it has been bid (won)
  const nguoiHotKyNay = huiVienList.find(h => h.da_hot && h.ky_hot === dayHui.ky_hien_tai);
  const giaThauKyNay = nguoiHotKyNay ? Number(nguoiHotKyNay.gia_hot || 0) : 0;

  // Handles bidding thầu preview calculation
  const getKhuiPreviewValue = () => {
    if (!selectedWinnerId || !bidAmount) return 0;
    const bid = parseNumberString(bidAmount);
    return calculateTienNhanThucTe(dayHui, dayHui.ky_hien_tai, bid);
  };

  const handleKhuiHuiSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWinnerId) {
      alert('Vui lòng chọn hội viên hốt kỳ này!');
      return;
    }
    const parsedBid = parseNumberString(bidAmount);
    if (isNaN(parsedBid) || parsedBid < 0) {
      alert('Vui lòng nhập giá thầu hợp lệ!');
      return;
    }

    setKhuiSubmitting(true);
    try {
      await onKhuiHui(selectedWinnerId, parsedBid);
      setIsKhuiModalOpen(false);
      // Auto open receipt for the winner
      handleShowReceipt(selectedWinnerId, dayHui.ky_hien_tai);
    } catch (err) {
      console.error(err);
      alert('Khai kỳ mới thất bại, vui lòng thử lại!');
    } finally {
      setKhuiSubmitting(false);
      setSelectedWinnerId('');
      setBidAmount('');
    }
  };

  const handleShowReceipt = (memberId, ky) => {
    setReceiptWinnerId(memberId);
    setReceiptKy(ky);
    setIsReceiptModalOpen(true);
  };

  const handleZaloReminder = (hv) => {
    const targetKy = dayHui.ky_hien_tai;
    const soTienPhaiDong = calculateTienPhaiDong(hv, dayHui, targetKy, huiVienList, giaThauKyNay);
    const loaiHuiText = { daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng' }[dayHui.loai_hui] || 'Kỳ';
    const laHuiChet = hv.da_hot && hv.ky_hot < targetKy;
    const kieuHui = laHuiChet ? "Hụi chết" : "Hụi sống";

    const message = `Chào Anh/Chị ${hv.ten}, em là chủ thảo dây hụi "${dayHui.ten_day}".\n\nHôm nay khui kỳ thứ ${targetKy} (${loaiHuiText}).\n• Phần đóng: ${hv.so_phan_mua} phần [${kieuHui}].\n• Số tiền cần đóng: ${formatMoney(soTienPhaiDong)}\n\nAnh/Chị vui lòng đóng tiền sớm vào tài khoản của em để em gom giao cho người hốt kỳ này nhé. Cảm ơn Anh/Chị nhiều ạ!`;

    const copyToClipboardFallback = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      return successful;
    };

    const openZalo = () => {
      setTimeout(() => {
        if (hv.sdt) {
          window.open(`https://zalo.me/${hv.sdt}`, '_blank');
        } else {
          window.open('https://chat.zalo.me', '_blank');
        }
      }, 1000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        alert("Đã sao chép tin nhắn nhắc nhở!");
        openZalo();
      }).catch(err => {
        copyToClipboardFallback(message);
        alert("Đã sao chép tin nhắn nhắc nhở (dự phòng)!");
        openZalo();
      });
    } else {
      copyToClipboardFallback(message);
      alert("Đã sao chép tin nhắn nhắc nhở (dự phòng)!");
      openZalo();
    }
  };

  const handleCopyReceiptText = (receiptDetails) => {
    const message = `🧾 BIÊN NHẬN GIAO HỤI 🧾\n-------------------------------\n• ${receiptDetails.dateText}\n• Dây hụi: ${receiptDetails.lineName}\n• Kỳ khui: Kỳ thứ ${receiptDetails.ky}\n• Người hốt hụi: ${receiptDetails.winnerName}\n• Thầu khui: ${receiptDetails.bidVal}\n-------------------------------\n- Phần hụi chết (${receiptDetails.deadShares} phần): ${receiptDetails.deadSum}\n- Phần hụi sống (${receiptDetails.liveShares} phần): ${receiptDetails.liveSum}\n=> TỔNG CỘNG GOM: ${receiptDetails.grossSum}\n• Trừ tiền thảo chủ thảo: ${receiptDetails.commissionSum}\n-------------------------------\n=> THỰC NHẬN CÒN LẠI:\n👉 ${receiptDetails.netSum} 👈\n-------------------------------\nChủ thảo đã lập biên nhận và chuyển khoản / giao tiền mặt đầy đủ cho anh/chị. Cảm ơn anh/chị!`;

    const copyToClipboardFallback = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      return successful;
    };

    const openZalo = () => {
      setTimeout(() => {
        const winner = huiVienList.find(h => h.id === receiptWinnerId);
        if (winner && winner.sdt) {
          window.open(`https://zalo.me/${winner.sdt}`, '_blank');
        } else {
          window.open('https://chat.zalo.me', '_blank');
        }
      }, 1000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        alert("Đã sao chép biên nhận giao hụi!");
        openZalo();
      }).catch(err => {
        copyToClipboardFallback(message);
        alert("Đã sao chép biên nhận giao hụi (dự phòng)!");
        openZalo();
      });
    } else {
      copyToClipboardFallback(message);
      alert("Đã sao chép biên nhận giao hụi (dự phòng)!");
      openZalo();
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Pre-calculate variables for the Receipt modal if active
  let receiptDetails = null;
  if (isReceiptModalOpen && receiptWinnerId) {
    const winner = huiVienList.find(h => h.id === receiptWinnerId);
    if (winner) {
      const soTienKy = Number(dayHui.so_tien_ky);
      const bids = Number(winner.gia_hot || 0);

      const soPhanChet = receiptKy - 1;
      const soPhanSong = Math.max(0, Number(dayHui.tong_so_phan) - soPhanChet - 1);

      const deadSum = soPhanChet * soTienKy;
      const liveSum = soPhanSong * Math.max(0, soTienKy - bids);
      const grossSum = deadSum + liveSum;
      const netSum = Number(winner.tien_nhan_thuc_te || 0);

      receiptDetails = {
        dateText: formatDateTime(winner.ngay_hot),
        lineName: dayHui.ten_day,
        ky: receiptKy,
        winnerName: winner.ten,
        winnerPhone: winner.sdt,
        bidVal: formatMoney(bids),
        deadShares: soPhanChet,
        deadSum: formatMoney(deadSum),
        liveShares: soPhanSong,
        liveSum: formatMoney(liveSum),
        grossSum: formatMoney(grossSum),
        commissionSum: `-${formatMoney(dayHui.tien_thao_moi_ky)}`,
        netSum: formatMoney(netSum)
      };
    }
  }

  const handleDeleteClick = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa hoàn toàn dây hụi "${dayHui.ten_day}"? Tất cả thông tin hội viên và lịch sử đóng tiền sẽ bị xóa sạch và không thể khôi phục.`)) {
      onDeleteHui(dayHui.id);
    }
  };

  return (
    <>
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="detail-title">{dayHui.ten_day}</span>
        <button onClick={handleDeleteClick} style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }} title="Xóa dây hụi">
          <Trash2 size={18} style={{ color: 'var(--danger)' }} />
        </button>
      </div>

      <div className="scroll-area" style={{ paddingTop: '20px' }}>
        {/* Info card */}
        <div className="detail-info-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="gold-coin-decor gold-coin-decor-1">🪙</span>
          <span className="gold-coin-decor gold-coin-decor-2">✨</span>
          <div className="detail-info-row" style={{ position: 'relative' }}>
            <div className="detail-info-col">
              <h3>Số tiền một kỳ</h3>
              <p>{formatMoney(dayHui.so_tien_ky)}</p>
            </div>
            <div className="detail-info-col" style={{ textAlign: 'right' }}>
              <h3>Kỳ hiện tại</h3>
              <p style={{ color: 'var(--warning)' }}>
                Kỳ {dayHui.ky_hien_tai}/{dayHui.tong_so_phan}
              </p>
            </div>
          </div>

          <div className="db-divider" style={{ margin: '12px 0' }}></div>

          <div className="detail-info-row">
            <div className="detail-info-col">
              <h3>Tiền thảo/kỳ</h3>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>{formatMoney(dayHui.tien_thao_moi_ky)}</p>
            </div>
            <div className="detail-info-col" style={{ textAlign: 'right' }}>
              <span
                className="detail-badge"
                style={{
                  color: dayHui.trang_thai === 'active' ? 'var(--success)' : 'var(--primary)',
                  backgroundColor: dayHui.trang_thai === 'active' ? 'var(--success-bg)' : 'rgba(99, 102, 241, 0.15)'
                }}
              >
                {dayHui.trang_thai === 'active' ? 'Đang chạy' : 'Đã hoàn thành'}
              </span>
            </div>
          </div>

          <div className="progress-bar-container" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-dark)' }}>Tiến độ dây hụi</span>
              <span style={{ color: '#fff', fontWeight: '700' }}>{percent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>

          {dayHui.ngay_bat_dau && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📅 Ngày bắt đầu:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {new Date(dayHui.ngay_bat_dau).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔄 Lịch khui hụi:</span>
                <span style={{ color: 'var(--warning)', fontWeight: '700' }}>
                  {dayHui.loai_hui === 'daily' && 'Hàng ngày'}
                  {dayHui.loai_hui === 'weekly' && `Mỗi ${['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(dayHui.ngay_bat_dau).getDay()]} hàng tuần`}
                  {dayHui.loai_hui === 'monthly' && `Ngày ${new Date(dayHui.ngay_bat_dau).getDate()} hàng tháng`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Khai kỳ mới button */}
        {dayHui.trang_thai === 'active' && (
          <button className="btn-khui" onClick={() => setIsKhuiModalOpen(true)}>
            <DollarSign size={18} /> Khai Kỳ Mới (Khui Hụi)
          </button>
        )}

        {/* Current Round Action Buttons */}
        <div className="detail-actions-row">
          <button className="btn-detail-action btn-success-theme" onClick={onMarkAllPaid} title="Đóng tiền nhanh cho tất cả hụi viên chờ đóng kỳ này">
            <Check size={14} /> Đóng Nhanh Tất Cả
          </button>
          <button
            className="btn-detail-action btn-primary-theme"
            onClick={() => {
              setLoadingReportId(dayHui.id);
              try {
                downloadRoundReport(dayHui, huiVienList, lichSuDong, dayHui.ky_hien_tai);
              } finally {
                setLoadingReportId(null);
              }
            }}
            disabled={loadingReportId === dayHui.id}
            title="Xuất báo cáo kỳ này Excel CSV"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {loadingReportId === dayHui.id ? (
              <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1px' }} />
            ) : (
              <>
                <FileDown size={14} /> Tải Báo Cáo Kỳ
              </>
            )}
          </button>
        </div>

        {/* Members List */}
        <div className="section-header">
          <Users size={16} style={{ color: 'var(--primary)' }} />
          <span className="section-title">Danh sách hụi viên</span>
        </div>

        <div id="members-list-container">
          {huiVienList.map((hv) => {
            const targetKy = dayHui.ky_hien_tai;
            const payment = lichSuDong.find(p => p.hui_vien_id === hv.id && p.ky === targetKy);
            const daDong = payment ? payment.da_dong : false;

            const soTienPhaiDong = calculateTienPhaiDong(hv, dayHui, targetKy, huiVienList, giaThauKyNay);

            const daHot = hv.da_hot;
            const daHotTruocDay = daHot && hv.ky_hot < targetKy;
            const hotKyNay = daHot && hv.ky_hot === targetKy;

            return (
              <div key={hv.id} className={`hv-card ${daHot ? 'hotted' : ''}`}>
                <div className="hv-card-left">
                  <div className="hv-avatar">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="hv-name">{hv.ten}</div>
                    <div className="hv-badges">
                      {daHotTruocDay && (
                        <span
                          className="mini-badge"
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                          onClick={() => handleShowReceipt(hv.id, hv.ky_hot)}
                          title="Bấm để xem biên nhận hụi chết"
                        >
                          Hụi chết (Kỳ {hv.ky_hot} 🧾)
                        </span>
                      )}
                      {hotKyNay && (
                        <span
                          className="mini-badge winner"
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                          onClick={() => handleShowReceipt(hv.id, hv.ky_hot)}
                          title="Bấm để xem biên nhận người hốt hụi"
                        >
                          Hốt kỳ này ({formatMoney(hv.tien_nhan_thuc_te)} 🧾)
                        </span>
                      )}
                      {!daHot && <span className="mini-badge live">Hụi sống</span>}

                      {daDong && payment && payment.ngay_dong && (
                        <span
                          className="mini-badge"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: '500' }}
                          title="Mốc thời gian đóng tiền"
                        >
                          ⏱️ {formatDateTime(payment.ngay_dong)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hv-card-right">
                  <div className="hv-amount">{formatMoney(soTienPhaiDong)}</div>
                  <div className="hv-actions">
                    {!daDong && !hotKyNay && (
                      <button className="btn-zalo" onClick={() => handleZaloReminder(hv)} title="Nhắc nhở qua Zalo">
                        <MessageSquare size={14} />
                      </button>
                    )}
                    {!hotKyNay && (
                      <button
                        className={`btn-pay ${daDong ? 'done' : 'todo'}`}
                        onClick={() => onTogglePayment(hv.id, targetKy)}
                        style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        {daDong ? (
                          <>
                            <Check size={12} /> Đã đóng
                          </>
                        ) : (
                          'Chờ đóng'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
           MODAL: KHAI KỲ MỚI (KHUI HỤI)
           ========================================== */}
      {isKhuiModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Khai Kỳ Hụi Thứ {dayHui.ky_hien_tai}</span>
              <button className="btn-close" onClick={() => setIsKhuiModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleKhuiHuiSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn người hốt hụi kỳ này:</label>
                <div className="picker-container">
                  {listChuaHot.length === 0 ? (
                    <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '10px' }}>
                      Tất cả hội viên đã hốt hụi!
                    </div>
                  ) : (
                    listChuaHot.map((hv) => (
                      <div
                        key={hv.id}
                        className={`picker-item ${selectedWinnerId === hv.id ? 'active' : ''}`}
                        onClick={() => setSelectedWinnerId(hv.id)}
                      >
                        <span>
                          {hv.ten} ({hv.so_phan_mua} phần)
                        </span>
                        {selectedWinnerId === hv.id && <Check size={14} style={{ color: 'var(--success)' }} />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Giá thầu khui hụi bỏ thầu (VND):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="Ví dụ: 150.000"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(formatNumberString(e.target.value))}
                  required
                />
              </div>

              {selectedWinnerId && bidAmount && (
                <div className="preview-box">
                  <div className="preview-title">Dự kiến tiền nhận thực tế:</div>
                  <div className="preview-value">{formatMoney(getKhuiPreviewValue())}</div>
                  <div className="preview-sub">
                    (Đã trừ tiền thảo chủ hụi: {formatMoney(dayHui.tien_thao_moi_ky)})
                  </div>
                </div>
              )}

              <button type="submit" className="btn-submit btn-warning-theme" disabled={khuiSubmitting}>
                {khuiSubmitting ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }} />
                ) : (
                  'Xác Nhận Khui Hụi'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
           MODAL: BIÊN NHẬN GIAO HỤI (PRINT & SHARE)
           ========================================== */}
      {isReceiptModalOpen && receiptDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ backgroundColor: '#0F172A', maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">🧾 Biên Nhận Giao Hụi</span>
              <button className="btn-close" onClick={() => setIsReceiptModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Receipt print area */}
            <div
              id="receipt-print-area"
              style={{
                background: '#ffffff',
                color: '#000000',
                padding: '20px',
                borderRadius: '12px',
                fontFamily: "'Courier New', Courier, monospace",
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                marginBottom: '20px',
                lineHeight: '1.4',
                border: '1px dashed #cbd5e1'
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0', color: '#000' }}>
                  BIÊN NHẬN GIAO HỤI
                </h2>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Ngày khui: {receiptDetails.dateText}
                </div>
              </div>

              <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                <div style={{ marginBottom: '3px' }}>
                  <strong>Dây hụi:</strong> {receiptDetails.lineName}
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <strong>Kỳ khui:</strong> Kỳ thứ {receiptDetails.ky}
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <strong>Người hốt:</strong> {receiptDetails.winnerName}
                </div>
                {receiptDetails.winnerPhone && (
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Số điện thoại:</strong> {receiptDetails.winnerPhone}
                  </div>
                )}
                <div style={{ marginBottom: '3px' }}>
                  <strong>Mức thầu khui:</strong> {receiptDetails.bidVal}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', marginBottom: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Hụi chết ({receiptDetails.deadShares} phần):</span>
                  <span>{receiptDetails.deadSum}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Hụi sống ({receiptDetails.liveShares} phần):</span>
                  <span>{receiptDetails.liveSum}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
                  <span>Tổng cộng gom:</span>
                  <span>{receiptDetails.grossSum}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginTop: '4px' }}>
                  <span>Trừ tiền thảo:</span>
                  <span>{receiptDetails.commissionSum}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b' }}>
                  THỰC NHẬN (CÒN LẠI)
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                  {receiptDetails.netSum}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '9px', color: '#64748b', borderTop: '1px dashed #000', paddingTop: '12px', fontStyle: 'italic' }}>
                Cảm ơn Anh/Chị đã tham gia dây hụi!<br />Chúc dây hụi luôn suôn sẻ và may mắn!
              </div>
            </div>

            {/* Receipt Modal buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-submit"
                onClick={() => handleCopyReceiptText(receiptDetails)}
                style={{
                  marginTop: 0,
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifycontent: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                <Share2 size={16} /> Gửi Zalo (Copy)
              </button>
              <button
                className="btn-submit"
                onClick={handlePrintReceipt}
                style={{
                  marginTop: 0,
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                <Printer size={16} /> In Biên Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
