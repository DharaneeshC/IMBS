import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiChevronDown, HiCheck, HiX, HiFilter } from 'react-icons/hi';
import api from '../../api/api';

function StockLevels() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [adjustingStock, setAdjustingStock] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterByStatus, setFilterByStatus] = useState(null);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);

  const categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Anklets', 'Pendants', 'Others'];

  useEffect(() => {
    fetchProducts();
    // Log view activity
    api.post('/activities/log', {
        action: 'VIEW',
        entityType: 'STOCK_LEVELS',
        description: 'Viewed Stock Levels'
    }).catch(err => console.error('Failed to log activity:', err));
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity, reorderLevel = 10) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= reorderLevel) return 'low-stock';
    return 'in-stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock': return 'text-red-700 font-bold';
      case 'low-stock': return 'text-[#854F0B] font-bold';
      case 'in-stock': return 'text-green-700 font-bold';
      default: return 'text-gray-700 font-bold';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return 'Low Stock';
      case 'in-stock': return 'In Stock';
      default: return 'Unknown';
    }
  };

  // Get category counts
  const getCategoryCount = (category) => {
    if (category === 'All') return products.length;
    return products.filter(p => p.type === category).length;
  };

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.id?.toString().includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || product.type === selectedCategory;
    
    // Apply status filter if active
    if (filterByStatus) {
      const status = getStockStatus(product.quantity, product.reorderLevel);
      if (filterByStatus !== status) return false;
    }
    
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Calculate summary statistics
  const activeItems = products.filter(p => p.quantity > 0).length;
  const totalPieces = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStockItems = products.filter(p => {
    const status = getStockStatus(p.quantity, p.reorderLevel);
    return status === 'low-stock';
  }).length;
  const outOfStockItems = products.filter(p => p.quantity === 0).length;

  // Get lowest and highest stock items
  const lowestStockItem = products.length > 0 ? products.reduce((min, p) => 
    (p.quantity || 0) < (min.quantity || 0) ? p : min
  ) : null;

  const highestStockItem = products.length > 0 ? products.reduce((max, p) => 
    (p.quantity || 0) > (max.quantity || 0) ? p : max
  ) : null;

  const mostRecentUpdate = products.length > 0 ? products.reduce((latest, p) => 
    new Date(p.updatedAt) > new Date(latest.updatedAt) ? p : latest
  ) : null;

  // Calculate reorder suggestions
  const reorderProducts = products.filter(p => (p.quantity || 0) <= (p.reorderLevel || 10));
  const calculateReorderQuantity = (product) => {
    const stockOnHand = product.quantity || 0;
    const reorderLevel = product.reorderLevel || 10;
    return (reorderLevel - stockOnHand) + reorderLevel;
  };

  const handleAdjustStock = async (productId) => {
    if (!adjustmentAmount || adjustmentAmount === '0') {
      alert('Please enter a valid adjustment amount');
      return;
    }

    try {
      const product = products.find(p => p.id === productId);
      const newQuantity = Math.max(0, (product.quantity || 0) + parseInt(adjustmentAmount));
      
      await api.put(`/products/${productId}`, {
        ...product,
        quantity: newQuantity
      });

      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, quantity: newQuantity }
          : p
      ));

      setAdjustingStock(null);
      setAdjustmentAmount('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock. Please try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Type', 'Item Code', 'Stock on Hand', 'Reorder Level', 'Status', 'Last Updated'];
    const rows = sortedProducts.map(product => [
      product.name,
      product.type,
      product.id,
      product.quantity || 0,
      product.reorderLevel || 10,
      getStatusLabel(getStockStatus(product.quantity, product.reorderLevel)),
      product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-levels-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1F3A2E] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading stock levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 relative">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm relative z-30">
        <div className="container mx-auto px-4 py-2">
          {/* Top Row: Title, Search, Actions */}
          <div className="flex items-center gap-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
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
                  placeholder={`Search in ${filterByStatus ? (filterByStatus === 'low-stock' ? 'Low Stock' : 'Out of Stock') : (selectedCategory === 'All' ? 'All Items' : selectedCategory)}...`}
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
                        setSelectedCategory('All');
                        setFilterByStatus(null);
                        setSearchScopeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                        selectedCategory === 'All' && !filterByStatus
                          ? 'bg-teal-50 text-teal-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>All Items ({products.length})</span>
                      {selectedCategory === 'All' && !filterByStatus && (
                        <HiCheck className="w-4 h-4" />
                      )}
                    </button>
                    {categories.filter(c => c !== 'All').map((category, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedCategory(category);
                          setFilterByStatus(null);
                          setSearchScopeOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                          selectedCategory === category 
                            ? 'bg-teal-50 text-teal-700 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{category} ({getCategoryCount(category)})</span>
                        {selectedCategory === category && (
                          <HiCheck className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                    
                    {/* Status Filters */}
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setFilterByStatus('low-stock');
                        setSelectedCategory('All');
                        setSearchScopeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                        filterByStatus === 'low-stock' 
                          ? 'bg-teal-50 text-teal-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>Low Stock ({lowStockItems})</span>
                      {filterByStatus === 'low-stock' && (
                        <HiCheck className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilterByStatus('out-of-stock');
                        setSelectedCategory('All');
                        setSearchScopeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                        filterByStatus === 'out-of-stock' 
                          ? 'bg-teal-50 text-teal-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>Out of Stock ({outOfStockItems})</span>
                      {filterByStatus === 'out-of-stock' && (
                        <HiCheck className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-all text-sm font-medium shadow-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Summary Line */}
          {products.length > 0 && (
            <div className="flex items-center justify-center mt-3">
              {/* Stats Summary - Center */}
              <div className="text-center">
                <p className="text-lg text-gray-900 font-bold">
                  {activeItems} active items · {totalPieces} pieces · {lowStockItems} low stock · {outOfStockItems} out of stock
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="text-base font-medium text-gray-900 dark:text-white mb-2">No inventory items found</div>
                <div className="text-xs mb-4">Start by adding jewellery items to track their stock levels and availability</div>
                <Link
                  to="/products/new"
                  className="inline-block px-4 py-2 text-xs bg-[#1F3A2E] text-white rounded hover:bg-[#243d32] transition-colors"
                >
                  Add Product
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th
                    className="px-3 py-2.5 text-left text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Product Name{getSortIndicator('name')}
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    Type{getSortIndicator('type')}
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    Item Code{getSortIndicator('id')}
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantity')}
                  >
                    Stock on Hand{getSortIndicator('quantity')}
                  </th>
                  <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">
                    Reorder Level
                  </th>
                  <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">
                    Last Updated
                  </th>
                  <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedProducts.map((product) => {
                  const status = getStockStatus(product.quantity, product.reorderLevel);
                  const formattedDate = product.updatedAt 
                    ? new Date(product.updatedAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      }).replace(/ /g, ' ')
                    : 'Never';
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-sm font-semibold text-[#1F3A2E] dark:text-teal-400 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {product.type}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        #{product.id}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {adjustingStock === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              value={adjustmentAmount}
                              onChange={(e) => setAdjustmentAmount(e.target.value)}
                              placeholder="+10 or -5"
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right font-semibold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAdjustStock(product.id)}
                              className="text-sm font-semibold text-[#1F3A2E] dark:text-teal-400 hover:underline"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingStock(null);
                                setAdjustmentAmount('');
                              }}
                              className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${
                            status === 'out-of-stock' ? 'text-red-600' :
                            status === 'low-stock' ? 'text-[#854F0B]' :
                            'text-gray-900 dark:text-gray-100'
                          }`}>
                            {product.quantity || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.reorderLevel || 10}</span>
                          <span className="text-[10px] text-gray-400">min: {product.reorderLevel || 10}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          {(status === 'low-stock' || status === 'out-of-stock') && (
                            <>
                              <span className="text-gray-400 text-sm">·</span>
                              <span className="text-sm font-semibold text-gray-600">
                                Reorder: {((product.reorderLevel || 10) - (product.quantity || 0)) + (product.reorderLevel || 10)}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {formattedDate}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setAdjustingStock(product.id)}
                          className="text-sm font-semibold text-gray-700 hover:text-[#1F3A2E] transition-colors"
                          disabled={adjustingStock === product.id}
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Section: Two-Column Layout */}
      {products.length > 0 && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white border-t border-gray-200 pt-4">
            <div className="flex items-start gap-0">
              {/* Left Column (65%): Reorder Suggestions */}
              <div className="w-[65%] pr-6">
                {reorderProducts.length > 0 && (
                  <>
                    <h3 className="text-[13px] font-medium text-gray-900 mb-3">Reorder Suggestions</h3>
                    
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-bold text-gray-900">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                            Stock on Hand
                          </th>
                          <th className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                            Reorder Level
                          </th>
                          <th className="px-3 py-2 text-center text-sm font-bold text-gray-900">
                            Suggested Order
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reorderProducts.map((product) => {
                          const suggestedQuantity = calculateReorderQuantity(product);
                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <Link
                                  to={`/products/${product.id}`}
                                  className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                >
                                  {product.name}
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                                {product.quantity || 0}
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                                {product.reorderLevel || 10}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-block px-2 py-1 text-sm font-semibold text-white bg-[#1a2e1a] rounded-sm">
                                  Order {suggestedQuantity} pcs
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Right Column (35%): Stock Health Summary */}
              <div className="w-[35%] border-l border-gray-200 pl-6">
                {/* Lowest Stock Item */}
                <div className="py-3">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Lowest Stock</div>
                  {lowestStockItem && (
                    <div className="space-y-0.5">
                      <div className="text-[13px] text-gray-900 font-medium truncate">{lowestStockItem.name}</div>
                      <div className="text-[11px] text-red-600">
                        Only {lowestStockItem.quantity || 0} {lowestStockItem.quantity === 1 ? 'piece' : 'pieces'} remaining
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Highest Stock Item */}
                <div className="py-3">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Highest Stock</div>
                  {highestStockItem && (
                    <div className="space-y-0.5">
                      <div className="text-[13px] text-gray-900 font-medium truncate">{highestStockItem.name}</div>
                      <div className="text-[11px] text-green-600">
                        {highestStockItem.quantity || 0} {highestStockItem.quantity === 1 ? 'piece' : 'pieces'} in stock
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Last Stock Update */}
                <div className="py-3">
                  <div className="text-[11px] font-medium text-gray-500 mb-1">Recent Update</div>
                  {mostRecentUpdate && (
                    <div className="space-y-0.5">
                      <div className="text-[13px] text-gray-900 font-medium truncate">{mostRecentUpdate.name}</div>
                      <div className="text-[11px] text-gray-600">
                        Updated {new Date(mostRecentUpdate.updatedAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        }).replace(/ /g, ' ')} at {new Date(mostRecentUpdate.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockLevels;
