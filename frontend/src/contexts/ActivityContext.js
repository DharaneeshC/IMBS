import React, { createContext, useState, useContext, useEffect } from 'react';

const ActivityContext = createContext();

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('recentActivities');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('recentActivities', JSON.stringify(activities.slice(0, 50))); // Keep last 50
  }, [activities]);

  const addActivity = (type, title, details) => {
    setActivities(prev => {
      // Deduplicate: skip if last entry has same title+user within the same minute
      if (prev.length > 0) {
        const last = prev[0];
        const lastMinute = new Date(last.timestamp).toISOString().slice(0, 16);
        const nowMinute = new Date().toISOString().slice(0, 16);
        if (last.title === title && last.user === 'Dharaneesh C' && lastMinute === nowMinute) {
          return prev; // Skip duplicate
        }
      }
      const newActivity = {
        id: Date.now(),
        type,
        title,
        details,
        user: 'Dharaneesh C',
        timestamp: new Date().toISOString(),
        icon: type === 'create' ? 'add' : type === 'update' ? 'edit' : 'delete'
      };
      return [newActivity, ...prev];
    });
  };

  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem('recentActivities');
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
};
