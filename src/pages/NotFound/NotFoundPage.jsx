import React from 'react';
import { useNavigate } from 'react-router-dom';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import { Button } from 'antd';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 50% 40% at 80% 10%, rgba(255,200,170,.45) 0%, transparent 70%), radial-gradient(ellipse 45% 40% at 10% 90%, rgba(200,230,210,.45) 0%, transparent 70%), linear-gradient(180deg,#fffaf2 0%,#fbf1e3 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, color: '#e0a454', filter: 'drop-shadow(0 6px 18px rgba(224,164,84,.35))' }}><DharmaWheel strokeWidth={5} /></div>
      <div style={{ color: '#c47f36', fontSize: 'clamp(48px,8vw,96px)', fontWeight: 900, lineHeight: 1 }}>
        404
      </div>
      <div style={{ color: '#5a3a22', fontSize: 16, letterSpacing: 2 }}>
        Trang không tồn tại
      </div>
      <div style={{ color: '#8c7a6b', fontSize: 13 }}>
        Đường dẫn bạn tìm kiếm không được tìm thấy.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          onClick={() => navigate(-1)}
          style={{ borderRadius: 10 }}
        >
          ← Quay lại
        </Button>
        <Button
          type="primary"
          onClick={() => navigate('/')}
          style={{ borderRadius: 10 }}
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
