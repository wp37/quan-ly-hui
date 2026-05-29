import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });
        if (signUpError) throw signUpError;
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-logo">Quản Lý Hụi</h1>
        <p className="auth-subtitle">Phần mềm quản lý hụi chuyên nghiệp</p>
      </div>

      <div className="auth-card">
        <h2 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', marginBottom: '24px', color: '#fff' }}>
          {isSignUp ? 'ĐĂNG KÝ CHỦ HỤI' : 'ĐĂNG NHẬP CHỦ HỤI'}
        </h2>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Tên hiển thị (Chủ Thảo):</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="Ví dụ: Bà Tám Chợ Bình Tây"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email tài khoản:</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="chuthao@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu:</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Đăng Ký Tài Khoản
              </>
            ) : (
              <>
                <LogIn size={18} /> Đăng Nhập Hệ Thống
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản chủ hụi?'}
          <button className="auth-switch-btn" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
            {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
          </button>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '11px',
        color: '#736C62',
        lineHeight: '1.6'
      }}>
        <p style={{ fontWeight: '600', color: '#A8A29A' }}>Tạo bởi Võ Ngọc Tùng</p>
        <a
          href="https://zalo.me/0814666040"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: '600' }}
        >
          Zalo: 0814666040
        </a>
      </div>
    </div>
  );
}
