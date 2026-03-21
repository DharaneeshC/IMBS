import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { HiExclamationCircle, HiCheckCircle, HiInformationCircle } from 'react-icons/hi';

const SystemAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/dashboard/alerts');
      setAlerts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <HiExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <HiInformationCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getAlertCardClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10';
    }
  };

  const filterAlerts = () => {
    if (!alerts) return [];
    
    const allAlerts = [
      ...alerts.lowStock,
      ...alerts.overdueRepairs,
      ...alerts.designerPayments
    ];

    switch (activeTab) {
      case 'stock':
        return alerts.lowStock;
      case 'repairs':
        return alerts.overdueRepairs;
      case 'payments':
        return alerts.designerPayments;
      case 'critical':
        return allAlerts.filter(a => a.severity === 'critical');
      default:
        return allAlerts;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const filteredAlerts = filterAlerts();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage system notifications and warnings
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {alerts?.summary?.total || 0}
                </p>
              </div>
              <HiInformationCircle className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {alerts?.summary?.critical || 0}
                </p>
              </div>
              <HiExclamationCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Warning</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {alerts?.summary?.warning || 0}
                </p>
              </div>
              <HiExclamationCircle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Info</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {alerts?.summary?.info || 0}
                </p>
              </div>
              <HiInformationCircle className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Alerts ({alerts?.summary?.total || 0})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === 'critical'
                  ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Critical ({alerts?.summary?.critical || 0})
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === 'stock'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Low Stock ({alerts?.lowStock?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('repairs')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === 'repairs'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Overdue Repairs ({alerts?.overdueRepairs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Pending Payments ({alerts?.designerPayments?.length || 0})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                All Clear!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No alerts in this category. Everything is running smoothly.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={`${alert.type}-${alert.id}-${index}`}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${getAlertCardClass(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeClass(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {alert.message}
                      </p>

                      {/* Additional Details based on Alert Type */}
                      {alert.type === 'low_stock' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p><span className="font-medium">SKU:</span> {alert.sku}</p>
                          <p><span className="font-medium">Current Stock:</span> {alert.currentStock}</p>
                          <p><span className="font-medium">Reorder Level:</span> {alert.reorderLevel}</p>
                        </div>
                      )}

                      {alert.type === 'overdue_repair' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p><span className="font-medium">Order:</span> {alert.orderNumber}</p>
                          <p><span className="font-medium">Customer:</span> {alert.customerName} - {alert.customerPhone}</p>
                          <p><span className="font-medium">Days Overdue:</span> {alert.daysOverdue}</p>
                          <p><span className="font-medium">Status:</span> {alert.status}</p>
                        </div>
                      )}

                      {alert.type === 'designer_payment' && (
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Designer:</span> {alert.designerName}</p>
                          <p><span className="font-medium">Vendor:</span> {alert.vendorName}</p>
                          <p><span className="font-medium">Amount Due:</span> ₹{alert.amountDue.toFixed(2)}</p>
                          <p><span className="font-medium">Days Outstanding:</span> {alert.daysOutstanding}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(alert.actionLink)}
                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors whitespace-nowrap"
                  >
                    {alert.action}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAlerts;
