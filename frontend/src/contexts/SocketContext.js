import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      // Deduplicate: skip if same title+productId was shown within last 60 minutes
      const ONE_HOUR = 60 * 60 * 1000;
      const isDuplicate = prev.some(n =>
        n.title === notification.title &&
        n.productId === notification.productId &&
        (notification.timestamp - n.timestamp) < ONE_HOUR
      );
      if (isDuplicate) return prev;
      const updated = [notification, ...prev].slice(0, 10);
      // Auto-remove after 10 seconds
      setTimeout(() => { removeNotification(notification.id); }, 10000);
      return updated;
    });
  }, [removeNotification]);

  useEffect(() => {
    // Connect to Socket.IO server
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });

    // Listen for low stock alerts
    socketInstance.on('stock:low', (data) => {
      console.log('Low stock alert received:', data);
      addNotification({
        id: Date.now(),
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${data.productName} is running low. Only ${data.quantity} ${data.quantity === 1 ? 'piece' : 'pieces'} remaining.`,
        productId: data.productId,
        timestamp: new Date(),
      });
    });

    // Listen for out of stock alerts (critical)
    socketInstance.on('stock:out', (data) => {
      console.log('Out of stock alert received:', data);
      addNotification({
        id: Date.now(),
        type: 'error',
        title: 'Out of Stock',
        message: `${data.productName} is completely out of stock. Reorder immediately.`,
        productId: data.productId,
        timestamp: new Date(),
      });
    });

    // Listen for critical stock alerts (< 3 days)
    socketInstance.on('stock:critical', (data) => {
      console.log('Critical stock alert received:', data);
      addNotification({
        id: Date.now(),
        type: 'critical',
        title: 'Critical Stock Level',
        message: `${data.productName} will run out in ${data.daysLeft} ${data.daysLeft === 1 ? 'day' : 'days'}. Current stock: ${data.quantity}.`,
        productId: data.productId,
        timestamp: new Date(),
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [addNotification]);

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const emitStockUpdate = (data) => {
    if (socket && connected) {
      socket.emit('stock:update', data);
    }
  };

  const value = {
    socket,
    connected,
    notifications,
    removeNotification,
    clearAllNotifications,
    emitStockUpdate,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
