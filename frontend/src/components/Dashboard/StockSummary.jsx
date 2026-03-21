import React from 'react';
import { useNavigate } from 'react-router-dom';

const StockSummary = ({ data }) => {
  const navigate = useNavigate();

  const metrics = [
    {
      label: 'Total Items',
      description: 'Different products in inventory',
      value: data?.totalItems || 0,
      color: '#111827',
      link: '/products'
    },
    {
      label: 'Total Stock',
      description: 'Total pieces available for sale',
      value: `${data?.totalStock || 0} pcs`,
      color: '#111827',
      link: '/products'
    },
    {
      label: 'Low Stock',
      description: 'Items need restocking soon',
      value: `${data?.lowStockCount || 0} items`,
      color: (data?.lowStockCount || 0) > 0 ? '#f97316' : '#111827',
      link: '/inventory/low-stock'
    },
    {
      label: 'Out of Stock',
      description: 'Items completely out of stock',
      value: `${data?.outOfStockCount || 0} items`,
      color: (data?.outOfStockCount || 0) > 0 ? '#dc2626' : '#111827',
      link: '/inventory/stock-levels'
    }
  ];

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
        Jewellery Stock Summary
      </div>

      {/* Metrics List */}
      <div>
        {metrics.map((metric, index) => (
          <div
            key={index}
            onClick={() => navigate(metric.link)}
            style={{
              paddingTop: index > 0 ? '20px' : '0',
              paddingBottom: index < metrics.length - 1 ? '20px' : '0',
              borderBottom: index < metrics.length - 1 ? '1px solid #e5e7eb' : 'none',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              margin: '0 -20px',
              padding: '20px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: metric.color,
                  marginBottom: '4px'
                }}>
                  {metric.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  {metric.description}
                </div>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: metric.color,
                marginLeft: '16px'
              }}>
                {metric.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button
        onClick={() => navigate('/products')}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '16px',
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
        View All Products
      </button>
    </div>
  );
};

export default StockSummary;
