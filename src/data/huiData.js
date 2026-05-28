// Cấu trúc dữ liệu giả lập chuẩn chỉnh cho phần mềm quản lý Hụi (dành cho Chủ Thảo)
export const initialHuiData = [
  {
    id: "day_hui_001",
    ten_day: "Dây Hụi 1 Triệu - Thứ Sáu Vui Vẻ",
    so_tien_ky: 1000000,
    loai_hui: "weekly", // 'daily' | 'weekly' | 'monthly'
    ngay_bat_dau: "2026-05-01",
    tong_so_phan: 10,
    ky_hien_tai: 3,
    trang_thai: "active", // 'active' | 'completed'
    tien_thao_moi_ky: 200000, // Hoa hồng chủ thảo thu từ mỗi kỳ
    hui_vien: [
      {
        id: "hv_01",
        ten: "Chị Hoa Mai",
        sdt: "0909123456",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: true,
          ky_hot: 1,
          gia_hot: 100000,
          ngay_hot: "2026-05-01",
          tien_nhan_thuc_te: 7800000 // Tự động tính toán khi hốt
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 1000000, ngay_dong: "2026-05-01" },
          { ky: 2, da_dong: true, so_tien_da_dong: 1000000, ngay_dong: "2026-05-08" },
          { ky: 3, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      },
      {
        id: "hv_02",
        ten: "Anh Tuấn Anh",
        sdt: "0988777666",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 900000, ngay_dong: "2026-05-02" }, // Hụi sống kỳ 1 (chưa hốt, thầu 100k nên đóng 900k)
          { ky: 2, da_dong: true, so_tien_da_dong: 850000, ngay_dong: "2026-05-09" }, // Hụi sống kỳ 2 (chưa hốt, thầu 150k nên đóng 850k)
          { ky: 3, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      },
      {
        id: "hv_03",
        ten: "Cô Ba Bến Tre",
        sdt: "0912345678",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: true,
          ky_hot: 2,
          gia_hot: 150000,
          ngay_hot: "2026-05-08",
          tien_nhan_thuc_te: 7650000
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 900000, ngay_dong: "2026-05-01" },
          { ky: 2, da_dong: true, so_tien_da_dong: 1000000, ngay_dong: "2026-05-08" }, // Hụi chết từ kỳ 2
          { ky: 3, da_dong: true, so_tien_da_dong: 1000000, ngay_dong: "2026-05-15" }
        ]
      },
      {
        id: "hv_04",
        ten: "Dì Út Chợ Lách",
        sdt: "0934567890",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 900000, ngay_dong: "2026-05-01" },
          { ky: 2, da_dong: true, so_tien_da_dong: 850000, ngay_dong: "2026-05-08" },
          { ky: 3, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      },
      {
        id: "hv_05",
        ten: "Mợ Tư Cần Thơ",
        sdt: "0977888999",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 900000, ngay_dong: "2026-05-01" },
          { ky: 2, da_dong: true, so_tien_da_dong: 850000, ngay_dong: "2026-05-08" },
          { ky: 3, da_dong: true, so_tien_da_dong: 850000, ngay_dong: "2026-05-15" }
        ]
      }
    ]
  },
  {
    id: "day_hui_002",
    ten_day: "Hụi Ngày 200k Chợ Bình Tây",
    so_tien_ky: 200000,
    loai_hui: "daily",
    ngay_bat_dau: "2026-05-20",
    tong_so_phan: 15,
    ky_hien_tai: 5,
    trang_thai: "active",
    tien_thao_moi_ky: 40000,
    hui_vien: [
      {
        id: "hv_11",
        ten: "Chị Lan Bún Nước",
        sdt: "0901112223",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: true,
          ky_hot: 1,
          gia_hot: 20000,
          ngay_hot: "2026-05-20",
          tien_nhan_thuc_te: 2760000
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 200000, ngay_dong: "2026-05-20" },
          { ky: 2, da_dong: true, so_tien_da_dong: 200000, ngay_dong: "2026-05-21" },
          { ky: 3, da_dong: true, so_tien_da_dong: 200000, ngay_dong: "2026-05-22" },
          { ky: 4, da_dong: true, so_tien_da_dong: 200000, ngay_dong: "2026-05-23" },
          { ky: 5, da_dong: false, null, ngay_dong: null }
        ]
      },
      {
        id: "hv_12",
        ten: "Anh Hùng Xe Ôm",
        sdt: "0903334445",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 180000, ngay_dong: "2026-05-20" },
          { ky: 2, da_dong: true, so_tien_da_dong: 175000, ngay_dong: "2026-05-21" },
          { ky: 3, da_dong: true, so_tien_da_dong: 170000, ngay_dong: "2026-05-22" },
          { ky: 4, da_dong: false, so_tien_da_dong: 0, ngay_dong: null },
          { ky: 5, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      }
    ]
  },
  {
    id: "day_hui_003",
    ten_day: "Hụi Tháng 5 Triệu Đại Gia",
    so_tien_ky: 5000000,
    loai_hui: "monthly",
    ngay_bat_dau: "2026-01-10",
    tong_so_phan: 8,
    ky_hien_tai: 2,
    trang_thai: "active",
    tien_thao_moi_ky: 1000000,
    hui_vien: [
      {
        id: "hv_21",
        ten: "Bác Sĩ Hoàng",
        sdt: "0944555666",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: true,
          ky_hot: 1,
          gia_hot: 500000,
          ngay_hot: "2026-01-10",
          tien_nhan_thuc_te: 34000000
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 5000000, ngay_dong: "2026-01-10" },
          { ky: 2, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      },
      {
        id: "hv_22",
        ten: "Cô Nga Tiệm Vàng",
        sdt: "0907778889",
        so_phan_mua: 1,
        trang_thai_hot: {
          da_hot: false,
          ky_hot: null,
          gia_hot: 0,
          ngay_hot: null,
          tien_nhan_thuc_te: 0
        },
        lich_su_dong: [
          { ky: 1, da_dong: true, so_tien_da_dong: 4500000, ngay_dong: "2026-01-11" },
          { ky: 2, da_dong: false, so_tien_da_dong: 0, ngay_dong: null }
        ]
      }
    ]
  }
];
