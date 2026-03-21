import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useFilter } from '../../contexts/FilterContext';
import { 
  HiSearch, 
  HiChevronDown, 
  HiX, 
  HiCheck, 
  HiUpload, 
  HiDownload, 
  HiPlus, 
  HiViewList, 
  HiViewGrid,
  HiCube,
  HiFilter
} from 'react-icons/hi';

const ProductList = () => {
  const { getFilteredProducts } = useFilter();
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);
  const [searchScope, setSearchScope] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchTypes();
  }, []);

  // Reset selections when filtered products change
  useEffect(() => {
    setSelectedItems(new Set());
    setSelectAll(false);
  }, [selectedType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setImportMenuOpen(false);
        setExportMenuOpen(false);
        setSearchScopeOpen(false);
      }
    };

    if (importMenuOpen || exportMenuOpen || searchScopeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [importMenuOpen, exportMenuOpen, searchScopeOpen]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.get('/products/types/all');
      setTypes(response.data);
    } catch (err) {
      console.error('Failed to load product types');
    }
  };

  // const handleDelete = async (id) => {
  //   if (window.confirm('Are you sure you want to delete this product?')) {
  //     try {
  //       await api.delete(`/products/${id}`);
  //       fetchProducts();
  //     } catch (err) {
  //       alert('Failed to delete product');
  //     }
  //   }
  // };

  const handleSelectItem = (productId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedProducts.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      setSelectedItems(new Set(filteredAndSortedProducts.map(p => p.id)));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected products?`)) {
      try {
        await Promise.all([...selectedItems].map(id => api.delete(`/products/${id}`)));
        setSelectedItems(new Set());
        setSelectAll(false);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete some products');
      }
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = [
      'Name', 'Type', 'SKU', 'Designer ID', 'Designer Name', 'Quantity', 'Cost', 'Price', 'Description',
      'Metal Type', 'Metal Purity', 'Gross Weight', 'Net Weight', 'Stone Weight',
      'Gemstone Type', 'Gemstone Count', 'Gemstone Carat', 'Size'
    ];

    const rows = data.map(product => [
      `"${(product.name || '').replace(/"/g, '""')}"`,
      `"${(product.type || '').replace(/"/g, '""')}"`,
      `"${(product.sku || '').replace(/"/g, '""')}"`,
      product.designerId || '',
      `"${(product.designer?.name || '').replace(/"/g, '""')}"`,
      product.quantity || 0,
      product.cost || 0,
      product.price || 0,
      `"${(product.description || '').replace(/"/g, '""')}"`,
      `"${(product.metalType || '').replace(/"/g, '""')}"`,
      `"${(product.metalPurity || '').replace(/"/g, '""')}"`,
      product.grossWeight || 0,
      product.netWeight || 0,
      product.stoneWeight || 0,
      `"${(product.gemstoneType || '').replace(/"/g, '""')}"`,
      product.gemstoneCount || 0,
      product.gemstoneCarat || 0,
      `"${(product.size || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    exportToCSV(products, `inventory_all_${new Date().toISOString().split('T')[0]}.csv`);
    setExportMenuOpen(false);
  };

  const handleExportLowStock = () => {
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= 5);
    exportToCSV(lowStockProducts, `inventory_low_stock_${new Date().toISOString().split('T')[0]}.csv`);
    setExportMenuOpen(false);
  };

  const parseCSVRow = (str) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && str[i+1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        
        const importedProducts = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = parseCSVRow(line);
            return {
              name: values[0],
              type: values[1],
              sku: values[2],
              designer: parseInt(values[3]) || null, // designer ID
              // values[4] is Designer Name
              quantity: parseInt(values[5]) || 0,
              cost: parseFloat(values[6]) || 0,
              price: parseFloat(values[7]) || 0,
              description: values[8] || '',
              metalType: values[9] || '',
              metalPurity: values[10] || '',
              grossWeight: parseFloat(values[11]) || 0,
              netWeight: parseFloat(values[12]) || 0,
              stoneWeight: parseFloat(values[13]) || 0,
              gemstoneType: values[14] || '',
              gemstoneCount: parseInt(values[15]) || 0,
              gemstoneCarat: parseFloat(values[16]) || 0,
              size: values[17] || ''
            };
          });

        setLoading(true);
        let successCount = 0;
        let errorsCount = 0;

        for (const product of importedProducts) {
          try {
             // Basic req block check before hitting API so we don't spam 400 errors for bad rows
             if (!product.designer || !product.name || !product.type) { 
                 errorsCount++; continue; 
             }
             await api.post('/products', product);
             successCount++;
          } catch (err) {
             console.error('Failed appending product:', err);
             errorsCount++;
          }
        }

        fetchProducts();
        setImportMenuOpen(false);
        alert(`Successfully imported ${successCount} products! ${errorsCount > 0 ? `(${errorsCount} failed)` : ''}`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error parsing CSV file. Please check the format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const calculateTotals = (productsList) => {
    return {
      totalProducts: productsList.length,
      totalQuantity: productsList.reduce((sum, p) => sum + p.quantity, 0),
      totalValue: productsList.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      lowStockItems: productsList.filter(p => p.quantity > 0 && p.quantity <= 5).length
    };
  };

  const getStockBadge = (quantity) => {
    if (quantity <= 0) {
      return <span className="text-red-700 text-sm font-bold">Out of Stock</span>;
    } else if (quantity <= 5) {
      return <span className="text-amber-700 text-sm font-bold">Low Stock</span>;
    }
    return <span className="text-green-700 text-sm font-bold">In Stock</span>;
  };

  const filteredAndSortedProducts = (() => {
    // First apply global filters from FilterContext
    let filtered = getFilteredProducts(products);
    
    // Apply search scope filter (from dropdown)
    if (searchScope !== 'all') {
      filtered = filtered.filter(p => p.type === searchScope);
    }
    
    // Then apply type filter (from category pills)
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query) ||
        (p.designer?.name || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query)
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'designer':
          aValue = (a.designer?.name || '').toLowerCase();
          bValue = (b.designer?.name || '').toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 relative">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm relative z-30">
        <div className="container mx-auto px-6 py-2">
          {/* Top Row: Title, Search, Actions */}
          <div className="flex items-center gap-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jewellery Inventory</h1>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="relative dropdown-container">
                {/* Search Scope Dropdown */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <button
                    onClick={() => setSearchScopeOpen(!searchScopeOpen)}
                    className="flex items-center gap-1 pl-3 pr-2 h-full text-[#1F3A2E] hover:text-[#1F3A2E] border-r border-gray-300 transition-colors"
                  >
                    <HiFilter className="w-4 h-4" />
                    <HiChevronDown className="w-3 h-3" />
                  </button>
                </div>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${searchScope === 'all' ? 'All Items' : searchScope}...`}
                  className="w-full pl-14 pr-10 py-2 border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-all bg-gray-50 focus:bg-white"
                />
                
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                )}

                {/* Search Scope Dropdown Menu */}
                {searchScopeOpen && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
                    <button
                      onClick={() => {
                        setSearchScope('all');
                        setSearchScopeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                        searchScope === 'all' 
                          ? 'bg-teal-50 text-teal-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>All Items ({products.length})</span>
                      {searchScope === 'all' && (
                        <HiCheck className="w-4 h-4" />
                      )}
                    </button>
                    {types.map((type, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchScope(type);
                          setSearchScopeOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                          searchScope === type 
                            ? 'bg-teal-50 text-teal-700 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{type} ({products.filter(p => p.type === type).length})</span>
                        {searchScope === type && (
                          <HiCheck className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 lg:w-auto">
                {/* Import Button - Single Action */}
                <label htmlFor="csv-upload" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all text-sm font-medium shadow-sm hover:shadow cursor-pointer">
                  <HiUpload className="w-4 h-4" />
                  Import
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  id="csv-upload"
                />

                {/* Export Dropdown */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => {
                      setExportMenuOpen(!exportMenuOpen);
                      setImportMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all text-sm font-medium shadow-sm hover:shadow"
                  >
                    <HiDownload className="w-4 h-4" />
                    Export
                    <HiChevronDown className="w-3 h-3" />
                  </button>
                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
                      <button
                        onClick={handleExportAll}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-md mx-1"
                      >
                        Export Inventory
                      </button>
                      <button
                        onClick={handleExportLowStock}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-md mx-1"
                      >
                        Export Low Stock
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Product Button */}
                <Link
                  to="/products/new"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors text-sm font-semibold shadow-md"
                >
                  <HiPlus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>
            )}
          </div>

          {/* View Controls, Summary & Sort - Combined Row */}
          {products.length > 0 && (
            <div className="flex items-center justify-between gap-4 mt-3">
              {/* Left: View Controls */}
              <div className="flex items-center gap-2">
                  {/* Table/Grid Toggle */}
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2.5 rounded-l-lg transition-all ${
                        viewMode === 'table'
                          ? 'bg-[#1F3A2E] text-white shadow-inner'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Table View"
                    >
                      <HiViewList className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-r-lg transition-all border-l border-gray-200 ${
                        viewMode === 'grid'
                          ? 'bg-[#1F3A2E] text-white shadow-inner'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Grid View"
                    >
                      <HiViewGrid className="w-4 h-4" />
                    </button>
                  </div>
              </div>

              {/* Center: Summary Text - Dynamic */}
              {(() => {
                // Calculate totals from ALL products
                const totalProducts = products.length;
                const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
                const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                const uniqueDesigners = new Set(products.map(p => p.designer?.id).filter(id => id != null && id !== undefined)).size;
                const reorderAlerts = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
                const outOfStock = products.filter(p => p.quantity === 0).length;

                return (
                  <div className="flex-1 text-center">
                    <p className="text-lg text-gray-900 font-bold">
                      {totalProducts} Products • {uniqueDesigners} Designers • {totalQuantity} pieces • ₹{(totalValue / 10000000).toFixed(2)} Cr stock value • {reorderAlerts} reorder alerts{outOfStock > 0 && ` • ${outOfStock} out of stock`}
                    </p>
                  </div>
                );
              })()}

              {/* Right: Sort Controls */}
              {filteredAndSortedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] bg-white shadow-sm hover:border-gray-300 transition-all"
                  >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="designer">Designer</option>
                <option value="quantity">Quantity</option>
                    <option value="cost">Cost</option>
                    <option value="price">Price</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all bg-white shadow-sm"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Table or Grid */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        {/* Bulk Actions Bar - Only for table view */}
        {viewMode === 'table' && selectedItems.size > 0 && (
          <div className="mb-4 bg-[#1a1d2e] text-white rounded-lg px-4 py-2 flex items-center justify-between shadow-lg">
            <span className="text-sm font-medium">{selectedItems.size} item(s) selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {filteredAndSortedProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Items Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 
                `No items match "${searchQuery}"` :
                selectedType === 'all' 
                  ? "Start by adding your first item to inventory"
                  : `No items found in "${selectedType}" category`
              }
            </p>
            {selectedType === 'all' && !searchQuery && (
              <Link to="/products/new" className="inline-flex items-center px-6 py-3 bg-[#1a1d2e] text-white font-medium rounded-lg hover:bg-[#2a2e42] transition-colors">
                <HiPlus className="w-5 h-5 mr-2" />
                Add Your First Item
              </Link>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 w-12">
                      <input
                       type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-[#1F3A2E] bg-gray-100 border-gray-300 rounded focus:ring-[#1F3A2E] focus:ring-2"
                      />
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Product
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Designer
                    </th>
                    <th className="text-center text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Qty
                    </th>
                    <th className="text-right text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Selling Price
                    </th>
                    <th className="text-center text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Status
                    </th>
                    <th className="text-center text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedProducts.map((product) => (
                    <tr key={product.id} className={`transition-colors duration-150 border-b border-gray-100 ${
                      product.quantity === 0 ? 'bg-red-50 hover:bg-red-100' : 
                      product.quantity > 0 && product.quantity <= 5 ? 'bg-amber-50 hover:bg-amber-100' :
                      'hover:bg-gray-50'
                    }`}>
                      <td className="px-4 py-2.5 w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(product.id)}
                          onChange={() => handleSelectItem(product.id)}
                          className="w-4 h-4 text-[#1F3A2E] bg-gray-100 border-gray-300 rounded focus:ring-[#1F3A2E] focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/products/${product.id}`}
                          className="block group"
                        >
                          <div className="text-[15px] font-bold text-gray-900 group-hover:text-[#1F3A2E] transition-colors">
                            {product.name}
                          </div>
                          <div className="text-[13px] text-gray-600 mt-0.5 font-semibold">
                            {product.type}
                          </div>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Link
                          to={`/designers/${product.designer?.id}`}
                          className="text-[14px] text-gray-700 hover:text-[#1F3A2E] transition-colors font-semibold"
                        >
                          {product.designer?.name || 'N/A'}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-center px-4 py-2.5">
                        <span className={`text-[15px] font-bold ${
                          product.quantity > 0 && product.quantity <= 5 ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right px-4 py-2.5">
                        <div className="text-[15px] font-bold text-emerald-600">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </div>
                        {product.cost && product.price && (
                          <div className="text-[13px] text-gray-600 mt-0.5 font-semibold">
                            Margin {Math.round(((product.price - product.cost) / product.price) * 100)}%
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-center px-4 py-2.5">
                        {getStockBadge(product.quantity)}
                      </td>
                      <td className="whitespace-nowrap text-center px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="text-[#1F3A2E] hover:text-[#243d32] font-semibold transition-colors"
                            title="Edit product"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filteredAndSortedProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Image */}
                <Link to={`/products/${product.id}`} className="block relative">
                  <div className="aspect-square bg-gradient-to-br from-teal-50 to-cyan-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                    {product.frontImage ? (
                      <img 
                        src={product.frontImage} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiCube className="w-16 h-16 text-teal-200" />
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-5">
                  {/* Product Name */}
                  <Link to={`/products/${product.id}`}>
                    <h3 className="text-base font-bold text-gray-900 mb-1.5 hover:text-[#1F3A2E] transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Product Meta */}
                  <p className="text-xs text-gray-500 mb-3">
                    {product.type} · 22K · {product.designer?.name || 'No Designer'}
                  </p>

                  {/* Stock Status */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <span className="text-xs text-gray-600">
                      {product.quantity} pcs {product.quantity === 0 ? 'out of stock' : product.quantity <= 5 ? 'low stock' : 'in stock'}
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500">Selling Price</span>
                      <span className="text-base font-bold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</span>
                    </div>
                    {product.cost && product.price && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">Margin</span>
                        <span className="text-xs font-medium text-gray-600">{Math.round(((product.price - product.cost) / product.price) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <Link
                    to={`/products/${product.id}/edit`}
                    className="text-xs text-[#1F3A2E] hover:underline font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;


