-- ====================================================================
--  SUPABASE DATABASE SCHEMA - PHẦN MỀM QUẢN LÝ HỤI CHỦ THẢO MULTI-TENANT
-- ====================================================================
-- Hướng dẫn: Copy toàn bộ đoạn script SQL này và dán vào tab "SQL Editor"
-- trên bảng điều khiển Supabase của bạn và nhấn RUN để khởi tạo.

-- 1. BẢNG HỒ SƠ PROFILE CHỦ HỤI (Liên kết với Auth.Users của Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật tính năng Row-Level Security (RLS) cho profiles
alter table public.profiles enable row level security;

-- 2. BẢNG DÂY HỤI
create table public.day_hui (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ten_day text not null,
  loai_hui text not null check (loai_hui in ('daily', 'weekly', 'monthly')),
  so_tien_ky numeric not null default 0,
  tong_so_phan integer not null default 10,
  ky_hien_tai integer not null default 1,
  tien_thao_moi_ky numeric not null default 0,
  ngay_bat_dau date not null default current_date,
  trang_thai text not null default 'active' check (trang_thai in ('active', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật tính năng Row-Level Security (RLS) cho day_hui
alter table public.day_hui enable row level security;

-- 3. BẢNG HỘI VIÊN (Liên kết với Dây hụi)
create table public.hui_vien (
  id uuid default gen_random_uuid() primary key,
  day_hui_id uuid references public.day_hui(id) on delete cascade not null,
  ten text not null,
  sdt text,
  so_phan_mua integer not null default 1,
  
  -- Thông tin liên quan đến khui thầu hốt hụi
  da_hot boolean not null default false,
  ky_hot integer,
  gia_hot numeric,
  tien_nhan_thuc_te numeric,
  ngay_hot timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật tính năng Row-Level Security (RLS) cho hui_vien
alter table public.hui_vien enable row level security;

-- 4. BẢNG LỊCH SỬ ĐÓNG TIỀN (Theo dõi từng kỳ đóng của mỗi thành viên)
create table public.lich_su_dong (
  id uuid default gen_random_uuid() primary key,
  hui_vien_id uuid references public.hui_vien(id) on delete cascade not null,
  ky integer not null,
  da_dong boolean not null default false,
  so_tien_da_dong numeric not null default 0,
  ngay_dong timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ràng buộc duy nhất: Một hội viên tại một kỳ chỉ có duy nhất 1 trạng thái đóng tiền
  constraint unique_hui_vien_ky unique (hui_vien_id, ky)
);

-- Bật tính năng Row-Level Security (RLS) cho lich_su_dong
alter table public.lich_su_dong enable row level security;

-- ====================================================================
--   CƠ CHẾ TRIGGER: TỰ ĐỘNG TẠO PROFILES KHI ĐĂNG KÝ TÀI KHOẢN MỚI
-- ====================================================================
-- Khi có tài khoản mới đăng ký qua Supabase Auth, trigger này sẽ tự động
-- chèn 1 bản ghi tương ứng vào bảng profiles.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
--   CÁC CHÍNH SÁCH BẢO MẬT PHÂN QUYỀN (ROW-LEVEL SECURITY POLICIES)
-- ====================================================================
-- Bảo đảm chủ hụi nào chỉ có thể xem, chỉnh sửa, thêm, xóa dữ liệu của mình.

-- A. CHÍNH SÁCH BẢNG PROFILES
create policy "Chủ hụi được quyền xem profile cá nhân"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Chủ hụi được quyền cập nhật profile cá nhân"
  on public.profiles for update
  using (auth.uid() = id);

-- B. CHÍNH SÁCH BẢNG DAY_HUI
create policy "Chủ hụi được quyền xem dây hụi của mình"
  on public.day_hui for select
  using (auth.uid() = user_id);

create policy "Chủ hụi được quyền thêm dây hụi mới"
  on public.day_hui for insert
  with check (auth.uid() = user_id);

create policy "Chủ hụi được quyền cập nhật dây hụi của mình"
  on public.day_hui for update
  using (auth.uid() = user_id);

create policy "Chủ hụi được quyền xoá dây hụi của mình"
  on public.day_hui for delete
  using (auth.uid() = user_id);

-- C. CHÍNH SÁCH BẢNG HUI_VIEN
-- (Hội viên phải thuộc về dây hụi của chính chủ hụi đang đăng nhập)
create policy "Chủ hụi xem hội viên trong dây của mình"
  on public.hui_vien for select
  using (
    exists (
      select 1 from public.day_hui
      where public.day_hui.id = public.hui_vien.day_hui_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi thêm hội viên vào dây của mình"
  on public.hui_vien for insert
  with check (
    exists (
      select 1 from public.day_hui
      where public.day_hui.id = public.hui_vien.day_hui_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi cập nhật hội viên trong dây của mình"
  on public.hui_vien for update
  using (
    exists (
      select 1 from public.day_hui
      where public.day_hui.id = public.hui_vien.day_hui_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi xoá hội viên khỏi dây của mình"
  on public.hui_vien for delete
  using (
    exists (
      select 1 from public.day_hui
      where public.day_hui.id = public.hui_vien.day_hui_id
      and public.day_hui.user_id = auth.uid()
    )
  );

-- D. CHÍNH SÁCH BẢNG LICH_SU_DONG
-- (Lịch sử đóng phải thuộc về hội viên nằm trong dây hụi của chính chủ hụi)
create policy "Chủ hụi xem lịch sử đóng tiền"
  on public.lich_su_dong for select
  using (
    exists (
      select 1 from public.hui_vien
      join public.day_hui on public.day_hui.id = public.hui_vien.day_hui_id
      where public.hui_vien.id = public.lich_su_dong.hui_vien_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi thêm lịch sử đóng tiền"
  on public.lich_su_dong for insert
  with check (
    exists (
      select 1 from public.hui_vien
      join public.day_hui on public.day_hui.id = public.hui_vien.day_hui_id
      where public.hui_vien.id = public.lich_su_dong.hui_vien_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi cập nhật lịch sử đóng tiền"
  on public.lich_su_dong for update
  using (
    exists (
      select 1 from public.hui_vien
      join public.day_hui on public.day_hui.id = public.hui_vien.day_hui_id
      where public.hui_vien.id = public.lich_su_dong.hui_vien_id
      and public.day_hui.user_id = auth.uid()
    )
  );

create policy "Chủ hụi xoá lịch sử đóng tiền"
  on public.lich_su_dong for delete
  using (
    exists (
      select 1 from public.hui_vien
      join public.day_hui on public.day_hui.id = public.hui_vien.day_hui_id
      where public.hui_vien.id = public.lich_su_dong.hui_vien_id
      and public.day_hui.user_id = auth.uid()
    )
  );
