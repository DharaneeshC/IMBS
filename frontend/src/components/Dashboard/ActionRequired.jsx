import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActionRequired = ({ data }) => {
  const navigate = useNavigate();

  const formatNumber = (value) => {
    return parseFloat(value || 0).toLocaleString('en-IN');
  };

  const handleItemClick = (item) => {
    // Navigate to product details or inventory page
    if (item.sku) {
      navigate(`/products?search=${item.sku}`);
    } else {
      navigate(`/inventory?filter=low-stock`);
    }
  };

  const handleViewAllClick = () => {
    navigate('/inventory?filter=action-required');
  };

  // Separate items by priority
  const highPriorityItems = data?.filter(item => item.priority === 'high') || [];
  const mediumPriorityItems = data?.filter(item => item.priority === 'medium') || [];

  const totalItems = (data?.length || 0);
  const hasItems = totalItems > 0;

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
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Action Required
        {totalItems > 0 && (
          <span style={{
            background: '#f97316',
            color: 'white',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 600
          }}>
            {totalItems}
          </span>
        )}
      </div>

      {/* Content */}
      {hasItems ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* High Priority Items (Low Stock) */}
          {highPriorityItems.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#dc2626',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                LOW STOCK ALERTS ({highPriorityItems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {highPriorityItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.product_name}
                      </div>
                      {item.sku && (
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
                          SKU: {item.sku}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#dc2626',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {formatNumber(item.current_stock)} left
                      {item.shortage && (
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          Need {formatNumber(item.shortage)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority Items (Dead Stock) */}
          {mediumPriorityItems.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#f59e0b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                DEAD STOCK ALERTS ({mediumPriorityItems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mediumPriorityItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fffbeb'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.product_name}
                      </div>
                      {item.sku && (
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
                          SKU: {item.sku}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#f59e0b',
                      minWidth: '80px',
                      textAlign: 'right'
                    }}>
                      {item.days_unsold} days unsold
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                        Stock: {formatNumber(item.current_stock)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View All Button */}
          {totalItems > 5 && (
            <button
              onClick={handleViewAllClick}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              View All {totalItems} Items Requiring Action
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#16a34a',
            marginBottom: '4px'
          }}>
            All Good!
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            No items require immediate action
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionRequired;