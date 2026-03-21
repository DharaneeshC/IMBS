// Phase 3 - Validation Utilities

/**
 * Validate if a value is required (not empty)
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate numeric value
 */
export const validateNumeric = (value, fieldName = 'Field') => {
  if (isNaN(value) || value === '') {
    return `${fieldName} must be a valid number`;
  }
  return null;
};

/**
 * Validate positive number
 */
export const validatePositive = (value, fieldName = 'Field') => {
  const numericError = validateNumeric(value, fieldName);
  if (numericError) return numericError;
  
  if (parseFloat(value) <= 0) {
    return `${fieldName} must be greater than 0`;
  }
  return null;
};

/**
 * Validate non-negative number
 */
export const validateNonNegative = (value, fieldName = 'Field') => {
  const numericError = validateNumeric(value, fieldName);
  if (numericError) return numericError;
  
  if (parseFloat(value) < 0) {
    return `${fieldName} cannot be negative`;
  }
  return null;
};

/**
 * Validate numeric range
 */
export const validateRange = (value, min, max, fieldName = 'Field') => {
  const numericError = validateNumeric(value, fieldName);
  if (numericError) return numericError;
  
  const num = parseFloat(value);
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return null; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone) => {
  if (!phone) return null; // Optional field
  
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
    return 'Invalid phone number (minimum 10 digits)';
  }
  return null;
};

/**
 * Validate stock availability for sale
 */
export const validateStockAvailability = (requestedQuantity, availableStock, productName) => {
  if (requestedQuantity > availableStock) {
    return `Insufficient stock for ${productName}. Available: ${availableStock}, Requested: ${requestedQuantity}`;
  }
  return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
  if (value && value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value, minLength, fieldName = 'Field') => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

/**
 * Validate date is not in the past
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return `${fieldName} cannot be in the past`;
  }
  return null;
};

/**
 * Validate date is not in the future
 */
export const validatePastOrPresentDate = (date, fieldName = 'Date') => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (selectedDate > today) {
    return `${fieldName} cannot be in the future`;
  }
  return null;
};

/**
 * Validate SKU format
 */
export const validateSKU = (sku) => {
  if (!sku) return 'SKU is required';
  
  const skuRegex = /^[A-Z0-9\-_]+$/;
  if (!skuRegex.test(sku)) {
    return 'SKU can only contain uppercase letters, numbers, hyphens, and underscores';
  }
  
  if (sku.length < 3) {
    return 'SKU must be at least 3 characters';
  }
  
  return null;
};

/**
 * Comprehensive form validation
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    rules.forEach(rule => {
      if (errors[field]) return; // Skip if already has error
      
      const error = rule.validator(value, rule.params);
      if (error) {
        errors[field] = error;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Show confirmation dialog
 */
export const confirmAction = (message, title = 'Confirm Action') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    resolve(confirmed);
  });
};

/**
 * Confirm delete action
 */
export const confirmDelete = (itemName, itemType = 'item') => {
  return confirmAction(
    `Are you sure you want to delete this ${itemType}?\n\n"${itemName}"\n\nThis action cannot be undone.`,
    'Confirm Delete'
  );
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

export default {
  validateRequired,
  validateNumeric,
  validatePositive,
  validateNonNegative,
  validateRange,
  validateEmail,
  validatePhone,
  validateStockAvailability,
  validateMaxLength,
  validateMinLength,
  validateFutureDate,
  validatePastOrPresentDate,
  validateSKU,
  validateForm,
  confirmAction,
  confirmDelete,
  formatErrorMessage
};
