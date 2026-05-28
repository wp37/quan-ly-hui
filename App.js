import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert, 
  Share,
  Linking,
  StatusBar
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ArrowLeft,
  Check, 
  RefreshCw, 
  X, 
  User,
  Shield,
  Activity
} from 'lucide-react-native';

import { initialHuiData } from './src/data/huiData';
import { 
  calculateTienPhaiDong, 
  calculateTienNhanThucTe, 
  calculateDayHuiStats, 
  generateZaloMessage 
} from './src/utils/huiCalculations';

export default function App() {
  // Quản lý trạng thái dữ liệu các dây hụi
  const [huiData, setHuiData] = useState(initialHuiData);
  
  // Trạng thái tab hiển thị ('daily' | 'weekly' | 'monthly')
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Dây hụi đang được chọn để xem chi tiết
  const [selectedHuiId, setSelectedHuiId] = useState(null);
  
  // Trạng thái hiển thị modal Khai Kỳ Mới (Khui Hụi)
  const [isKhuiHuiModalOpen, setIsKhuiHuiModalOpen] = useState(false);
  
  // Trạng thái form Khui Hụi
  const [selectedWinnerId, setSelectedWinnerId] = useState('');
  const [biddingAmount, setBiddingAmount] = useState('');
  
  // Trạng thái hiển thị modal Thêm Dây Hụi Mới
  const [isAddHuiModalOpen, setIsAddHuiModalOpen] = useState(false);
  
  // Trạng thái form Thêm Dây Hụi Mới
  const [newHuiName, setNewHuiName] = useState('');
  const [newHuiAmount, setNewHuiAmount] = useState('');
  const [newHuiType, setNewHuiType] = useState('weekly');
  const [newHuiTotalShares, setNewHuiTotalShares] = useState('');
  const [newHuiCommission, setNewHuiCommission] = useState('');

  // Lọc danh sách dây hụi theo tab active
  const filteredHuiList = huiData.filter(item => item.loai_hui === activeTab);
  
  // Lấy đối tượng dây hụi đang chọn
  const activeHui = huiData.find(item => item.id === selectedHuiId);

  // Định dạng hiển thị tiền tệ
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount).replace(/₫/g, 'đ');
  };

  // Tính tổng hoa hồng chủ thảo đã thu trên toàn bộ các dây hụi
  const calculateTotalCommissionCollected = () => {
    return huiData.reduce((total, item) => {
      const stats = calculateDayHuiStats(item);
      return total + stats.tongTienThaoDaThu;
    }, 0);
  };

  // Thay đổi trạng thái đóng tiền của hụi viên trong kỳ hiện tại
  const togglePaymentStatus = (huiVienId) => {
    setHuiData(prevData => {
      return prevData.map(day => {
        if (day.id !== selectedHuiId) return day;
        
        const updatedHuiVien = day.hui_vien.map(hv => {
          if (hv.id !== huiVienId) return hv;
          
          const targetKy = day.ky_hien_tai;
          const updatedHistory = hv.lich_su_dong.map(historyItem => {
            if (historyItem.ky !== targetKy) return historyItem;
            
            const newDaDong = !historyItem.da_dong;
            // Tính số tiền cần đóng tại kỳ hiện tại
            // Giả sử lấy thầu kỳ này của người đã hốt (nếu có)
            const nguoiHotKyNay = day.hui_vien.find(
              h => h.trang_thai_hot.da_hot && h.trang_thai_hot.ky_hot === targetKy
            );
            const giaThauKyNay = nguoiHotKyNay ? nguoiHotKyNay.trang_thai_hot.gia_hot : 0;
            const soTienPhaiDong = calculateTienPhaiDong(hv, day, targetKy, giaThauKyNay);

            return {
              ...historyItem,
              da_dong: newDaDong,
              so_tien_da_dong: newDaDong ? soTienPhaiDong : 0,
              ngay_dong: newDaDong ? new Date().toISOString().split('T')[0] : null
            };
          });
          
          return { ...hv, lich_su_dong: updatedHistory };
        });
        
        return { ...day, hui_vien: updatedHuiVien };
      });
    });
  };

  // Xử lý gửi tin nhắn nhắc nhở Zalo qua tính năng chia sẻ hệ thống
  const handleZaloReminder = async (huiVien) => {
    const targetKy = activeHui.ky_hien_tai;
    // Tìm giá thầu của người hốt kỳ hiện tại nếu đã khui
    const nguoiHotKyNay = activeHui.hui_vien.find(
      h => h.trang_thai_hot.da_hot && h.trang_thai_hot.ky_hot === targetKy
    );
    const giaThauKyNay = nguoiHotKyNay ? nguoiHotKyNay.trang_thai_hot.gia_hot : 0;
    const soTienPhaiDong = calculateTienPhaiDong(huiVien, activeHui, targetKy, giaThauKyNay);
    
    const message = generateZaloMessage(huiVien, activeHui, soTienPhaiDong);
    
    try {
      // Sao chép tin nhắn và mở sheet chia sẻ cực kỳ chuyên nghiệp
      const result = await Share.share({
        message: message,
      });
      if (result.action === Share.sharedAction) {
        // Mở tiếp Zalo nếu có số điện thoại
        if (huiVien.sdt) {
          Linking.openURL(`https://zalo.me/${huiVien.sdt}`);
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi tin nhắn nhắc nhở.");
    }
  };

  // Xử lý Khai Kỳ Mới (Khui Hụi)
  const handleKhuiHuiSubmit = () => {
    if (!selectedWinnerId) {
      Alert.alert("Thông báo", "Vui lòng chọn hụi viên hốt kỳ này.");
      return;
    }
    if (!biddingAmount || isNaN(biddingAmount) || parseInt(biddingAmount) < 0) {
      Alert.alert("Thông báo", "Vui lòng nhập giá thầu hợp lệ.");
      return;
    }

    const price = parseInt(biddingAmount);

    setHuiData(prevData => {
      return prevData.map(day => {
        if (day.id !== selectedHuiId) return day;

        const currentKy = day.ky_hien_tai;
        
        // 1. Tính số tiền thực nhận của người hốt hụi kỳ này
        const thucNhan = calculateTienNhanThucTe(day, currentKy, price);

        // 2. Cập nhật thông tin hụi viên
        const updatedHuiVien = day.hui_vien.map(hv => {
          let updatedHv = { ...hv };

          // Cập nhật thông tin hốt hụi cho người thắng thầu
          if (hv.id === selectedWinnerId) {
            updatedHv.trang_thai_hot = {
              da_hot: true,
              ky_hot: currentKy,
              gia_hot: price,
              ngay_hot: new Date().toISOString().split('T')[0],
              tien_nhan_thuc_te: thucNhan
            };
          }

          // Cập nhật lịch sử đóng hụi kỳ này:
          // Người thắng thầu kỳ này đóng 100% tiền kỳ
          // Người khác đóng tùy theo sống/chết
          const updatedHistory = hv.lich_su_dong.map(historyItem => {
            if (historyItem.ky !== currentKy) return historyItem;
            
            const soTienDong = calculateTienPhaiDong(updatedHv, day, currentKy, price);
            return {
              ...historyItem,
              // Tự động đánh dấu đã đóng cho kỳ khui này nếu chủ thảo muốn
              da_dong: false, // Để chủ thảo thu tiền và tick sau
              so_tien_da_dong: 0, 
              ngay_dong: null
            };
          });

          // Chuẩn bị kỳ tiếp theo (K + 1): Thêm slot đóng tiền mới
          if (currentKy < day.tong_so_phan) {
            updatedHistory.push({
              ky: currentKy + 1,
              da_dong: false,
              so_tien_da_dong: 0,
              ngay_dong: null
            });
          }

          updatedHv.lich_su_dong = updatedHistory;
          return updatedHv;
        });

        const isLastRound = currentKy >= day.tong_so_phan;

        return {
          ...day,
          ky_hien_tai: isLastRound ? currentKy : currentKy + 1,
          trang_thai: isLastRound ? 'completed' : 'active',
          hui_vien: updatedHuiVien
        };
      });
    });

    // Reset form và đóng modal
    setSelectedWinnerId('');
    setBiddingAmount('');
    setIsKhuiHuiModalOpen(false);
    Alert.alert("Thành công", `Kỳ hụi thứ ${activeHui.ky_hien_tai} đã được khui thành công!`);
  };

  // Xử lý tạo Dây Hụi mới
  const handleCreateHui = () => {
    if (!newHuiName || !newHuiAmount || !newHuiTotalShares || !newHuiCommission) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin dây hụi mới.");
      return;
    }

    const valueAmount = parseInt(newHuiAmount);
    const valueShares = parseInt(newHuiTotalShares);
    const valueCommission = parseInt(newHuiCommission);

    if (isNaN(valueAmount) || isNaN(valueShares) || isNaN(valueCommission)) {
      Alert.alert("Thông báo", "Số tiền nhập vào phải là số hợp lệ.");
      return;
    }

    // Tạo danh sách hụi viên trống theo số phần
    const newMembers = [];
    for (let i = 1; i <= valueShares; i++) {
      newMembers.push({
        id: `hv_${Date.now()}_${i}`,
        ten: `Hụi viên ${i}`,
        sdt: '',
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      });
    }

    const newDayHui = {
      id: `day_hui_${Date.now()}`,
      ten_day: newHuiName,
      so_tien_ky: valueAmount,
      loai_hui: newHuiType,
      ngay_bat_dau: new Date().toISOString().split('T')[0],
      tong_so_phan: valueShares,
      ky_hien_tai: 1,
      trang_thai: "active",
      tien_thao_moi_ky: valueCommission,
      hui_vien: newMembers
    };

    setHuiData(prev => [newDayHui, ...prev]);
    setIsAddHuiModalOpen(false);

    // Reset Form
    setNewHuiName('');
    setNewHuiAmount('');
    setNewHuiTotalShares('');
    setNewHuiCommission('');
    
    Alert.alert("Thành công", `Đã khởi tạo dây hụi "${newHuiName}" thành công!`);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        
        {/* MÀN HÌNH CHI TIẾT DÂY HỤI */}
        {selectedHuiId ? (
          <View style={{ flex: 1 }}>
            {/* Header Chi Tiết */}
            <View style={styles.detailHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedHuiId(null)}
              >
                <ArrowLeft color="#9CA3AF" size={24} />
              </TouchableOpacity>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {activeHui.ten_day}
              </Text>
              <View style={styles.placeholderButton} />
            </View>

            <ScrollView contentContainerStyle={styles.detailContent}>
              {/* Tấm card thông tin tổng quan dây hụi */}
              <View style={styles.gorgeousInfoCard}>
                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Số tiền kỳ</Text>
                    <Text style={styles.infoValue}>{formatMoney(activeHui.so_tien_ky)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Kỳ hiện tại</Text>
                    <Text style={[styles.infoValue, { color: '#F59E0B' }]}>
                      Kỳ {activeHui.ky_hien_tai}/{activeHui.tong_so_phan}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Tiền thảo chủ hụi/kỳ</Text>
                    <Text style={styles.infoValueSub}>{formatMoney(activeHui.tien_thao_moi_ky)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <View style={[
                      styles.badge, 
                      activeHui.trang_thai === 'active' ? styles.badgeActive : styles.badgeCompleted
                    ]}>
                      <Text style={styles.badgeText}>
                        {activeHui.trang_thai === 'active' ? 'Đang chạy' : 'Hoàn thành'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress bar của dây hụi */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>Tiến độ dây hụi</Text>
                    <Text style={styles.progressPercent}>
                      {Math.round((activeHui.ky_hien_tai / activeHui.tong_so_phan) * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[
                      styles.progressBarFill, 
                      { width: `${(activeHui.ky_hien_tai / activeHui.tong_so_phan) * 100}%` }
                    ]} />
                  </View>
                </View>
              </View>

              {/* Nút Khai Kỳ Mới */}
              {activeHui.trang_thai === 'active' && (
                <TouchableOpacity 
                  style={styles.khuiHuiButton}
                  onPress={() => setIsKhuiHuiModalOpen(true)}
                >
                  <Activity color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.khuiHuiButtonText}>Khai Kỳ Mới (Khui Hụi)</Text>
                </TouchableOpacity>
              )}

              {/* Danh sách thành viên hụi */}
              <View style={styles.sectionHeaderContainer}>
                <Users color="#6366F1" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Danh sách hụi viên ({activeHui.hui_vien.length})</Text>
              </View>

              {activeHui.hui_vien.map((hv) => {
                const targetKy = activeHui.ky_hien_tai;
                
                // Kiểm tra hụi viên này đã đóng tiền kỳ hiện tại chưa
                const currentPayment = hv.lich_su_dong.find(p => p.ky === targetKy);
                const daDongKyNay = currentPayment ? currentPayment.da_dong : false;

                // Tìm giá thầu của người hốt kỳ hiện tại nếu đã khui
                const nguoiHotKyNay = activeHui.hui_vien.find(
                  h => h.trang_thai_hot.da_hot && h.trang_thai_hot.ky_hot === targetKy
                );
                const giaThauKyNay = nguoiHotKyNay ? nguoiHotKyNay.trang_thai_hot.gia_hot : 0;
                
                // Tính số tiền cần đóng của kỳ này
                const soTienPhaiDong = calculateTienPhaiDong(hv, activeHui, targetKy, giaThauKyNay);

                // Phân loại kiểu hụi
                const daHotHui = hv.trang_thai_hot.da_hot;
                const daHotTruocDay = daHotHui && hv.trang_thai_hot.ky_hot < targetKy;
                const hotKyNay = daHotHui && hv.trang_thai_hot.ky_hot === targetKy;

                return (
                  <View 
                    key={hv.id} 
                    style={[
                      styles.hvCard,
                      daHotHui ? styles.hvCardHotted : null
                    ]}
                  >
                    <View style={styles.hvCardLeft}>
                      <View style={[
                        styles.avatarContainer,
                        daHotHui ? styles.avatarContainerHotted : styles.avatarContainerActive
                      ]}>
                        <User color={daHotHui ? '#9CA3AF' : '#10B981'} size={20} />
                      </View>
                      
                      <View style={styles.hvInfo}>
                        <Text style={[
                          styles.hvName,
                          daHotTruocDay ? styles.hvNameHotted : null
                        ]}>
                          {hv.ten}
                        </Text>
                        
                        {/* Nhãn Hụi sống / Hụi chết / Người hốt */}
                        <View style={{ flexDirection: 'row', marginTop: 4 }}>
                          {daHotTruocDay && (
                            <View style={[styles.miniBadge, styles.miniBadgeDead]}>
                              <Text style={styles.miniBadgeText}>Hụi chết (Kỳ {hv.trang_thai_hot.ky_hot})</Text>
                            </View>
                          )}
                          {hotKyNay && (
                            <View style={[styles.miniBadge, styles.miniBadgeWinner]}>
                              <Text style={styles.miniBadgeText}>Hốt kỳ này ({formatMoney(hv.trang_thai_hot.tien_nhan_thuc_te)})</Text>
                            </View>
                          )}
                          {!daHotHui && (
                            <View style={[styles.miniBadge, styles.miniBadgeLive]}>
                              <Text style={styles.miniBadgeText}>Hụi sống</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.hvCardRight}>
                      <Text style={styles.hvAmountText}>
                        {formatMoney(soTienPhaiDong)}
                      </Text>
                      
                      <View style={styles.actionRow}>
                        {/* Nút Nhắc nhở Zalo - Chỉ hiển thị cho người chưa đóng kỳ này và không phải là người đang hốt kỳ này */}
                        {!daDongKyNay && !hotKyNay && (
                          <TouchableOpacity 
                            style={styles.zaloActionBtn}
                            onPress={() => handleZaloReminder(hv)}
                          >
                            <MessageSquare color="#10B981" size={16} />
                          </TouchableOpacity>
                        )}
                        
                        {/* Nút đánh dấu đã đóng tiền */}
                        {!hotKyNay && (
                          <TouchableOpacity 
                            style={[
                              styles.paymentActionBtn,
                              daDongKyNay ? styles.paymentBtnDone : styles.paymentBtnTodo
                            ]}
                            onPress={() => togglePaymentStatus(hv.id)}
                          >
                            {daDongKyNay ? (
                              <CheckCircle2 color="#fff" size={16} />
                            ) : (
                              <AlertCircle color="#9CA3AF" size={16} />
                            )}
                            <Text style={[
                              styles.paymentBtnText,
                              daDongKyNay ? { color: '#fff' } : { color: '#9CA3AF' }
                            ]}>
                              {daDongKyNay ? 'Đã đóng' : 'Chờ đóng'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* MÀN HÌNH TRANG CHỦ */
          <ScrollView contentContainerStyle={styles.homeContent}>
            
            {/* Header Trang Chủ */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerSubtitle}>PHẦN MỀM CHỦ THẢO</Text>
                <Text style={styles.headerTitle}>Quản Lý Hụi</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setIsAddHuiModalOpen(true)}
              >
                <Plus color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {/* Khối Báo cáo Tổng quan Tài chính */}
            <View style={styles.dashboardCard}>
              <View style={styles.dbHeader}>
                <View style={styles.dbIconWrapper}>
                  <TrendingUp color="#10B981" size={24} />
                </View>
                <Text style={styles.dbTitle}>Doanh Thu Chủ Thảo</Text>
              </View>
              <Text style={styles.dbProfitValue}>
                {formatMoney(calculateTotalCommissionCollected())}
              </Text>
              <Text style={styles.dbSubtext}>
                Tổng tiền thảo (hoa hồng) đã thu từ các kỳ khui hụi
              </Text>
              
              <View style={styles.dbStatsDivider} />
              
              <View style={styles.dbStatsRow}>
                <View style={styles.dbStatCol}>
                  <Text style={styles.dbStatNum}>{huiData.length}</Text>
                  <Text style={styles.dbStatLabel}>Tổng dây hụi</Text>
                </View>
                <View style={styles.dbStatCol}>
                  <Text style={styles.dbStatNum}>
                    {huiData.filter(h => h.trang_thai === 'active').length}
                  </Text>
                  <Text style={styles.dbStatLabel}>Dây đang chạy</Text>
                </View>
              </View>
            </View>

            {/* Bộ điều khiển Tab Bar */}
            <View style={styles.tabContainer}>
              {[
                { key: 'daily', label: 'Hụi Ngày' },
                { key: 'weekly', label: 'Hụi Tuần' },
                { key: 'monthly', label: 'Hụi Tháng' }
              ].map((tab) => {
                const count = huiData.filter(item => item.loai_hui === tab.key).length;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tabButton,
                      activeTab === tab.key ? styles.tabButtonActive : null
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[
                      styles.tabButtonText,
                      activeTab === tab.key ? styles.tabTextActive : null
                    ]}>
                      {tab.label}
                    </Text>
                    <View style={[
                      styles.tabBadge,
                      activeTab === tab.key ? styles.tabBadgeActive : null
                    ]}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Danh sách Dây Hụi */}
            <View style={styles.listContainer}>
              {filteredHuiList.length > 0 ? (
                filteredHuiList.map((item) => {
                  const stats = calculateDayHuiStats(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dayHuiCard}
                      onPress={() => setSelectedHuiId(item.id)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardName}>{item.ten_day}</Text>
                          <View style={styles.cardSubDetails}>
                            <Calendar color="#9CA3AF" size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.cardDate}>{item.ngay_bat_dau}</Text>
                          </View>
                        </View>
                        <ChevronRight color="#6366F1" size={20} />
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardMetricsRow}>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Số tiền kỳ</Text>
                          <Text style={styles.metricValue}>{formatMoney(item.so_tien_ky)}</Text>
                        </View>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricLabel}>Kỳ hiện tại</Text>
                          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                            Kỳ {item.ky_hien_tai}/{item.tong_so_phan}
                          </Text>
                        </View>
                      </View>

                      {/* Thanh tiến trình */}
                      <View style={styles.cardProgressBarContainer}>
                        <View style={styles.cardProgressBarBg}>
                          <View style={[
                            styles.cardProgressBarFill,
                            { width: `${(item.ky_hien_tai / item.tong_so_phan) * 100}%` }
                          ]} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Shield color="#374151" size={48} />
                  <Text style={styles.emptyText}>Chưa có dây hụi nào trong mục này</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* MODAL KHAI KỲ MỚI (KHUI HỤI) */}
        <Modal
          visible={isKhuiHuiModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsKhuiHuiModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Khai Kỳ Hụi Thứ {activeHui?.ky_hien_tai}</Text>
                <TouchableOpacity onPress={() => setIsKhuiHuiModalOpen(false)}>
                  <X color="#9CA3AF" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <Text style={styles.formLabel}>Chọn người hốt hụi kỳ này:</Text>
                <View style={styles.pickerContainer}>
                  {activeHui?.hui_vien
                    .filter(hv => !hv.trang_thai_hot.da_hot) // Chỉ chọn những người chưa hốt
                    .map(hv => (
                      <TouchableOpacity
                        key={hv.id}
                        style={[
                          styles.pickerItem,
                          selectedWinnerId === hv.id ? styles.pickerItemActive : null
                        ]}
                        onPress={() => setSelectedWinnerId(hv.id)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedWinnerId === hv.id ? styles.pickerItemTextActive : null
                        ]}>
                          {hv.ten} ({hv.so_phan_mua} phần)
                        </Text>
                        {selectedWinnerId === hv.id && (
                          <Check color="#10B981" size={18} />
                        )}
                      </TouchableOpacity>
                    ))}
                  {activeHui?.hui_vien.filter(hv => !hv.trang_thai_hot.da_hot).length === 0 && (
                    <Text style={styles.errorText}>Tất cả hụi viên đều đã hốt hụi!</Text>
                  )}
                </View>

                <Text style={[styles.formLabel, { marginTop: 16 }]}>Giá thầu khui hụi (VND):</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 150000"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  value={biddingAmount}
                  onChangeText={setBiddingAmount}
                />

                {/* Khối tính toán xem trước thực tế nhận */}
                {selectedWinnerId && biddingAmount && !isNaN(biddingAmount) && (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewTitle}>Dự toán người hốt sẽ nhận:</Text>
                    <Text style={styles.previewValue}>
                      {formatMoney(calculateTienNhanThucTe(activeHui, activeHui.ky_hien_tai, parseInt(biddingAmount)))}
                    </Text>
                    <Text style={styles.previewSubtext}>
                      (Đã trừ đi tiền thảo của chủ hụi: {formatMoney(activeHui.tien_thao_moi_ky)})
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { marginTop: 24 }]}
                  onPress={handleKhuiHuiSubmit}
                >
                  <Text style={styles.formSubmitBtnText}>Xác nhận Khui Hụi</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL THÊM DÂY HỤI MỚI */}
        <Modal
          visible={isAddHuiModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsAddHuiModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo Dây Hụi Mới</Text>
                <TouchableOpacity onPress={() => setIsAddHuiModalOpen(false)}>
                  <X color="#9CA3AF" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <Text style={styles.formLabel}>Tên dây hụi:</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: Dây hụi 500k Bà Tám"
                  placeholderTextColor="#4B5563"
                  value={newHuiName}
                  onChangeText={setNewHuiName}
                />

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Số tiền đóng mỗi phần/kỳ (VND):</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 500000"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  value={newHuiAmount}
                  onChangeText={setNewHuiAmount}
                />

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Chu kỳ dây hụi:</Text>
                <View style={styles.typeSelectorRow}>
                  {[
                    { key: 'daily', label: 'Ngày' },
                    { key: 'weekly', label: 'Tuần' },
                    { key: 'monthly', label: 'Tháng' }
                  ].map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeSelectorBtn,
                        newHuiType === type.key ? styles.typeSelectorBtnActive : null
                      ]}
                      onPress={() => setNewHuiType(type.key)}
                    >
                      <Text style={[
                        styles.typeSelectorText,
                        newHuiType === type.key ? styles.typeSelectorTextActive : null
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Tổng số phần hụi (người chơi):</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 10"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  value={newHuiTotalShares}
                  onChangeText={setNewHuiTotalShares}
                />

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Tiền thảo chủ hụi mỗi kỳ (VND):</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: 100000"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  value={newHuiCommission}
                  onChangeText={setNewHuiCommission}
                />

                <TouchableOpacity 
                  style={[styles.formSubmitBtn, { marginTop: 24, backgroundColor: '#6366F1' }]}
                  onPress={handleCreateHui}
                >
                  <Text style={styles.formSubmitBtnText}>Tạo Dây Hụi</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Bảng Style CSS-in-JS thiết kế Premium Dark Obsidian cực kỳ đẹp mắt
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  
  // Header Style
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerSubtitle: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Dashboard Style
  dashboardCard: {
    backgroundColor: '#151E33',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#233256',
  },
  dbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dbIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dbTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  dbProfitValue: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dbSubtext: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  dbStatsDivider: {
    height: 1,
    backgroundColor: '#233256',
    marginVertical: 15,
  },
  dbStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dbStatCol: {
    flex: 1,
  },
  dbStatNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dbStatLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },

  // Tab Control Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#151E33',
    borderRadius: 16,
    padding: 5,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#233256',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#1E293B',
  },
  tabButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabBadgeActive: {
    backgroundColor: '#6366F1',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Content List Style
  homeContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  dayHuiCard: {
    backgroundColor: '#151E33',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#233256',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#233256',
    marginVertical: 12,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardProgressBarContainer: {
    marginTop: 12,
  },
  cardProgressBarBg: {
    height: 6,
    backgroundColor: '#233256',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },

  // SCREEN CHI TIẾT STYLE
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151E33',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#233256',
  },
  backButton: {
    padding: 4,
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholderButton: {
    width: 32,
  },
  detailContent: {
    padding: 20,
    paddingBottom: 60,
  },
  gorgeousInfoCard: {
    backgroundColor: '#151E33',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#233256',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  infoValueSub: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#233256',
    marginVertical: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  badgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  progressPercent: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#233256',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  khuiHuiButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  khuiHuiButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // HỘI VIÊN CARD STYLE
  hvCard: {
    backgroundColor: '#151E33',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#233256',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hvCardHotted: {
    borderColor: '#1E293B',
    opacity: 0.85,
  },
  hvCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarContainerActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  avatarContainerHotted: {
    backgroundColor: '#1F2937',
  },
  hvInfo: {
    flex: 1,
  },
  hvName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hvNameHotted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  miniBadgeDead: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  miniBadgeWinner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  miniBadgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  miniBadgeText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
  },
  hvCardRight: {
    alignItems: 'flex-end',
  },
  hvAmountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zaloActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  paymentBtnTodo: {
    backgroundColor: 'rgba(75, 85, 99, 0.2)',
  },
  paymentBtnDone: {
    backgroundColor: '#10B981',
  },
  paymentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },

  // MODAL OVERLAYS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalForm: {
    marginTop: 15,
  },
  formLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: '#151E33',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#233256',
    padding: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  pickerItemText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  pickerItemTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
  previewBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 8,
  },
  previewTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  previewValue: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  previewSubtext: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
  },
  formSubmitBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // THÊM DÂY HỤI FORM STYLE
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeSelectorBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 10,
  },
  typeSelectorBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeSelectorText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  typeSelectorTextActive: {
    color: '#FFFFFF',
  }
});
