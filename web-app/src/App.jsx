import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DetailScreen from './components/DetailScreen';
import { calculateTienNhanThucTe, calculateTienPhaiDong } from './utils/huiCalculations';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Database states
  const [dayHuiList, setDayHuiList] = useState([]);
  const [allHuiVienList, setAllHuiVienList] = useState([]);
  const [allLichSuDong, setAllLichSuDong] = useState([]);

  // UI state
  const [selectedHuiId, setSelectedHuiId] = useState(null);
  const [loadingReportId, setLoadingReportId] = useState(null);

  // Authenticate session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    }).catch((err) => {
      console.error('Auth session error:', err);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all user data
  const fetchData = async () => {
    if (!session?.user) return;
    setLoadingData(true);
    try {
      // 1. Fetch Day Hui
      const { data: dayHui, error: dayHuiError } = await supabase
        .from('day_hui')
        .select('*')
        .order('created_at', { ascending: false });

      if (dayHuiError) throw dayHuiError;
      setDayHuiList(dayHui || []);

      if (dayHui && dayHui.length > 0) {
        const dayHuiIds = dayHui.map((line) => line.id);

        // 2. Fetch Hui Vien
        const { data: huiVien, error: huiVienError } = await supabase
          .from('hui_vien')
          .select('*')
          .in('day_hui_id', dayHuiIds);

        if (huiVienError) throw huiVienError;
        setAllHuiVienList(huiVien || []);

        if (huiVien && huiVien.length > 0) {
          const huiVienIds = huiVien.map((hv) => hv.id);

          // 3. Fetch Lich Su Dong
          const { data: lichSuDong, error: lichSuDongError } = await supabase
            .from('lich_su_dong')
            .select('*')
            .in('hui_vien_id', huiVienIds);

          if (lichSuDongError) throw lichSuDongError;
          setAllLichSuDong(lichSuDong || []);
        } else {
          setAllLichSuDong([]);
        }
      } else {
        setAllHuiVienList([]);
        setAllLichSuDong([]);
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    } else {
      setDayHuiList([]);
      setAllHuiVienList([]);
      setAllLichSuDong([]);
      setSelectedHuiId(null);
    }
  }, [session]);

  const handleLogout = async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?')) {
      await supabase.auth.signOut();
    }
  };

  // Create new day hui line and insert to Supabase
  const handleCreateHui = async (newHui) => {
    if (!session?.user) return;

    // 1. Insert day_hui record
    const { data: dayHuiData, error: dayHuiError } = await supabase
      .from('day_hui')
      .insert({
        user_id: session.user.id,
        ten_day: newHui.ten_day,
        so_tien_ky: newHui.so_tien_ky,
        loai_hui: newHui.loai_hui,
        tong_so_phan: newHui.hui_vien.reduce((acc, m) => acc + m.so_phan_mua, 0),
        ky_hien_tai: 1,
        tien_thao_moi_ky: newHui.tien_thao_moi_ky,
        ngay_bat_dau: newHui.ngay_bat_dau || new Date().toISOString().split('T')[0],
        trang_thai: 'active'
      })
      .select()
      .single();

    if (dayHuiError) throw dayHuiError;

    // 2. Insert hui_vien records
    const huiVienToInsert = newHui.hui_vien.map((m) => ({
      day_hui_id: dayHuiData.id,
      ten: m.ten,
      sdt: m.sdt || null,
      so_phan_mua: m.so_phan_mua || 1,
      da_hot: false
    }));

    const { data: huiVienData, error: huiVienError } = await supabase
      .from('hui_vien')
      .insert(huiVienToInsert)
      .select();

    if (huiVienError) throw huiVienError;

    // 3. Insert initial lich_su_dong records (Kỳ 1)
    const lichSuDongToInsert = huiVienData.map((hv) => ({
      hui_vien_id: hv.id,
      ky: 1,
      da_dong: false,
      so_tien_da_dong: 0
    }));

    const { error: lichSuDongError } = await supabase
      .from('lich_su_dong')
      .insert(lichSuDongToInsert);

    if (lichSuDongError) throw lichSuDongError;

    await fetchData();
  };

  // Import old JSON backup to Supabase
  const handleImportBackup = async (importedLines) => {
    if (!session?.user) return;

    for (const line of importedLines) {
      // 1. Insert line
      const { data: dayHuiData, error: lineError } = await supabase
        .from('day_hui')
        .insert({
          user_id: session.user.id,
          ten_day: line.ten_day,
          so_tien_ky: line.so_tien_ky,
          loai_hui: line.loai_hui,
          tong_so_phan: line.tong_so_phan,
          ky_hien_tai: line.ky_hien_tai,
          tien_thao_moi_ky: line.tien_thao_moi_ky,
          trang_thai: line.trang_thai || 'active',
          ngay_bat_dau: line.ngay_bat_dau || new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (lineError) {
        console.error('Line import error:', lineError);
        continue;
      }

      // 2. Insert members & their history
      if (line.hui_vien && Array.isArray(line.hui_vien)) {
        for (const hv of line.hui_vien) {
          const { data: huiVienData, error: hvError } = await supabase
            .from('hui_vien')
            .insert({
              day_hui_id: dayHuiData.id,
              ten: hv.ten,
              sdt: hv.sdt || null,
              so_phan_mua: hv.so_phan_mua || 1,
              da_hot: hv.trang_thai_hot?.da_hot || hv.da_hot || false,
              ky_hot: hv.trang_thai_hot?.ky_hot || hv.ky_hot || null,
              gia_hot: hv.trang_thai_hot?.gia_hot || hv.gia_hot || null,
              tien_nhan_thuc_te: hv.trang_thai_hot?.tien_nhan_thuc_te || hv.tien_nhan_thuc_te || null,
              ngay_hot: hv.trang_thai_hot?.ngay_hot || hv.ngay_hot || null
            })
            .select()
            .single();

          if (hvError) {
            console.error('Member import error:', hvError);
            continue;
          }

          // 3. Insert payment history
          const historyLogs = hv.lich_su_dong || [];
          if (historyLogs.length > 0) {
            const historyToInsert = historyLogs.map((log) => ({
              hui_vien_id: huiVienData.id,
              ky: log.ky,
              da_dong: log.da_dong,
              so_tien_da_dong: log.so_tien_da_dong,
              ngay_dong: log.ngay_dong || null
            }));

            const { error: histError } = await supabase
              .from('lich_su_dong')
              .insert(historyToInsert);

            if (histError) console.error('History logs import error:', histError);
          }
        }
      }
    }

    await fetchData();
  };

  // Toggle single member payment status
  const handleTogglePayment = async (huiVienId, ky) => {
    const payment = allLichSuDong.find((p) => p.hui_vien_id === huiVienId && p.ky === ky);
    const hv = allHuiVienList.find((h) => h.id === huiVienId);
    const dayHui = dayHuiList.find((line) => line.id === hv.day_hui_id);

    if (!hv || !dayHui) return;

    const isWinnerThisRound = hv.da_hot && hv.ky_hot === ky;
    if (isWinnerThisRound) {
      alert('Người hốt kỳ này không thể đóng tiền hụi sống/chết!');
      return;
    }

    const nextDaDong = payment ? !payment.da_dong : true;
    let soTienPhaiDong = 0;

    if (nextDaDong) {
      const winner = allHuiVienList.find(h => h.day_hui_id === dayHui.id && h.da_hot && h.ky_hot === ky);
      const giaThauKyNay = winner ? Number(winner.gia_hot || 0) : 0;
      soTienPhaiDong = calculateTienPhaiDong(hv, dayHui, ky, allHuiVienList, giaThauKyNay);
    }

    if (payment) {
      // Update
      const { error } = await supabase
        .from('lich_su_dong')
        .update({
          da_dong: nextDaDong,
          so_tien_da_dong: soTienPhaiDong,
          ngay_dong: nextDaDong ? new Date().toISOString() : null
        })
        .eq('id', payment.id);

      if (error) console.error(error);
    } else {
      // Insert new slot if it didn't exist
      const { error } = await supabase
        .from('lich_su_dong')
        .insert({
          hui_vien_id: huiVienId,
          ky: ky,
          da_dong: nextDaDong,
          so_tien_da_dong: soTienPhaiDong,
          ngay_dong: nextDaDong ? new Date().toISOString() : null
        });

      if (error) console.error(error);
    }

    await fetchData();
  };

  // Mark all unpaid members as paid
  const handleMarkAllPaid = async () => {
    if (!selectedHuiId) return;
    const dayHui = dayHuiList.find((line) => line.id === selectedHuiId);
    const lineMembers = allHuiVienList.filter((hv) => hv.day_hui_id === selectedHuiId);
    const targetKy = dayHui.ky_hien_tai;

    const winner = lineMembers.find(h => h.da_hot && h.ky_hot === targetKy);
    const giaThauKyNay = winner ? Number(winner.gia_hot || 0) : 0;

    const nowISO = new Date().toISOString();
    let updatedCount = 0;

    for (const hv of lineMembers) {
      // Skip the round winner (they receive, they do not pay)
      if (winner && winner.id === hv.id) continue;

      const payment = allLichSuDong.find(p => p.hui_vien_id === hv.id && p.ky === targetKy);
      if (!payment || !payment.da_dong) {
        const soTienPhaiDong = calculateTienPhaiDong(hv, dayHui, targetKy, lineMembers, giaThauKyNay);
        
        if (payment) {
          const { error } = await supabase
            .from('lich_su_dong')
            .update({
              da_dong: true,
              so_tien_da_dong: soTienPhaiDong,
              ngay_dong: nowISO
            })
            .eq('id', payment.id);
          if (error) console.error(error);
        } else {
          const { error } = await supabase
            .from('lich_su_dong')
            .insert({
              hui_vien_id: hv.id,
              ky: targetKy,
              da_dong: true,
              so_tien_da_dong: soTienPhaiDong,
              ngay_dong: nowISO
            });
          if (error) console.error(error);
        }
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await fetchData();
      alert(`Đã đóng nhanh thành công cho ${updatedCount} hội viên!`);
    } else {
      alert('Tất cả hội viên đã đóng tiền kỳ này!');
    }
  };

  // Submit round winner & move forward
  const handleKhuiHui = async (winnerId, bid) => {
    if (!selectedHuiId) return;
    const dayHui = dayHuiList.find((line) => line.id === selectedHuiId);
    const lineMembers = allHuiVienList.filter((hv) => hv.day_hui_id === selectedHuiId);
    const currentKy = dayHui.ky_hien_tai;

    const thucNhan = calculateTienNhanThucTe(dayHui, currentKy, bid);
    const nowISO = new Date().toISOString();

    // 1. Update winner in database
    const { error: winnerError } = await supabase
      .from('hui_vien')
      .update({
        da_hot: true,
        ky_hot: currentKy,
        gia_hot: bid,
        tien_nhan_thuc_te: thucNhan,
        ngay_hot: nowISO
      })
      .eq('id', winnerId);

    if (winnerError) throw winnerError;

    // 2. Setup payment slots for the next round (K + 1)
    const isLastRound = currentKy >= dayHui.tong_so_phan;
    if (!isLastRound) {
      const lichSuDongToInsert = lineMembers.map((hv) => ({
        hui_vien_id: hv.id,
        ky: currentKy + 1,
        da_dong: false,
        so_tien_da_dong: 0
      }));

      const { error: logError } = await supabase
        .from('lich_su_dong')
        .insert(lichSuDongToInsert);

      if (logError) console.error(logError);
    }

    // 3. Update day_hui table state
    const nextKy = isLastRound ? currentKy : currentKy + 1;
    const nextTrangThai = isLastRound ? 'completed' : 'active';

    const { error: dayHuiError } = await supabase
      .from('day_hui')
      .update({
        ky_hien_tai: nextKy,
        trang_thai: nextTrangThai
      })
      .eq('id', selectedHuiId);

    if (dayHuiError) throw dayHuiError;

    await fetchData();
  };

  // Delete day hui line (Cascade deletes all member & logs automatically via Postgres RLS & Constraints)
  const handleDeleteHui = async (dayHuiId) => {
    const { error } = await supabase
      .from('day_hui')
      .delete()
      .eq('id', dayHuiId);

    if (error) {
      console.error(error);
      alert('Không thể xóa dây hụi, vui lòng thử lại.');
      return;
    }

    setSelectedHuiId(null);
    await fetchData();
    alert('Đã xóa hoàn toàn dây hụi khỏi cơ sở dữ liệu!');
  };

  // Supabase not configured -> Show setup guide
  if (!isSupabaseConfigured) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '40px 24px', textAlign: 'center', gap: '20px'
      }}>
        <div style={{ fontSize: '64px', filter: 'drop-shadow(0 4px 15px rgba(212,175,55,0.4))' }}>🪙</div>
        <h1 style={{
          fontSize: '28px', fontWeight: '800',
          background: 'linear-gradient(135deg, #FFE066, #D4AF37, #AA7C11)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Quản Lý Hụi Chủ Thảo</h1>
        <div style={{
          background: '#16140F', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px',
          padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'left'
        }}>
          <h2 style={{ fontSize: '16px', color: '#FFE066', marginBottom: '12px', fontWeight: '700' }}>
            ⚙️ Cấu hình Supabase để bắt đầu
          </h2>
          <p style={{ fontSize: '13px', color: '#A8A29A', lineHeight: '1.6', marginBottom: '16px' }}>
            Ứng dụng cần kết nối cơ sở dữ liệu Supabase. Vui lòng thiết lập 2 biến môi trường trên Vercel:
          </p>
          <div style={{
            background: '#0E0D0A', borderRadius: '12px', padding: '14px',
            fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.8',
            border: '1px solid #2D2517', color: '#FAF8F5'
          }}>
            <div style={{ color: '#D4AF37' }}>VITE_SUPABASE_URL</div>
            <div style={{ color: '#736C62', marginBottom: '8px' }}>= https://xxx.supabase.co</div>
            <div style={{ color: '#D4AF37' }}>VITE_SUPABASE_ANON_KEY</div>
            <div style={{ color: '#736C62' }}>= eyJhbGciOi...</div>
          </div>
          <p style={{ fontSize: '11px', color: '#736C62', marginTop: '14px', lineHeight: '1.5' }}>
            Sau khi thêm xong, vào tab <strong style={{ color: '#D4AF37' }}>Deployments</strong> trên Vercel
            → nhấn <strong style={{ color: '#D4AF37' }}>Redeploy</strong> để kích hoạt.
          </p>
        </div>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
          style={{
            background: 'linear-gradient(135deg, #FFE066, #D4AF37)', color: '#0E0D0A',
            padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '14px',
            textDecoration: 'none', boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
            transition: 'transform 0.2s'
          }}
        >Mở Supabase Dashboard</a>
      </div>
    );
  }

  // Loading skeleton screen
  if (loadingAuth) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Đang xác thực tài khoản chủ hụi...</p>
      </div>
    );
  }

  // Not logged in -> Show auth screen
  if (!session) {
    return <Auth />;
  }

  const selectedDayHui = dayHuiList.find((line) => line.id === selectedHuiId);
  const selectedHuiVienList = allHuiVienList.filter((hv) => hv.day_hui_id === selectedHuiId);
  const selectedLichSuDong = allLichSuDong.filter((log) => 
    selectedHuiVienList.some((hv) => hv.id === log.hui_vien_id)
  );

  return (
    <>
      {loadingData && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--success)',
            background: 'var(--success-bg)',
            padding: '4px 8px',
            borderRadius: '12px'
          }}
        >
          <div className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1px' }} />
          Đồng bộ...
        </div>
      )}

      {selectedHuiId && selectedDayHui ? (
        <DetailScreen
          dayHui={selectedDayHui}
          huiVienList={selectedHuiVienList}
          lichSuDong={selectedLichSuDong}
          onBack={() => setSelectedHuiId(null)}
          onTogglePayment={handleTogglePayment}
          onMarkAllPaid={handleMarkAllPaid}
          onKhuiHui={handleKhuiHui}
          onDeleteHui={handleDeleteHui}
          loadingReportId={loadingReportId}
          setLoadingReportId={setLoadingReportId}
        />
      ) : (
        <Dashboard
          user={session.user}
          dayHuiList={dayHuiList}
          allHuiVienList={allHuiVienList}
          allLichSuDong={allLichSuDong}
          onCreateHui={handleCreateHui}
          onLogout={handleLogout}
          onViewHui={(id) => setSelectedHuiId(id)}
          onImportBackup={handleImportBackup}
          loadingReportId={loadingReportId}
          setLoadingReportId={setLoadingReportId}
        />
      )}
    </>
  );
}
