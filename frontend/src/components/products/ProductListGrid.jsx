import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useFilter } from '../../contexts/FilterContext';
import { HiPlus, HiPencil } from 'react-icons/hi';

const ProductListGrid = () => {
  const { getFilteredProducts, isFilterApplied } = useFilter();
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchTypes();
  }, []);

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const getStockBadge = (quantity) => {
    if (quantity <= 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Out of Stock</span>;
    } else if (quantity <= 5) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Low Stock</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">In Stock</span>;
  };

  const filteredProducts = (() => {
    // First apply global filters from FilterContext
    let filtered = getFilteredProducts(products);
    
    // Then apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Jewellery Inventory</h1>
              <p className="text-gray-600 text-sm">Manage stock, pricing, and availability</p>
            </div>
            <Link 
              to="/products/new" 
              className="btn-primary inline-flex items-center justify-center"
            >
              <HiPlus className="w-5 h-5 mr-2" />
              Add New Product
            </Link>
          </div>

          {/* Filter Section */}
          {types.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Browse by Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedType === 'all'
                      ? 'bg-gold-500 text-white shadow-gold'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  All Items ({products.length})
                </button>
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedType === type
                        ? 'bg-gold-500 text-white shadow-gold'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {type} ({products.filter(p => p.type === type).length})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Items Found</h3>
            <p className="text-gray-500 mb-6">
              {selectedType === 'all' 
                ? "Start by adding your first item to inventory"
                : `No items found in "${selectedType}" category`
              }
            </p>
            <Link to="/products/new" className="inline-flex items-center px-6 py-3 bg-[#1a1d2e] text-white font-medium rounded-lg hover:bg-[#2a2e42] transition-colors">
              <HiPlus className="w-5 h-5 mr-2" />
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="card group animate-fade-in"
                style={{animationDelay: `${index * 50}ms`}}
              >
                {/* Product Image */}
                <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img 
                      src={product.frontImage || 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Stock Badge Overlay */}
                  <div className="absolute top-4 right-4">
                    {getStockBadge(product.quantity)}
                  </div>

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white font-semibold text-lg">View Details</span>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-5">
                  {/* Product Name */}
                  <Link to={`/products/${product.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-gold-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Category Badge */}
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-3">
                    {product.type}
                  </span>

                  {/* Stock on Hand - Emphasized */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Stock on Hand</span>
                      <span className={`text-xl font-bold ${
                        product.quantity === 0 ? 'text-red-600' :
                        product.quantity <= 5 ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {product.quantity.toFixed(2)} cm
                      </span>
                    </div>
                  </div>

                  {/* Pricing - Simplified */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-gray-500">Selling Price</span>
                      <span className="text-lg font-bold text-[#1F3A2E]">₹{product.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500">Cost Price</span>
                      <span className="text-sm font-semibold text-gray-700">₹{product.cost?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/products/${product.id}`}
                      className="flex-1 bg-[#1a1d2e] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#2a2e42] transition-colors text-center text-sm"
                    >
                      View Details
                    </Link>
                    <Link 
                      to={`/products/${product.id}/edit`}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                      title="Edit"
                    >
                      <HiPencil className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListGrid;


