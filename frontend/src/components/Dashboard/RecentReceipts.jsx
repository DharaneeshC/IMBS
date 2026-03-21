import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentReceipts = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status) => {
    return '•';
  };

  const getStatusColor = (status) => {
    if (status === 'received') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'pending' || status === 'approved') return { bg: '#fef3c7', color: '#92400e' };
    if (status === 'partial') return { bg: '#dbeafe', color: '#1e40af' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'received': 'Received',
      'pending': 'Pending',
      'approved': 'Approved',
      'partial': 'Partial',
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
        Recent Stock Receipts
      </div>

      {/* List Items */}
      {data && data.length > 0 ? (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {data.slice(0, 10).map((receipt, index) => {
            const statusStyle = getStatusColor(receipt.status);
            return (
              <div
                key={receipt.id || index}
                onClick={() => navigate(`/purchase-orders/${receipt.id}`)}
                style={{
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  marginBottom: index < data.length - 1 ? '8px' : '0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {getStatusIcon(receipt.status)} {receipt.receipt_number}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '2px',
                    background: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    {getStatusDisplay(receipt.status)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  <span>{receipt.supplier_name}</span>
                  <span>{formatDate(receipt.purchase_date)}</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827'
                }}>
                  {receipt.total_items} items • {formatCurrency(receipt.total_amount)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          No recent purchase receipts
        </div>
      )}

      {/* View All Button */}
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
        View All Purchase Orders
      </button>
    </div>
  );
};

export default RecentReceipts;
