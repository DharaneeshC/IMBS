import React from 'react';
import { HiX, HiExclamationCircle, HiCheckCircle, HiInformationCircle } from 'react-icons/hi';

/**
 * Alert Component for displaying success, error, warning, or info messages
 * Phase 3 - Enhanced Error Handling
 */
const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          icon: <HiCheckCircle className="w-5 h-5 text-green-500" />,
          titleColor: 'text-green-800 dark:text-green-400',
          messageColor: 'text-green-700 dark:text-green-300',
          closeColor: 'text-green-500 hover:text-green-700 dark:hover:text-green-300'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: <HiExclamationCircle className="w-5 h-5 text-red-500" />,
          titleColor: 'text-red-800 dark:text-red-400',
          messageColor: 'text-red-700 dark:text-red-300',
          closeColor: 'text-red-500 hover:text-red-700 dark:hover:text-red-300'
        };
      case 'warning':
        return {
          container: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
          icon: <HiExclamationCircle className="w-5 h-5 text-orange-500" />,
          titleColor: 'text-orange-800 dark:text-orange-400',
          messageColor: 'text-orange-700 dark:text-orange-300',
          closeColor: 'text-orange-500 hover:text-orange-700 dark:hover:text-orange-300'
        };
      default: // info
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: <HiInformationCircle className="w-5 h-5 text-blue-500" />,
          titleColor: 'text-blue-800 dark:text-blue-400',
          messageColor: 'text-blue-700 dark:text-blue-300',
          closeColor: 'text-blue-500 hover:text-blue-700 dark:hover:text-blue-300'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <div className={`text-sm ${title ? 'mt-1' : ''} ${styles.messageColor}`}>
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${styles.closeColor} transition-colors`}
          >
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Field Error Component - displays validation error below a form field
 */
export const FieldError = ({ error }) => {
  if (!error) return null;
  
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
      <HiExclamationCircle className="w-4 h-4 mr-1" />
      {error}
    </p>
  );
};

/**
 * Validation Summary Component - displays all form validation errors
 */
export const ValidationSummary = ({ errors, title = 'Please correct the following errors:' }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <Alert
      type="error"
      title={title}
      message={
        <ul className="list-disc list-inside space-y-1 mt-2">
          {Object.entries(errors).map(([field, error]) => (
            <li key={field}>{error}</li>
          ))}
        </ul>
      }
    />
  );
};

export default Alert;
