import React from 'react';
import { HiExclamationCircle, HiTrash, HiCheckCircle } from 'react-icons/hi';

/**
 * Confirm Dialog Component
 * Phase 3 - Confirm Delete and Important Actions
 */
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  confirmButtonClass = '',
  isProcessing = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <HiTrash className="w-12 h-12 text-red-500" />,
          confirmButton: confirmButtonClass || 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'success':
        return {
          icon: <HiCheckCircle className="w-12 h-12 text-green-500" />,
          confirmButton: confirmButtonClass || 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'info':
        return {
          icon: <HiExclamationCircle className="w-12 h-12 text-blue-500" />,
          confirmButton: confirmButtonClass || 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default: // warning
        return {
          icon: <HiExclamationCircle className="w-12 h-12 text-orange-500" />,
          confirmButton: confirmButtonClass || 'bg-orange-600 hover:bg-orange-700 text-white'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = async () => {
    if (isProcessing) return;
    await onConfirm();
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      ></div>

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirm Delete Dialog - Specialized for delete actions
 */
export const ConfirmDelete = ({ isOpen, onClose, onConfirm, itemName, itemType = 'item', isProcessing = false }) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Delete"
      message={
        <>
          Are you sure you want to delete this {itemType}?
          {itemName && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="font-semibold text-gray-900 dark:text-white">"{itemName}"</span>
            </div>
          )}
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
            This action cannot be undone.
          </div>
        </>
      }
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
      isProcessing={isProcessing}
    />
  );
};

export default ConfirmDialog;
