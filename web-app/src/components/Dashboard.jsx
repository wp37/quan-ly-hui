import { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Calendar,
  ChevronRight,
  Download,
  Upload,
  LogOut,
  X,
  FileDown,
  Coins,
  Sparkles
} from 'lucide-react';
import { formatMoney, formatNumberString, parseNumberString, formatDateTime } from '../utils/huiCalculations';
import { downloadLineReport } from '../utils/excelExporter';

export default function Dashboard({
  user,
  dayHuiList,
  allHuiVienList,
  allLichSuDong,
  onCreateHui,
  onLogout,
  onViewHui,
  onImportBackup,
  loadingReportId,
  setLoadingReportId
}) {
  const [currentTab, setCurrentTab] = useState('weekly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [huiType, setHuiType] = useState('weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberMode, setMemberMode] = useState('auto'); // 'auto' | 'paste'
  const [autoShares, setAutoShares] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pastePreview, setPastePreview] = useState('Phát hiện: 0 hội viên - Tổng cộng: 0 phần hụi');
  const [submitting, setSubmitting] = useState(false);

  // Calculate Cumulative Commission (Tích lũy)
  const totalCommission = dayHuiList.reduce((acc, line) => {
    // Cumulative commission is based on rounds completed (i.e. ky_hien_tai - 1 if active, or tong_so_phan if completed)
    const roundsCompleted = line.trang_thai === 'completed' 
      ? Number(line.tong_so_phan) 
      : Number(line.ky_hien_tai || 1) - 1;
    return acc + roundsCompleted * Number(line.tien_thao_moi_ky || 0);
  }, 0);

  const activeLines = dayHuiList.filter((line) => line.trang_thai === 'active').length;

  const filteredLines = dayHuiList.filter((line) => line.loai_hui === currentTab);

  // Group counts for badges
  const dailyCount = dayHuiList.filter((line) => line.loai_hui === 'daily').length;
  const weeklyCount = dayHuiList.filter((line) => line.loai_hui === 'weekly').length;
  const monthlyCount = dayHuiList.filter((line) => line.loai_hui === 'monthly').length;

  // Handle excel parse
  const parsePastedMembers = (text) => {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const members = [];
    let idx = 0;

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      idx++;
      let parts = cleanLine.split('\t');
      if (parts.length === 1) {
        parts = cleanLine.split(/[,;]/);
      }

      let mName = parts[0].trim();
      let sdt = '';
      let shares = 1;

      if (parts.length > 1) {
        const secondPart = parts[1].trim();
        if (/^\d+$/.test(secondPart)) {
          if (secondPart.length >= 8) {
            sdt = secondPart;
          } else {
            shares = parseInt(secondPart) || 1;
          }
        } else {
          sdt = secondPart;
        }
      }

      if (parts.length > 2) {
        const thirdPart = parts[2].trim();
        if (/^\d+$/.test(thirdPart)) {
          shares = parseInt(thirdPart) || 1;
        }
      }

      members.push({
        ten: mName || `Hội viên ${idx}`,
        sdt: sdt,
        so_phan_mua: shares
      });
    });
    return members;
  };

  const handlePasteChange = (text) => {
    setPasteText(text);
    const parsed = parsePastedMembers(text);
    const totalShares = parsed.reduce((acc, m) => acc + m.so_phan_mua, 0);
    setPastePreview(`Phát hiện: ${parsed.length} hội viên - Tổng cộng: ${totalShares} phần hụi`);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handlePasteChange(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleCreateHui = async (e) => {
    e.preventDefault();
    if (!name || !amount || !commission) {
      alert('Vui lòng nhập đầy đủ tên dây hụi, số tiền kỳ và tiền thảo!');
      return;
    }

    const parsedAmount = parseNumberString(amount);
    const parsedCommission = parseNumberString(commission);

    if (parsedAmount <= 0 || parsedCommission < 0) {
      alert('Vui lòng nhập giá trị tài chính hợp lệ!');
      return;
    }

    let members = [];
    if (memberMode === 'auto') {
      const shares = parseInt(autoShares);
      if (isNaN(shares) || shares <= 0) {
        alert('Vui lòng nhập tổng số phần hụi hợp lệ!');
        return;
      }
      for (let i = 1; i <= shares; i++) {
        members.push({
          ten: `Hội viên ${i}`,
          sdt: '',
          so_phan_mua: 1
        });
      }
    } else {
      members = parsePastedMembers(pasteText);
      if (members.length === 0) {
        alert('Vui lòng dán hoặc tải danh sách hội viên hợp lệ!');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onCreateHui({
        ten_day: name,
        so_tien_ky: parsedAmount,
        loai_hui: huiType,
        tien_thao_moi_ky: parsedCommission,
        ngay_bat_dau: startDate,
        hui_vien: members
      });
      // Reset form
      setName('');
      setAmount('');
      setCommission('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setAutoShares('');
      setPasteText('');
      setPastePreview('Phát hiện: 0 hội viên - Tổng cộng: 0 phần hụi');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Tạo dây hụi thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackupExport = () => {
    // Generate JSON package of current user's data
    const exportData = dayHuiList.map(line => {
      const members = allHuiVienList.filter(hv => hv.day_hui_id === line.id);
      const membersWithHistory = members.map(hv => {
        const history = allLichSuDong.filter(log => log.hui_vien_id === hv.id);
        return {
          ...hv,
          lich_su_dong: history
        };
      });
      return {
        ...line,
        hui_vien: membersWithHistory
      };
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const filename = `Backup_AppHui_Cloud_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    link.click();
  };

  const handleBackupImportClick = () => {
    const input = document.getElementById('cloud-backup-input');
    if (input) input.click();
  };

  const handleBackupImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('Bạn có chắc chắn muốn nạp tệp sao lưu? Các dây hụi trong file sẽ được đồng bộ trực tiếp lên tài khoản Cloud Supabase của bạn.')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) {
          alert('Định dạng file sao lưu không hợp lệ!');
          return;
        }
        await onImportBackup(importedData);
        alert('Nạp dữ liệu sao lưu thành công lên Supabase Cloud!');
      } catch (err) {
        console.error(err);
        alert('Lỗi đọc tệp hoặc tệp bị hỏng!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header>
        <div className="header-info">
          <h2>Võ Ngọc Tùng</h2>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Quản Lý Hụi <Coins className="icon-gold-glow" size={24} />
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-add" onClick={() => setIsAddModalOpen(true)} title="Tạo dây hụi mới">
            +
          </button>
        </div>
      </header>

      {/* User profile & Logout */}
      <div style={{ padding: '0 20px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="user-badge">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
          {user.user_metadata?.display_name || user.email}
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <LogOut size={12} /> Đăng xuất
        </button>
      </div>

      {/* Financial Block */}
      <div className="dashboard-card">
        <span className="gold-coin-decor gold-coin-decor-1">🪙</span>
        <span className="gold-coin-decor gold-coin-decor-2">✨</span>
        <span className="gold-coin-decor gold-coin-decor-3">🪙</span>
        <div className="db-header">
          <div className="db-icon">
            <Coins size={20} className="icon-gold-glow" />
          </div>
          <div className="db-title">Doanh Thu Chủ Thảo (Tích Lũy)</div>
        </div>
        <div className="db-value">{formatMoney(totalCommission)}</div>
        <div className="db-sub">Tổng tiền thảo (hoa hồng) đã thu từ các kỳ khui</div>

        <div className="db-divider"></div>

        <div className="db-stats">
          <div className="db-stat-col">
            <div className="db-stat-num">{dayHuiList.length}</div>
            <div className="db-stat-label">Tổng số dây hụi</div>
          </div>
          <div className="db-stat-col">
            <div className="db-stat-num">{activeLines}</div>
            <div className="db-stat-label">Dây đang chạy</div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Backup */}
      <div className="backup-row">
        <button className="btn-backup" onClick={handleBackupExport} title="Xuất toàn bộ dây hụi về máy dưới dạng JSON">
          <Download size={12} /> Xuất file sao lưu
        </button>
        <button className="btn-backup" onClick={handleBackupImportClick} title="Nhập tệp sao lưu JSON cũ vào Cloud">
          <Upload size={12} /> Nạp file sao lưu
        </button>
        <input
          type="file"
          id="cloud-backup-input"
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleBackupImportFile}
        />
      </div>

      {/* Tab controls */}
      <div className="tab-container">
        <button
          className={`tab-button ${currentTab === 'daily' ? 'active' : ''}`}
          onClick={() => setCurrentTab('daily')}
        >
          Hụi Ngày <span className="tab-badge">{dailyCount}</span>
        </button>
        <button
          className={`tab-button ${currentTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setCurrentTab('weekly')}
        >
          Hụi Tuần <span className="tab-badge">{weeklyCount}</span>
        </button>
        <button
          className={`tab-button ${currentTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setCurrentTab('monthly')}
        >
          Hụi Tháng <span className="tab-badge">{monthlyCount}</span>
        </button>
      </div>

      {/* Saving lines list */}
      <div className="scroll-area">
        {filteredLines.length === 0 ? (
          <div className="empty-box">
            <Calendar size={48} />
            <p>Không có dây hụi nào trong mục này</p>
          </div>
        ) : (
          filteredLines.map((line) => {
            const percent = Math.round((line.ky_hien_tai / line.tong_so_phan) * 100);
            const lineMembers = allHuiVienList.filter(hv => hv.day_hui_id === line.id);
            const lineHistory = allLichSuDong.filter(log => 
              lineMembers.some(hv => hv.id === log.hui_vien_id)
            );

            return (
              <div key={line.id} className="day-hui-card" onClick={() => onViewHui(line.id)}>
                <div className="card-header">
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <div
                        className="card-name"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '190px'
                        }}
                      >
                        {line.ten_day}
                      </div>
                      <button
                        className="btn-card-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoadingReportId(line.id);
                          try {
                            downloadLineReport(line, lineMembers, lineHistory);
                          } finally {
                            setLoadingReportId(null);
                          }
                        }}
                        disabled={loadingReportId === line.id}
                        title="Xuất báo cáo lịch sử đóng hụi Excel CSV"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {loadingReportId === line.id ? (
                          <div className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1px' }} />
                        ) : (
                          <FileDown size={12} />
                        )}
                      </button>
                    </div>
                    <div className="card-date-row" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', margin: '4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        <span>Bắt đầu: {new Date(line.ngay_bat_dau).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '600' }}>
                        {line.loai_hui === 'daily' && `🔄 Khui: Hàng ngày`}
                        {line.loai_hui === 'weekly' && `🔄 Khui: Mỗi ${['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(line.ngay_bat_dau).getDay()]} hàng tuần`}
                        {line.loai_hui === 'monthly' && `🔄 Khui: Ngày ${new Date(line.ngay_bat_dau).getDate()} hàng tháng`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="chevron" />
                </div>

                <div className="card-divider"></div>

                <div className="card-metrics">
                  <div className="metric-col">
                    <div className="metric-label">Số tiền kỳ</div>
                    <div className="metric-value">{formatMoney(line.so_tien_ky)}</div>
                  </div>
                  <div className="metric-col" style={{ textAlign: 'right' }}>
                    <div className="metric-label">Tiến độ kỳ</div>
                    <div className="metric-value" style={{ color: 'var(--warning)' }}>
                      Kỳ {line.ky_hien_tai}/{line.tong_so_phan}
                    </div>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
           MODAL: TẠO MỚI DÂY HỤI
           ========================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Tạo Dây Hụi Mới</span>
              <button className="btn-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateHui}>
              <div className="form-group">
                <label className="form-label">Tên dây hụi:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Dây hụi 1 triệu Bà Tám"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số tiền kỳ (VND):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="Ví dụ: 1.000.000"
                  value={amount}
                  onChange={(e) => setAmount(formatNumberString(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loại dây hụi (Chu kỳ):</label>
                <div className="type-selector-row">
                  <button
                    type="button"
                    className={`type-selector-btn ${huiType === 'daily' ? 'active' : ''}`}
                    onClick={() => setHuiType('daily')}
                  >
                    Ngày
                  </button>
                  <button
                    type="button"
                    className={`type-selector-btn ${huiType === 'weekly' ? 'active' : ''}`}
                    onClick={() => setHuiType('weekly')}
                  >
                    Tuần
                  </button>
                  <button
                    type="button"
                    className={`type-selector-btn ${huiType === 'monthly' ? 'active' : ''}`}
                    onClick={() => setHuiType('monthly')}
                  >
                    Tháng
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ngày mở dây hụi:</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                {startDate && (
                  <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '6px', fontWeight: '600' }}>
                    {huiType === 'daily' && `Khui hụi: Hàng ngày từ ${new Date(startDate).toLocaleDateString('vi-VN')}`}
                    {huiType === 'weekly' && `Khui hụi: Mỗi ${['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][new Date(startDate).getDay()]} hàng tuần`}
                    {huiType === 'monthly' && `Khui hụi: Ngày ${new Date(startDate).getDate()} hàng tháng`}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Danh sách hội viên:</label>
                <div className="type-selector-row" style={{ marginBottom: '10px' }}>
                  <button
                    type="button"
                    className={`type-selector-btn ${memberMode === 'auto' ? 'active' : ''}`}
                    onClick={() => setMemberMode('auto')}
                    style={{ fontSize: '12px', padding: '6px' }}
                  >
                    Tự sinh tên
                  </button>
                  <button
                    type="button"
                    className={`type-selector-btn ${memberMode === 'paste' ? 'active' : ''}`}
                    onClick={() => setMemberMode('paste')}
                    style={{ fontSize: '12px', padding: '6px' }}
                  >
                    Dán từ Excel/Word
                  </button>
                </div>

                {memberMode === 'auto' ? (
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Nhập tổng số phần (Ví dụ: 10)"
                    value={autoShares}
                    onChange={(e) => setAutoShares(e.target.value)}
                    required={memberMode === 'auto'}
                  />
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Dán hoặc tải file (.txt):
                      </span>
                      <button
                        type="button"
                        onClick={() => document.getElementById('cloud-txt-input').click()}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--card-border)',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontSize: '11px'
                        }}
                      >
                        Chọn tệp .txt
                      </button>
                      <input
                        type="file"
                        id="cloud-txt-input"
                        style={{ display: 'none' }}
                        accept=".txt,.csv"
                        onChange={handleFileImport}
                      />
                    </div>
                    <textarea
                      className="form-input"
                      style={{
                        height: '110px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        resize: 'vertical',
                        lineHeight: '1.4'
                      }}
                      placeholder="Cách 1: Tên mỗi dòng một người:&#10;Chị Lan Bún Nước&#10;Anh Hùng Xe Ôm&#10;&#10;Cách 2: Quét bảng Excel rồi dán (Tên, SĐT, Số phần):&#10;Chị Lan Bún Nước	0901112223	1&#10;Anh Hùng Xe Ôm	0903334445	2"
                      value={pasteText}
                      onChange={(e) => handlePasteChange(e.target.value)}
                      required={memberMode === 'paste'}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '6px', fontWeight: '600' }}>
                      {pastePreview}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tiền thảo chủ thảo thu mỗi kỳ (VND):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="Ví dụ: 200.000"
                  value={commission}
                  onChange={(e) => setCommission(formatNumberString(e.target.value))}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: '0 auto' }} />
                ) : (
                  'Tạo Dây Hụi Mới'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
