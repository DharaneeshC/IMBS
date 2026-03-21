import React from 'react';
import { useNavigate } from 'react-router-dom';

const LowStockAlerts = ({ data }) => {
  const navigate = useNavigate();

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
        Low Stock Alerts
      </div>

      {data && data.length > 0 ? (
        <>
          {/* Description */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Below Reorder Level • {data.length} items
          </div>

          {/* Table */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                    Product Name
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
                    Stock
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
                    Reorder
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((item, index) => {
                  const isCritical = item.current_stock < (item.reorder_level * 0.5);
                  return (
                    <tr
                      key={item.id || index}
                      onClick={() => navigate(`/products?search=${item.sku || item.product_name}`)}
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
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        {item.product_name}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        padding: '12px 8px',
                        color: isCritical ? '#dc2626' : '#f97316',
                        fontWeight: 600,
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        {item.current_stock}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        padding: '12px 8px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        {item.reorder_level}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Create Purchase Order Button */}
          <button
            onClick={() => navigate('/purchase-orders')}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
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
            View Purchase Orders
          </button>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          All items are well stocked
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;
