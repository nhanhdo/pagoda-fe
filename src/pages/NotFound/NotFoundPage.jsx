import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#1a0800 0%,#3d1a06 50%,#6b2e10 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, opacity: .55, filter: 'drop-shadow(0 0 18px rgba(255,180,50,.4))' }}>☸</div>
      <div style={{ color: '#ffd59e', fontSize: 'clamp(48px,8vw,96px)', fontWeight: 900, lineHeight: 1, opacity: .7 }}>
        404
      </div>
      <div style={{ color: 'rgba(255,210,130,.65)', fontSize: 16, letterSpacing: 2 }}>
        Trang không tồn tại
      </div>
      <div style={{ color: 'rgba(255,180,80,.4)', fontSize: 13 }}>
        Đường dẫn bạn tìm kiếm không được tìm thấy.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,180,50,.1)', border: '1px solid rgba(255,180,50,.3)', color: '#ffc44d', borderRadius: 10 }}
        >
          ← Quay lại
        </Button>
        <Button
          type="primary"
          onClick={() => navigate('/')}
          style={{ background: '#8B4513', border: 'none', borderRadius: 10, boxShadow: '0 4px 16px rgba(139,69,19,.4)' }}
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
