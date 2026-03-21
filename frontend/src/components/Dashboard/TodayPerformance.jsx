import React from 'react';
import { useNavigate } from 'react-router-dom';

const TodayPerformance = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const formatNumber = (value) => {
    return parseFloat(value || 0).toLocaleString('en-IN');
  };

  const formatPercent = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const isRecentData = data?.isRecentData;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {isRecentData ? 'Recent Performance' : "Business Overview"}
        </div>
      </div>

      {/* Show message if no sales data */}
      {(!data || (data.invoices === 0 && data.revenue === 0)) ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: '4px'
          }}>
            No sales data available
          </div>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            Create your first invoice to see performance metrics
          </div>
          <button
            onClick={() => navigate('/sales/invoices')}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#1f3a2e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Invoice
          </button>
        </div>
      ) : (
        <>
          {/* 2x3 Grid of Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Row 1 */}
            <div
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Invoices
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {data?.invoices || 0}
              </div>
            </div>

            <div
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Revenue
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatCurrency(data?.revenue)}
              </div>
            </div>

            <div
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Avg Order
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatCurrency(data?.avgOrder)}
              </div>
            </div>

            {/* Row 2 */}
            <div
              onClick={() => navigate('/products')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Items Sold
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatNumber(data?.itemsSold)}
              </div>
            </div>

            <div
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Profit
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatCurrency(data?.profit)}
              </div>
            </div>

            <div
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease',
                padding: '12px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Margin %
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatPercent(data?.marginPercent)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TodayPerformance;
