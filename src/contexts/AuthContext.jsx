import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { notification } from 'antd';
import api from '../api/axios';

const AuthContext = createContext(null);

const IDLE_TIMEOUT   = 15 * 60 * 1000; // 15 minutes
const WARN_BEFORE    =  1 * 60 * 1000; // warn 1 minute before
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const logoutTimerRef = useRef(null);
  const warnTimerRef   = useRef(null);
  const warnShownRef   = useRef(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback((reason) => {
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);
    notification.destroy('idle-warn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (reason === 'idle') {
      // Store message to show on login page
      sessionStorage.setItem('logoutReason', 'idle');
    }
    window.location.href = '/';
  }, []);

  const resetTimers = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);

    // Dismiss warning if user became active again
    if (warnShownRef.current) {
      notification.destroy('idle-warn');
      warnShownRef.current = false;
    }

    // Warn at 14 minutes
    warnTimerRef.current = setTimeout(() => {
      warnShownRef.current = true;
      notification.warning({
        key: 'idle-warn',
        message: 'Sắp hết phiên làm việc',
        description: 'Bạn không hoạt động trong 14 phút. Hệ thống sẽ tự đăng xuất sau 1 phút nữa.',
        duration: 0,
        placement: 'topRight',
      });
    }, IDLE_TIMEOUT - WARN_BEFORE);

    // Auto-logout at 15 minutes
    logoutTimerRef.current = setTimeout(() => {
      logout('idle');
    }, IDLE_TIMEOUT);
  }, [logout]);

  // Start/stop timers based on login state
  useEffect(() => {
    if (!user) {
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warnTimerRef.current);
      return;
    }

    resetTimers();

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimers, { passive: true }));
    return () => {
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warnTimerRef.current);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimers));
    };
  }, [user, resetTimers]);

  const hasRole = (...roles) => roles.includes(user?.role);
  const isAdmin = () => user?.role === 'admin';
  const canManage = () => ['admin', 'truotri', 'thuki'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
};
