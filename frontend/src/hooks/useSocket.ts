import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification } from '../types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, token, addNotification]);

  return socketRef.current;
}
