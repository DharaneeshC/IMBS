import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiX, HiEye, HiEyeOff } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess('Password changed successfully! Logging you out...');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Close modal, logout, and redirect to login after 2 seconds
        setTimeout(async () => {
          onClose();
          await logout();
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
      console.error('Change password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#2e4a3e'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Change Password
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <HiX style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#fef2f2',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#f0fdf4',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '13px', color: '#15803d', margin: 0 }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111',
                marginBottom: '8px'
              }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1.5px solid #ccc',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#111',
                    boxSizing: 'border-box',
                    background: '#fff',
                    borderRadius: '8px'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2e4a3e'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('current')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPasswords.current ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111',
                marginBottom: '8px'
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1.5px solid #ccc',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#111',
                    boxSizing: 'border-box',
                    background: '#fff',
                    borderRadius: '8px'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2e4a3e'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('new')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPasswords.new ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '6px',
                marginBottom: 0
              }}>
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm New Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111',
                marginBottom: '8px'
              }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1.5px solid #ccc',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#111',
                    boxSizing: 'border-box',
                    background: '#fff',
                    borderRadius: '8px'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2e4a3e'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('confirm')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPasswords.confirm ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#374151',
                  border: '1.5px solid #d1d5db',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#6b7280' : '#2e4a3e',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => { if (!loading) e.target.style.background = '#243d32'; }}
                onMouseLeave={e => { if (!loading) e.target.style.background = '#2e4a3e'; }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
