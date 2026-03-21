import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeadStockAlert = ({ data }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderLeft: '4px solid #f97316',
      borderRadius: '6px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Action Required
        </div>
        <button
          onClick={() => navigate('/inventory/stock-levels')}
          style={{
            fontSize: '12px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
        >
          View All →
        </button>
      </div>

      {data && data.length > 0 ? (
        <>
          {/* Description */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Dead Stock (90+ days unsold)
          </div>

          {/* List Items */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {data.slice(0, 10).map((item, index) => (
              <div
                key={item.id || index}
                onClick={() => navigate(`/products/${item.id}`)}
                style={{
                  padding: '12px',
                  borderBottom: index < Math.min(data.length, 10) - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef3c7'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {item.product_name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {item.current_stock} pcs • {item.days_unsold} days
                    </div>
                  </div>
                  <span style={{ color: '#f97316', fontSize: '14px' }}>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '12px'
          }}>
            <button
              onClick={() => navigate('/inventory/stock-levels')}
              style={{
                padding: '10px',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#111827',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Discount Selected
            </button>
            <button
              onClick={() => navigate('/inventory/stock-levels')}
              style={{
                padding: '10px',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#111827',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Mark for Review
            </button>
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          No items have been unsold for 90+ days
        </div>
      )}
    </div>
  );
};

export default DeadStockAlert;
