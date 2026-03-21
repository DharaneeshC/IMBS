import React from 'react';
import { useNavigate } from 'react-router-dom';

const SalesTrend = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const getWeekLabel = (index, total) => {
    if (index === total - 1) return 'This Week';
    const weeksAgo = total - index - 1;
    return weeksAgo === 1 ? '1 Week Ago' : `${weeksAgo} Weeks Ago`;
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return '-';
    const growth = ((current - previous) / previous) * 100;
    const trend = growth > 0 ? '↑' : growth < 0 ? '↓' : '→';
    return `${trend} ${Math.abs(growth).toFixed(1)}%`;
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '14px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Sales Trend - Last 4 Weeks
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
                Week
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
                Invoices
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
                Revenue
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
                Growth
              </th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((week, index) => {
                const isCurrentWeek = index === data.length - 1;
                const growth = index > 0 ? calculateGrowth(week.revenue, data[index - 1].revenue) : '-';
                const growthColor = growth.includes('↑') ? '#16a34a' : growth.includes('↓') ? '#dc2626' : '#6b7280';

                return (
                  <tr
                    key={index}
                    onClick={() => navigate('/sales/invoices')}
                    style={{
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                      background: isCurrentWeek ? '#f9fafb' : 'transparent'
                    }}
                    onMouseEnter={(e) => !isCurrentWeek && (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => !isCurrentWeek && (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{
                      padding: '12px 8px',
                      color: '#111827',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: isCurrentWeek ? 600 : 500
                    }}>
                      {week.week_label || getWeekLabel(index, data.length)}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: '#111827',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {week.invoices || 0}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: '#111827',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {formatCurrency(week.revenue)}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      padding: '12px 8px',
                      color: growthColor,
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600
                    }}>
                      {growth}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  No sales data available for the last 4 weeks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTrend;
