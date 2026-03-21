import React from 'react';
import { useNavigate } from 'react-router-dom';

const SalesVsPurchases = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, trend: 'stable' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const salesChange = calculateChange(
    data?.thisMonth?.sales,
    data?.lastMonth?.sales
  );
  const purchasesChange = calculateChange(
    data?.thisMonth?.purchases,
    data?.lastMonth?.purchases
  );
  const profitChange = calculateChange(
    data?.thisMonth?.profit,
    data?.lastMonth?.profit
  );

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
          Sales vs Purchases
        </div>
        {data?.thisMonth?.invoiceCount > 0 && (
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            background: '#f3f4f6',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {data.thisMonth.invoiceCount} invoice{data.thisMonth.invoiceCount !== 1 ? 's' : ''} this month
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          fontSize: '13px',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                textAlign: 'left',
                padding: '10px 8px',
                fontWeight: 600,
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb',
                textTransform: 'uppercase',
                fontSize: '11px'
              }}>
                Period
              </th>
              <th style={{
                textAlign: 'right',
                padding: '10px 8px',
                fontWeight: 600,
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb',
                textTransform: 'uppercase',
                fontSize: '11px'
              }}>
                Sales
              </th>
              <th style={{
                textAlign: 'right',
                padding: '10px 8px',
                fontWeight: 600,
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb',
                textTransform: 'uppercase',
                fontSize: '11px'
              }}>
                Purchase
              </th>
              <th style={{
                textAlign: 'right',
                padding: '10px 8px',
                fontWeight: 600,
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb',
                textTransform: 'uppercase',
                fontSize: '11px'
              }}>
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {/* This Month Row */}
            <tr
              onClick={() => navigate('/sales/invoices')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '12px 8px',
                color: '#111827',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: 600
              }}>
                This Month
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#111827',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.thisMonth?.sales)}
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#111827',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.thisMonth?.purchases)}
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#111827',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.thisMonth?.profit)}
              </td>
            </tr>

            {/* Last Month Row */}
            <tr
              onClick={() => navigate('/reports')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '12px 8px',
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb'
              }}>
                Last Month
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.lastMonth?.sales)}
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.lastMonth?.purchases)}
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: '#6b7280',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {formatCurrency(data?.lastMonth?.profit)}
              </td>
            </tr>

            {/* Change Row */}
            <tr
              onClick={() => navigate('/reports')}
              style={{
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '12px 8px',
                color: '#111827',
                fontWeight: 600
              }}>
                Change
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: salesChange.trend === 'up' ? '#16a34a' : salesChange.trend === 'down' ? '#dc2626' : '#6b7280',
                fontWeight: 600
              }}>
                {salesChange.trend === 'up' && '↑ '}
                {salesChange.trend === 'down' && '↓ '}
                {salesChange.value}%
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: purchasesChange.trend === 'up' ? '#dc2626' : purchasesChange.trend === 'down' ? '#16a34a' : '#6b7280',
                fontWeight: 600
              }}>
                {purchasesChange.trend === 'up' && '↑ '}
                {purchasesChange.trend === 'down' && '↓ '}
                {purchasesChange.value}%
              </td>
              <td style={{
                textAlign: 'right',
                padding: '12px 8px',
                color: profitChange.trend === 'up' ? '#16a34a' : profitChange.trend === 'down' ? '#dc2626' : '#6b7280',
                fontWeight: 600
              }}>
                {profitChange.trend === 'up' && '↑ '}
                {profitChange.trend === 'down' && '↓ '}
                {profitChange.value}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesVsPurchases;
