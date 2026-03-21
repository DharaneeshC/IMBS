import React, { createContext, useState, useContext } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: {
      all: true,
      inStock: false,
      lowStock: false,
      outOfStock: false
    },
    designer: ''
  });

  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateStockStatus = (status) => {
    // Handle exclusive selection for stock status
    if (status === 'all') {
      setFilters(prev => ({
        ...prev,
        stockStatus: {
          all: true,
          inStock: false,
          lowStock: false,
          outOfStock: false
        }
      }));
    } else {
      setFilters(prev => {
        const newStockStatus = {
          ...prev.stockStatus,
          all: false,
          [status]: !prev.stockStatus[status]
        };

        // If no specific status is selected, default to 'all'
        const anySelected = newStockStatus.inStock || newStockStatus.lowStock || newStockStatus.outOfStock;
        if (!anySelected) {
          newStockStatus.all = true;
        }

        return {
          ...prev,
          stockStatus: newStockStatus
        };
      });
    }
  };

  const applyFilters = () => {
    setIsFilterApplied(true);
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      stockStatus: {
        all: true,
        inStock: false,
        lowStock: false,
        outOfStock: false
      },
      designer: ''
    });
    setIsFilterApplied(false);
  };

  const getFilteredProducts = (products) => {
    if (!isFilterApplied) return products;

    return products.filter(product => {
      // Category filter - use 'type' field from database
      if (filters.category !== 'all') {
        const productType = product.type?.toLowerCase() || '';
        const filterCategory = filters.category.toLowerCase();
        if (productType !== filterCategory) {
          return false;
        }
      }

      // Stock status filter - use 'quantity' field from database
      const { all, inStock, lowStock, outOfStock } = filters.stockStatus;
      if (!all) {
        // If no specific status is selected when 'all' is off, show nothing
        if (!inStock && !lowStock && !outOfStock) return false;

        // Check if product matches any of the selected statuses (OR logic)
        const productQuantity = product.quantity || 0;
        const matchesStatus =
          (inStock && productQuantity > 5) ||
          (lowStock && productQuantity > 0 && productQuantity <= 5) ||
          (outOfStock && productQuantity === 0);

        if (!matchesStatus) return false;
      }

      // Designer filter - use Designer relationship from database
      if (filters.designer && filters.designer !== '') {
        const productDesignerName = product.Designer?.name || '';
        if (productDesignerName !== filters.designer) {
          return false;
        }
      }

      return true;
    });
  };

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilter,
      updateStockStatus,
      applyFilters,
      resetFilters,
      getFilteredProducts,
      isFilterApplied
    }}>
      {children}
    </FilterContext.Provider>
  );
};
