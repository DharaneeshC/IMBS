import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import api from '../api/api';
import {
  HiSearch,
  HiX,
  HiClock,
  HiCog,
  HiBell,
  HiFilter,
  HiLogout,
  HiUser,
  HiKey
} from 'react-icons/hi';
import {
  MdInventory
} from 'react-icons/md';
import ChangePasswordModal from './ChangePasswordModal';

const TopBar = ({ isSidebarCollapsed, onFilterClick, onNotificationClick, onSettingsClick }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], designers: [] });
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [metalRates, setMetalRates] = useState({
    gold24K: 14675,
    gold22K: 13452,
    silver: 723,
    trends: {
      gold: 'up',
      silver: 'up'
    },
    timestamp: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef(null);
  const activityRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${process.env.REACT_APP_BACKEND_PORT || 5000}`;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('TopBar WebSocket connected');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('TopBar WebSocket message:', message);

            if (message.type === 'ACTIVITY_UPDATE') {
              // Add new activity to the list
              setRecentActivities(prev => [message.data, ...prev.slice(0, 49)]);
            } else if (message.type === 'LOW_STOCK_ALERT') {
              // Handle low stock notifications
              const newNotification = {
                id: Date.now(),
                type: 'LOW_STOCK',
                title: 'Low Stock Alert',
                message: `${message.count} item(s) are running low in stock`,
                data: message.data,
                timestamp: new Date(),
                read: false
              };
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadNotifications(prev => prev + 1);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('TopBar WebSocket disconnected');
          setWsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('TopBar WebSocket error:', error);
          setWsConnected(false);
        };
      } catch (error) {
        console.error('Error connecting WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch recent activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.data?.data?.recentActivities) {
          setRecentActivities(response.data.data.recentActivities);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    fetchActivities();
    // Refresh activities every 30 seconds as fallback
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch gold and silver rates from backend API (manual rates, update every hour)
  useEffect(() => {
    const fetchMetalRates = async () => {
      try {
        // Call backend API for static rates
        const response = await api.get('/metal-rates');
        const data = response.data;

        if (data) {
          setMetalRates({
            gold24K: data.gold24K,
            gold22K: data.gold22K,
            silver: data.silver,
            trends: data.trends,
            timestamp: data.timestamp,
            source: data.source,
            lastUpdated: data.lastUpdated
          });

          // Log rate source
          console.log(`Metal rates loaded from: ${data.source || 'API'}`);
        }
      } catch (error) {
        console.error('Error fetching metal rates:', error);
        // Keep previous rates on error
      }
    };

    // Fetch immediately on mount
    fetchMetalRates();

    // Update every hour (static rates don't change frequently)
    const interval = setInterval(fetchMetalRates, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute for the "Updated today, 11:19 am" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (activityRef.current && !activityRef.current.contains(event.target)) {
        setShowActivityPanel(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Mark notification as read
  const markNotificationRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadNotifications(0);
  };

  // Search function with debounce
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults({ products: [], designers: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const [productsRes, designersRes] = await Promise.all([
        api.get('/products'),
        api.get('/designers')
      ]);

      const query = searchQuery.toLowerCase();

      const filteredProducts = productsRes.data.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        'jewells'.includes(query) ||
        'jewelry'.includes(query)
      ).slice(0, 5);

      const filteredDesigners = designersRes.data.filter(designer =>
        designer.name?.toLowerCase().includes(query) ||
        designer.email?.toLowerCase().includes(query) ||
        designer.phone?.toLowerCase().includes(query)
      ).slice(0, 5);

      setSearchResults({ products: filteredProducts, designers: filteredDesigners });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ products: [], designers: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(type === 'product' ? `/products/${id}` : `/designers/${id}`);
  };

  const totalResults = searchResults.products.length + searchResults.designers.length;

  // Format time as "today, 11:19 am" or "2026-03-17, 11:19 am"
  const formatUpdatedTime = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;

    return `today, ${displayHours}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm w-full">
      <div className="px-3 py-1">
        <div className="flex items-center justify-between gap-1.5">{/* Left: Search Bar */}
          <div className="flex items-center space-x-1 flex-1 max-w-xs" ref={searchRef}>
            {/* Search Bar with Filter */}
            <div className="flex items-center space-x-2 w-full relative">
              <div className="relative flex-1">
                <HiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search jewellery items, purity, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => {
                    if (searchQuery) setShowResults(true);
                    e.target.style.boxShadow = '0 0 0 2px #1F3A2E';
                  }}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                  className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                  style={{ '--tw-ring-color': '#1F3A2E', minWidth: '280px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <HiX className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1F3A2E] mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Searching...</p>
                      </div>
                    ) : totalResults === 0 ? (
                      <div className="p-4 text-center">
                        <HiSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        {/* Products Section */}
                        {searchResults.products.length > 0 && (
                          <div className="border-b border-gray-100 dark:border-gray-700">
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
                              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Products / Items</h3>
                            </div>
                            {searchResults.products.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => handleResultClick('product', product.id)}
                                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                              >
                                <div className="w-10 h-10 bg-[#1F3A2E] flex items-center justify-center flex-shrink-0">
                                  <MdInventory className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.category || 'Jewelry'} • ₹{product.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Designers Section */}
                        {searchResults.designers.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
                              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Designers / Customers</h3>
                            </div>
                            {searchResults.designers.map((designer) => (
                              <button
                                key={designer.id}
                                onClick={() => handleResultClick('designer', designer.id)}
                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center space-x-3"
                              >
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                                    {designer.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{designer.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{designer.email || designer.phone}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Filter Button */}
              <button
                onClick={onFilterClick}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                title="Filters"
              >
                <HiFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Center: Metal Rates */}
          <div className="flex-1 flex justify-center items-center px-1">
            <div className={`flex items-center ${isSidebarCollapsed ? 'gap-2' : 'gap-1.5'} transition-all duration-300`}>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap transition-all duration-300`}>Today's Metal Rates</span>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap transition-all duration-300`}>Gold 24K</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap transition-all duration-300`}>₹{metalRates.gold24K.toLocaleString()}/g</span>
              {metalRates.trends.gold && (
                <span className={`text-xs ${metalRates.trends.gold === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {metalRates.trends.gold === 'up' ? '↑' : '↓'}
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap transition-all duration-300`}>Gold 22K</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold text-amber-600 dark:text-amber-500 whitespace-nowrap transition-all duration-300`}>₹{metalRates.gold22K.toLocaleString()}/g</span>
              {metalRates.trends.gold && (
                <span className={`text-xs ${metalRates.trends.gold === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {metalRates.trends.gold === 'up' ? '↑' : '↓'}
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap transition-all duration-300`}>Silver</span>
              <span className={`${isSidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap transition-all duration-300`}>₹{metalRates.silver.toLocaleString()}/g</span>
              {metalRates.trends.silver && (
                <span className={`text-xs ${metalRates.trends.silver === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {metalRates.trends.silver === 'up' ? '↑' : '↓'}
                </span>
              )}
              {(metalRates.timestamp || metalRates.lastUpdated) && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Updated {formatUpdatedTime()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1">
            {/* Recent Activity Icon */}
            <div className="relative" ref={activityRef}>
              <button 
                onClick={() => {
                  setShowActivityPanel(!showActivityPanel);
                  setShowAllActivities(false);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg relative"
                title="Recent Activities"
              >
                <HiClock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Activity Panel Dropdown */}
              {showActivityPanel && (
                <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activities</h3>
                  </div>

                  {/* Content */}
                  <div className="max-h-[400px] overflow-y-auto p-4">
                    {recentActivities.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {(showAllActivities ? recentActivities : recentActivities.slice(0, 3)).map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {activity.action}. <span className="font-medium">By {activity.userName}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {(() => {
                                    const date = new Date(activity.timestamp);
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const year = date.getFullYear();
                                    let hours = date.getHours();
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                    hours = hours % 12 || 12;
                                    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {recentActivities.length > 3 && (
                          <div className="mt-4">
                            <button 
                              onClick={() => setShowAllActivities(!showAllActivities)}
                              style={{color: '#1F3A2E'}}
                            >
                              {showAllActivities ? 'Show Less' : `Show More (${recentActivities.length - 3} more)`}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <HiClock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Your activities in Inventory will show up here!
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Create your first transaction to get started.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Icon */}
            <button
              onClick={onSettingsClick}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg relative"
              title="Settings"
            >
              <HiCog className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Notifications Icon */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadNotifications > 0) {
                    markAllNotificationsRead();
                  }
                }}
                className="relative p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                title="Notifications"
              >
                <HiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {showNotifications && (() => {
                // Filter notifications based on settings
                const visibleNotifications = notifications.filter(notification => {
                  // If push notifications are off, show no notifications
                  if (!settings.pushNotifications) return false;

                  // If low stock alerts are off, filter out low stock notifications
                  if (!settings.lowStockAlerts && notification.type === 'LOW_STOCK') {
                    return false;
                  }

                  return true;
                });

                return (
                <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>

                  {/* Content */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'LOW_STOCK' && (
                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                                  <MdInventory className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <HiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          No notifications yet
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          You'll be notified of important updates here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="User Menu"
              >
                <HiUser className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-600 z-50 rounded-lg">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user?.fullName || 'System Administrator'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowChangePasswordModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <HiKey className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <HiLogout className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
    </div>
  );
};

export default TopBar;


