import React from 'react';
import { useNavigate } from 'react-router-dom';

const PendingTasks = ({ data }) => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: '📦',
      title: 'PURCHASES',
      tasks: [
        {
          label: 'To Be Received',
          count: data?.purchasesToReceive || 0,
          link: '/purchase-orders'
        },
        {
          label: 'Receive In Progress',
          count: data?.purchasesInProgress || 0,
          link: '/purchase-orders'
        }
      ]
    },
    {
      icon: '💰',
      title: 'SALES',
      tasks: [
        {
          label: 'To Be Packed',
          count: data?.salesToPack || 0,
          link: '/sales/invoices'
        },
        {
          label: 'To Be Shipped',
          count: data?.salesToShip || 0,
          link: '/sales/invoices'
        },
        {
          label: 'To Be Delivered',
          count: data?.salesToDeliver || 0,
          link: '/sales/invoices'
        }
      ]
    },
    {
      icon: '📄',
      title: 'INVOICES',
      tasks: [
        {
          label: 'To Be Invoiced',
          count: data?.toBeInvoiced || 0,
          link: '/sales/invoices'
        }
      ]
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
        Pending Tasks
      </div>

      {/* Sections */}
      <div>
        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            style={{
              marginBottom: sectionIndex < sections.length - 1 ? '16px' : '0'
            }}
          >
            {/* Section Header */}
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              {section.icon} {section.title}
            </div>

            {/* Tasks */}
            <div>
              {section.tasks.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  onClick={() => navigate(task.link)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: taskIndex < section.tasks.length - 1 ? '4px' : '0',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 150ms ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    {task.label}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {task.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTasks;
