import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';

function LowStockAlerts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingReorder, setAdjustingReorder] = useState(null);
  const [reorderValue, setReorderValue] = useState('');

  const fetchLowStockProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      
      // Filter products that are low stock or out of stock
      const lowStockProducts = response.data.filter(product => {
        const quantity = product.quantity || 0;
        const reorderLevel = product.reorderLevel || 10;
        return quantity <= reorderLevel;
      });

      // Sort by priority: out of stock first, then by days left (ascending)
      const sortedProducts = lowStockProducts.sort((a, b) => {
        const aQty = a.quantity || 0;
        const bQty = b.quantity || 0;
        
        // Out of stock items come first
        if (aQty === 0 && bQty !== 0) return -1;
        if (aQty !== 0 && bQty === 0) return 1;
        
        // Then sort by estimated days left
        const aDaysLeft = calculateDaysLeft(a);
        const bDaysLeft = calculateDaysLeft(b);
        return aDaysLeft - bDaysLeft;
      });

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStockProducts();
    // Log view activity
    api.post('/activities/log', {
        action: 'VIEW',
        entityType: 'INVENTORY',
        description: 'Viewed Low Stock Alerts'
    }).catch(err => console.error('Failed to log activity:', err));
  }, [fetchLowStockProducts]);

  const calculateDaysLeft = (product) => {
    const avgSalesPerDay = product.avgSalesPerDay || 0.5; // Default to 0.5 if not available
    const currentStock = product.quantity || 0;
    
    if (avgSalesPerDay === 0) return 999; // If no sales, return high number
    if (currentStock === 0) return 0;
    
    return Math.floor(currentStock / avgSalesPerDay);
  };

  const handleAdjustReorder = async (productId) => {
    if (!reorderValue || parseInt(reorderValue) < 0) {
      alert('Please enter a valid reorder level');
      return;
    }

    try {
      await api.put(`/products/${productId}`, {
        reorderLevel: parseInt(reorderValue)
      });

      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, reorderLevel: parseInt(reorderValue) }
          : p
      ));

      setAdjustingReorder(null);
      setReorderValue('');
      
      // Refresh the list to remove items that are no longer low stock
      fetchLowStockProducts();
    } catch (error) {
      console.error('Error adjusting reorder level:', error);
      alert('Failed to adjust reorder level. Please try again.');
    }
  };

  const handleNotify = (product) => {
    // This would typically send notifications to relevant stakeholders
    alert(`Notification sent for "${product.name}"\n\nCurrent stock: ${product.quantity || 0}\nReorder level: ${product.reorderLevel || 10}`);
  };

  const handleCreatePO = (product) => {
    const qty = Math.max((product.reorderLevel || 10) - (product.quantity || 0), 10);
    navigate(`/purchase-orders/new?product=${product.id}&qty=${qty}`);
  };

  const exportToCSV = () => {
    const headers = ['Priority', 'Product Name', 'Type', 'Current Stock', 'Reorder Level', 'Avg Sales/Day', 'Est. Days Left', 'Status'];
    const rows = products.map((product, index) => [
      index + 1,
      product.name,
      product.type,
      product.quantity || 0,
      product.reorderLevel || 10,
      product.avgSalesPerDay || 0.5,
      calculateDaysLeft(product),
      (product.quantity || 0) === 0 ? 'Out of Stock' : 'Low Stock'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate summary statistics
  const itemsBelowReorder = products.filter(p => (p.quantity || 0) > 0).length;
  const outOfStockItems = products.filter(p => (p.quantity || 0) === 0).length;
  const criticalItems = products.filter(p => calculateDaysLeft(p) <= 3).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading low stock alerts...</div>
        </div>
      </div>
    );
  }

  // Empty state - all stock levels healthy
  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-repeat"
          style={{
            backgroundImage: 'url(/99172127-vector-jewelry-pattern-jewelry-seamless-background.jpg)',
            backgroundSize: '400px 400px'
          }}
        />
        
        {/* Header */}
        <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitor products requiring immediate attention</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled
                className="px-3 py-1.5 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed"
              >
                Export Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Stock Levels Are Good</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No items are currently below their reorder thresholds. All inventory levels are healthy.
            </p>
            <Link
              to="/inventory/stock-levels"
              className="inline-block mt-4 px-4 py-2 text-xs bg-[#1F3A2E] text-white rounded hover:bg-[#243d32] transition-colors"
            >
              View All Stock Levels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url(/99172127-vector-jewelry-pattern-jewelry-seamless-background.jpg)',
          backgroundSize: '400px 400px'
        }}
      />
      
      {/* Header */}
      <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {products.length} {products.length === 1 ? 'item requires' : 'items require'} immediate attention
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/purchase-orders/new')}
              className="px-3 py-1.5 text-xs bg-[#1F3A2E] text-white rounded hover:bg-[#243d32] transition-colors"
            >
              Create Bulk PO
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Export Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Summary Cards */}
      <div className="relative bg-gray-50 dark:bg-gray-900 px-5 py-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded border-l-4 border-yellow-500 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Low Stock Items</div>
              <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mt-0.5">{itemsBelowReorder}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Below reorder threshold</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded border-l-4 border-red-500 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Stockout Items</div>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-0.5">{outOfStockItems}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Zero inventory - reorder now</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded border-l-4 border-orange-500 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Critical Items</div>
              <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-0.5">{criticalItems}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Will run out within 3 days</div>
          </div>
        </div>
      </div>

      {/* Priority Alert Table */}
      <div className="relative flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Product
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Type
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Current Stock
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Reorder Level
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Avg Sales/Day
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Est. Days Left
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product, index) => {
                const isOutOfStock = (product.quantity || 0) === 0;
                const daysLeft = calculateDaysLeft(product);
                const isCritical = daysLeft <= 3 && !isOutOfStock;

                return (
                  <tr
                    key={product.id}
                    className={`${
                      isOutOfStock
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : isCritical
                        ? 'border-l-4 border-orange-500'
                        : 'border-l-4 border-yellow-500'
                    } hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        isOutOfStock
                          ? 'bg-red-600 text-white'
                          : isCritical
                          ? 'bg-orange-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-xs font-medium text-[#1F3A2E] dark:text-teal-400 hover:underline"
                      >
                        {product.name}
                      </Link>
                      {isOutOfStock && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {product.type}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium ${
                        isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {product.quantity || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {adjustingReorder === product.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={reorderValue}
                            onChange={(e) => setReorderValue(e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAdjustReorder(product.id)}
                            className="text-xs text-[#1F3A2E] dark:text-teal-400 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingReorder(null);
                              setReorderValue('');
                            }}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.reorderLevel || 10}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                      {(product.avgSalesPerDay || 0.5).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium ${
                        isOutOfStock
                          ? 'text-red-600 dark:text-red-400'
                          : isCritical
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {isOutOfStock ? '0 days' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCreatePO(product)}
                          className="text-xs text-[#1F3A2E] dark:text-teal-400 hover:underline"
                        >
                          Create Purchase Order
                        </button>
                        <button
                          onClick={() => handleNotify(product)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Notify
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingReorder(product.id);
                            setReorderValue((product.reorderLevel || 10).toString());
                          }}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                          disabled={adjustingReorder === product.id}
                        >
                          Adjust Reorder Level
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="relative bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div>
            Showing {products.length} {products.length === 1 ? 'alert' : 'alerts'} sorted by priority
          </div>
          <Link
            to="/inventory/stock-levels"
            className="text-[#1F3A2E] dark:text-teal-400 hover:underline"
          >
            View All Stock Levels →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LowStockAlerts;
