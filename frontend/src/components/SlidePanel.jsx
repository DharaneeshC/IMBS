import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useFilter } from '../contexts/FilterContext';
import { HiX, HiChevronRight } from 'react-icons/hi';
import api from '../api/api';

const SlidePanel = ({ isOpen, onClose, type, title }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-4rem)] p-6">
          {type === 'filter' && <FilterContent onClose={onClose} />}
          {type === 'notification' && <NotificationContent />}
          {type === 'mail' && <MailContent />}
          {type === 'settings' && <SettingsContent />}
        </div>
      </div>
    </>
  );
};

// Filter Content Component
const FilterContent = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, updateFilter, updateStockStatus, applyFilters, resetFilters } = useFilter();
  
  const [categories, setCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingDesigners, setLoadingDesigners] = useState(false);

  // Fetch unique categories from products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/products/types/all');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories
        setCategories(['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Pendants']);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch designers (optionally filtered by category)
  useEffect(() => {
    const fetchDesigners = async () => {
      setLoadingDesigners(true);
      try {
        const response = await api.get('/designers');
        setDesigners(response.data || []);
      } catch (error) {
        console.error('Error fetching designers:', error);
        setDesigners([]);
      } finally {
        setLoadingDesigners(false);
      }
    };
    fetchDesigners();
  }, [filters.category]);

  const handleApply = () => {
    applyFilters();
    // If not on products page, navigate there to show results
    if (!location.pathname.startsWith('/products')) {
      navigate('/products');
    }
    // Close panel after navigating
    setTimeout(() => onClose(), 100);
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
        <select 
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          disabled={loadingCategories}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock Status</label>
        <div className="space-y-2">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'inStock', label: 'In Stock' },
            { key: 'lowStock', label: 'Low Stock' },
            { key: 'outOfStock', label: 'Out of Stock' }
          ].map((status) => (
            <label key={status.key} className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.stockStatus[status.key]}
                onChange={() => updateStockStatus(status.key)}
                className="rounded border-gray-300 dark:border-gray-600 text-[#1F3A2E] focus:ring-[#1F3A2E]" 
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Designer</label>
        <select
          value={filters.designer}
          onChange={(e) => updateFilter('designer', e.target.value)}
          disabled={loadingDesigners}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          <option value="">All Designers</option>
          {designers.map((designer) => (
            <option key={designer.id} value={designer.name}>{designer.name}</option>
          ))}
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <button 
          onClick={handleReset}
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-[#1a1d2e] dark:bg-[#1F3A2E] text-white rounded-lg hover:bg-gray-900 dark:hover:bg-[#0a7a6f] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// Notification Content Component
const NotificationContent = () => {
  const notifications = [
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #ORD2040 has been placed successfully',
      time: '2 minutes ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Diamond Ring #DR123 is running low on stock',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Product Added',
      message: 'New product "Gold Bracelet" added to inventory',
      time: '3 hours ago',
      type: 'info'
    },
    {
      id: 4,
      title: 'Payment Failed',
      message: 'Order #ORD2039 payment processing failed',
      time: '5 hours ago',
      type: 'danger'
    },
  ];

  const getBgColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'danger': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className={`p-4 rounded-lg border ${getBgColor(notification.type)}`}>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notification.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{notification.time}</p>
        </div>
      ))}
    </div>
  );
};

// Mail Content Component
const MailContent = () => {
  const mails = [
    {
      id: 1,
      from: 'Sarah Johnson',
      subject: 'Order Inquiry - Diamond Ring',
      preview: 'Hi, I would like to inquire about the diamond ring listed on your website...',
      time: '10:30 AM',
      unread: true
    },
    {
      id: 2,
      from: 'Michael Chen',
      subject: 'Bulk Order Request',
      preview: 'We are interested in placing a bulk order for wedding rings. Could you please...',
      time: '9:15 AM',
      unread: true
    },
    {
      id: 3,
      from: 'Emily Roberts',
      subject: 'Product Catalog Request',
      preview: 'Can you send me the latest product catalog with pricing information?',
      time: 'Yesterday',
      unread: false
    },
    {
      id: 4,
      from: 'David Wilson',
      subject: 'Thank you for the service',
      preview: 'The necklace arrived safely and my wife loves it! Thank you for the excellent...',
      time: '2 days ago',
      unread: false
    },
  ];

  return (
    <div className="space-y-2">
      {mails.map((mail) => (
        <div
          key={mail.id}
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            mail.unread
              ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20'
              : 'bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className={`text-sm ${mail.unread ? 'font-bold' : 'font-medium'} ${mail.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} truncate`}>
              {mail.from}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{mail.time}</span>
          </div>
          <p className={`text-sm ${mail.unread ? 'font-semibold' : 'font-normal'} ${mail.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} mb-1 truncate`}>
            {mail.subject}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{mail.preview}</p>
        </div>
      ))}
    </div>
  );
};

// Settings Content Component
const SettingsContent = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { settings, toggleSetting } = useSettings();
  
  return (
    <div className="space-y-6">
      {/* Appearance */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F3A2E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F3A2E]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Compact View</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.compactView}
                onChange={() => toggleSetting('compactView')}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F3A2E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F3A2E]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Receive push alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.pushNotifications}
                onChange={() => toggleSetting('pushNotifications')}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F3A2E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F3A2E]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Low Stock Alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Get notified on low inventory</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.lowStockAlerts}
                onChange={() => toggleSetting('lowStockAlerts')}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F3A2E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F3A2E]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">System</h3>
        <div className="space-y-2">
          <button className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Language</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-500">{settings.language}</span>
                <HiChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          <button className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Time Zone</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-500">{settings.timeZone}</span>
                <HiChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>

          <button className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Currency</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-500">{settings.currency}</span>
                <HiChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>
      </div>


    </div>
  );
};

export default SlidePanel;


