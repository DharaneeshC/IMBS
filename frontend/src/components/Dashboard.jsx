import React, { useState, useEffect } from 'react';
import api from '../api/api';

// Import all dashboard cards
import TodayPerformance from './Dashboard/TodayPerformance';
import SalesVsPurchases from './Dashboard/SalesVsPurchases';
import SalesTrend from './Dashboard/SalesTrend';
import ActionRequired from './Dashboard/ActionRequired';
import StockSummary from './Dashboard/StockSummary';
import RecentInvoices from './Dashboard/RecentInvoices';
import PendingTasks from './Dashboard/PendingTasks';
import LowStockAlerts from './Dashboard/LowStockAlerts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${process.env.REACT_APP_BACKEND_PORT || 5000}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected to dashboard');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        // Handle different types of real-time updates
        if (message.type === 'DASHBOARD_UPDATE' ||
            message.type === 'ACTIVITY_UPDATE' ||
            message.type === 'SALES_UPDATE' ||
            message.type === 'INVENTORY_UPDATE' ||
            message.type === 'PURCHASE_UPDATE') {
          // Refresh dashboard data when updates occur
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds as fallback
    const interval = setInterval(fetchDashboardData, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard');

      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data);
        console.log('Dashboard data loaded:', response.data.data);
      } else {
        // Fallback to old format if needed
        setDashboardData({
          todayPerformance: {
            invoices: response.data.todaySummary?.invoiceCount || 0,
            revenue: response.data.todaySummary?.totalRevenue || 0,
            avgOrder: response.data.todaySummary?.avgOrderValue || 0,
            itemsSold: response.data.todaySummary?.itemsSold || 0,
            profit: response.data.todaySummary?.totalProfit || 0,
            marginPercent: response.data.todaySummary?.marginPercent || 0
          },
          salesVsPurchases: {
            thisMonth: {
              sales: response.data.metrics?.totalSales || 0,
              purchases: response.data.metrics?.totalPurchases || 0,
              profit: (response.data.metrics?.totalSales || 0) - (response.data.metrics?.totalPurchases || 0)
            },
            lastMonth: {
              sales: response.data.metrics?.lastMonthSales || 0,
              purchases: response.data.metrics?.lastMonthPurchases || 0,
              profit: (response.data.metrics?.lastMonthSales || 0) - (response.data.metrics?.lastMonthPurchases || 0)
            }
          },
          weeklySales: response.data.weeklySales || [],
          deadStock: response.data.deadStock || [],
          stockSummary: {
            totalItems: response.data.metrics?.totalProducts || 0,
            totalStock: response.data.metrics?.totalStock || 0,
            lowStockCount: response.data.metrics?.lowStockCount || 0,
            outOfStockCount: response.data.metrics?.outOfStockCount || 0
          },
          recentReceipts: response.data.recentReceipts || [],
          pendingTasks: {
            purchasesToReceive: 0,
            purchasesInProgress: 0,
            salesToPack: 0,
            salesToShip: 0,
            salesToDeliver: 0,
            toBeInvoiced: 0
          },
          lowStockAlerts: response.data.lowStockProducts || []
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#111827',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{
            marginTop: '16px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: '10px 20px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '24px',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        /* Responsive Grid */
        @media (min-width: 1024px) {
          .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }

        @media (max-width: 1023px) {
          .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .dashboard-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>

      {/* Two Column Grid Layout */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-column">
          <TodayPerformance data={dashboardData?.todayPerformance} />
          <SalesVsPurchases data={dashboardData?.salesVsPurchases} />
          <SalesTrend data={dashboardData?.weeklySales} />
          <ActionRequired data={dashboardData?.actionRequired} />
          <LowStockAlerts data={dashboardData?.lowStockAlerts} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-column">
          <StockSummary data={dashboardData?.stockSummary} />
          <RecentInvoices data={dashboardData?.recentInvoices} />
          <PendingTasks data={dashboardData?.pendingTasks} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
