import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { HiDotsHorizontal } from 'react-icons/hi';

const DesignerShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [designer, setDesigner] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    bankAccount: false,
    recordInfo: false,
    timeline: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchDesigner();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDesigner = async () => {
    try {
      const response = await api.get(`/designers/${id}`);
      setDesigner(response.data.designer);
      setProducts(response.data.products);
      setLoading(false);
    } catch (err) {
      setError('Failed to load designer');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure? This will also delete all products by this designer.')) {
      try {
        await api.delete(`/designers/${id}`);
        navigate('/designers');
      } catch (err) {
        alert('Failed to delete designer');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1F3A2E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading designer...</p>
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

  if (!designer) return null;

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'comments', name: 'Comments' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'mails', name: 'Mails' },
    { id: 'statement', name: 'Statement' }
  ];

  const activities = [
    {
      id: 1,
      title: 'Contact person added',
      description: `Contact person ${designer.name} has been created`,
      user: 'Dharaneesh C',
      date: designer.createdAt
    },
    {
      id: 2,
      title: 'Contact added',
      description: 'Contact created',
      user: 'Dharaneesh C',
      date: designer.createdAt
    }
  ];

  const totalStockValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0 flex items-center gap-4">
              {designer.image ? (
                <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                  <img src={designer.image} alt={designer.companyName || designer.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 text-[#1F3A2E] flex items-center justify-center text-2xl font-black shadow-sm border border-teal-100 flex-shrink-0">
                  {(designer.companyName || designer.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {designer.companyName || designer.displayName || designer.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Designer Profile & Product Portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 relative">
              <Link 
                to="/designers" 
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Designers
              </Link>
              <Link 
                to={`/designers/${id}/edit`} 
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1F3A2E] rounded hover:bg-[#243d32] transition-colors"
              >
                Edit Designer
              </Link>
              
              {/* Overflow Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                  className="p-1.5 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiDotsHorizontal className="w-5 h-5" />
                </button>
                
                {showOptionsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      New Bill
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                      New Purchase Order
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete Designer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[13px] transition-colors border-b-2 font-normal ${
                  activeTab === tab.id
                    ? 'border-[#1F3A2E] text-[#1F3A2E] dark:text-teal-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          
          {/* Consolidated Overview Info Strip */}
          {activeTab === 'overview' && (
            <div className="mt-3">
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                Portal: <span className="text-gray-900 dark:text-white">Disabled</span> · Language: <span className="text-gray-900 dark:text-white">English</span> · Payment: <span className="text-gray-900 dark:text-white">Due on Receipt</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Metadata) */}
            <div className="space-y-6">
              
              {/* Contact Persons - Plain text rows */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Contact Persons</h3>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[#1F3A2E] text-xs font-bold flex-shrink-0">
                    {designer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{designer.name}</p>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate">{designer.email}</p>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">{designer.phone || 'No phone'}</p>
                    <button className="mt-1 text-xs text-[#1F3A2E] dark:text-teal-400 font-medium hover:underline">Invite to Portal</button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Address - Side by Side Plain Text */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Address</h3>
                <div className="flex items-start gap-4">
                  {/* Billing */}
                  <div className="flex-1">
                    <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1.5">Billing Address</h4>
                    {designer.street || designer.city || designer.state ? (
                      <div className="text-[13px] text-gray-600 dark:text-gray-400 space-y-0.5 leading-relaxed">
                        {designer.street && <p>{designer.street}</p>}
                        {designer.city && <p>{designer.city}</p>}
                        {designer.state && <p>{designer.state} {designer.pincode}</p>}
                        {designer.country && <p>{designer.country}</p>}
                      </div>
                    ) : (
                      <p className="text-[13px] text-gray-500">
                        No Address - <button className="text-[#1F3A2E] hover:underline">Add</button>
                      </p>
                    )}
                  </div>
                  {/* Shipping */}
                  <div className="flex-1">
                    <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1.5">Shipping Address</h4>
                    <p className="text-[13px] text-gray-500">
                      No Address - <button className="text-[#1F3A2E] hover:underline">Add</button>
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Bank Account Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bank account details</h3>
                  <div className="flex items-center gap-2">
                    <button className="text-[#1F3A2E] dark:text-teal-400 hover:text-teal-600 text-[13px] font-medium">+</button>
                    <button onClick={() => toggleSection('bankAccount')} className="text-gray-400 text-xs hover:text-gray-600">
                      {expandedSections.bankAccount ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                {expandedSections.bankAccount && (
                  <p className="text-[13px] text-gray-500 py-1">No bank account added yet</p>
                )}
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Record Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Record info</h3>
                  <button onClick={() => toggleSection('recordInfo')} className="text-gray-400 text-xs hover:text-gray-600">
                    {expandedSections.recordInfo ? '▲' : '▼'}
                  </button>
                </div>
                {expandedSections.recordInfo && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-gray-500">Created By</p>
                      <p className="text-[13px] font-medium text-gray-900">System Admin</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-gray-500">Created On</p>
                      <p className="text-[13px] font-medium text-gray-900">
                        {new Date(designer.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</h3>
                  <button onClick={() => toggleSection('timeline')} className="text-gray-400 text-xs hover:text-gray-600">
                    {expandedSections.timeline ? '▲' : '▼'}
                  </button>
                </div>
                {expandedSections.timeline && (
                  <div className="space-y-2">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3 px-1">
                        <div className="flex flex-col items-end w-20 flex-shrink-0">
                          <span className="text-[12px] text-gray-500">{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="text-[11px] text-gray-400">{new Date(activity.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex flex-col items-center flex-shrink-0 relative">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 z-10"></div>
                          {index < activities.length - 1 && (
                            <div className="absolute top-3 w-px h-full bg-gray-200 -z-0"></div>
                          )}
                        </div>
                        <div className="pb-3 flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 tracking-tight">{activity.title}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5 truncate">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Middle/Right Content (Tables) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payables */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Payables</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-5 py-3 text-left text-[13px] font-normal text-gray-600">Currency</th>
                      <th className="px-5 py-3 text-right text-[13px] font-normal text-gray-600">Outstanding payables</th>
                      <th className="px-5 py-3 text-right text-[13px] font-normal text-gray-600">Unused credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-5 py-3 text-[13px] text-gray-900">INR - Indian Rupee</td>
                      <td className="px-5 py-3 text-[13px] text-right font-medium text-gray-900">₹0.00</td>
                      <td className="px-5 py-3 text-[13px] text-right font-medium text-gray-900">₹0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Products by Designer */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Products by {designer.companyName || designer.displayName || designer.name}
                  </h3>
                  <Link 
                    to="/products/new" 
                    className="text-[13px] font-medium text-[#1F3A2E] hover:underline"
                  >
                    + Add Product
                  </Link>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[13px] text-gray-500 mb-3">No products by this designer yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-5 py-3 text-left text-[13px] font-medium text-gray-600">Name</th>
                          <th className="px-5 py-3 text-left text-[13px] font-medium text-gray-600">Type</th>
                          <th className="px-5 py-3 text-center text-[13px] font-medium text-gray-600">Qty</th>
                          <th className="px-5 py-3 text-right text-[13px] font-medium text-gray-600">Cost</th>
                          <th className="px-5 py-3 text-right text-[13px] font-medium text-gray-600">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 whitespace-nowrap">
                              <Link 
                                to={`/products/${product.id}`}
                                className="text-[14px] font-semibold text-gray-900 hover:text-[#1F3A2E] transition-colors"
                              >
                                {product.name}
                              </Link>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600 border-none">
                              {product.type}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-center text-[14px] font-medium text-gray-900">
                              {product.quantity}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-right text-[14px] text-gray-600">
                              ₹{product.cost?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-right text-[14px] font-bold text-[#1F3A2E]">
                              ₹{product.price?.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="4" className="px-5 py-3 text-right text-[13px] font-bold text-gray-600">Total stock value:</td>
                          <td className="px-5 py-3 text-right text-[15px] font-bold text-[#1F3A2E]">
                            ₹{totalStockValue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty States for other tabs */}
        {activeTab !== 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No data available</h3>
            <p className="text-sm text-gray-500">Records for {activeTab} will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerShow;
