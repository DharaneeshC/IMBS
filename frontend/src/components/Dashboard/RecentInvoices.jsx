import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentInvoices = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status) => {
    return '•';
  };

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'delivered') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'confirmed' || status === 'pending') return { bg: '#fef3c7', color: '#92400e' };
    if (status === 'shipped') return { bg: '#dbeafe', color: '#1e40af' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'completed': 'Completed',
      'delivered': 'Delivered',
      'confirmed': 'Confirmed',
      'pending': 'Pending',
      'shipped': 'Shipped',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
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
        Recent Invoices
      </div>

      {/* Content */}
      {data && data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.slice(0, 5).map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #f3f4f6',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '2px'
                }}>
                  {invoice.invoice_number || `Invoice #${invoice.id}`}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{invoice.customer_name || 'Walk-in Customer'}</span>
                  <span>•</span>
                  <span>{formatDate(invoice.sale_date)}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 'fit-content'
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {formatCurrency(invoice.total_amount)}
                  </div>
                  {invoice.status && (
                    <div style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: getStatusColor(invoice.status).color,
                      background: getStatusColor(invoice.status).bg,
                      padding: '2px 6px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '2px'
                    }}>
                      <span>{getStatusIcon(invoice.status)}</span>
                      <span>{getStatusDisplay(invoice.status)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* View All Button */}
          {data.length > 5 && (
            <button
              onClick={() => navigate('/sales/invoices')}
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
              View All Invoices
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: '4px'
          }}>
            No recent invoices
          </div>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginBottom: '12px'
          }}>
            Create your first sale to see invoices here
          </div>
          <button
            onClick={() => navigate('/sales/new')}
            style={{
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
      )}
    </div>
  );
};

export default RecentInvoices;