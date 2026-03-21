import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { FiDownload, FiFilter } from 'react-icons/fi';

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState({
        top_customers: [],
        profit_analysis: [],
        fast_moving: [],
        slow_moving: [],
        dead_stock: []
    });
    
    // Filter State
    const [activeTab, setActiveTab] = useState('top_customers');
    const [period, setPeriod] = useState(30);
    const [limit, setLimit] = useState(20);

    const periods = [
        { label: 'Last 7 Days', value: 7 },
        { label: 'Last 30 Days', value: 30 },
        { label: 'Last 90 Days', value: 90 },
        { label: 'This Year', value: 365 },
    ];

    const tabs = [
        { id: 'top_customers', label: 'Top Customers' },
        { id: 'profit_analysis', label: 'Product Profit' },
        { id: 'fast_moving', label: 'Fast Moving' },
        { id: 'slow_moving', label: 'Slow Moving' },
        { id: 'dead_stock', label: 'Dead Stock' },
    ];

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, limit]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reports/business?days=${period}&limit=${limit}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => '₹' + parseFloat(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const exportCSV = () => {
        const rows = [];
        
        // Export only the currently active tab's data
        if (activeTab === 'top_customers') {
             rows.push(['Rank', 'Customer', 'Phone', 'Invoices', 'Total Spent', 'Last Purchase']);
             reportData.top_customers.forEach((item, index) => {
                 rows.push([index + 1, `"${item.customerName}"`, `"${item.customerPhone}"`, item.invoiceCount, item.totalSpent, formatDate(item.lastPurchase)]);
             });
        } else if (activeTab === 'profit_analysis') {
            rows.push(['Product', 'Category', 'Cost', 'Selling Price', 'Margin %', 'Units Sold', 'Total Profit']);
            reportData.profit_analysis.forEach(item => {
                rows.push([`"${item.productName}"`, item.category, item.cost, item.sellingPrice, item.margin, item.unitsSold, item.totalProfit]);
            });
        } else if (activeTab === 'fast_moving') {
            rows.push(['Product', 'Category', 'Units Sold', 'Revenue', 'Stock Remaining', 'Days of Stock Left']);
            reportData.fast_moving.forEach(item => {
                rows.push([`"${item.productName}"`, item.category, item.unitsSold, item.revenue, item.stockRemaining, item.daysStockLeft]);
            });
        } else if (activeTab === 'slow_moving') {
            rows.push(['Product', 'Category', 'Stock', 'Last Sold', 'Days Since Last Sale', 'Selling Price']);
            reportData.slow_moving.forEach(item => {
                rows.push([`"${item.productName}"`, item.category, item.stock, formatDate(item.lastSold), item.daysSinceLastSale, item.sellingPrice]);
            });
        } else if (activeTab === 'dead_stock') {
            rows.push(['Product', 'Category', 'Stock', 'Stock Value', 'In Inventory Since']);
            reportData.dead_stock.forEach(item => {
                rows.push([`"${item.productName}"`, item.category, item.stock, item.stockValue, formatDate(item.inInventorySince)]);
            });
        }

        const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Log export activity
        api.post('/activities/log', {
            action: 'EXPORT_CSV',
            entityType: 'REPORT',
            description: `Exported ${activeTab.replace('_', ' ')} report`
        }).catch(err => console.error('Failed to log export activity:', err));
    };

    // const TabButton = ({ id, label }) => (
    //     <button
    //         onClick={() => setActiveTab(id)}
    //         className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
    //             activeTab === id
    //                 ? 'border-[#1F3A2E] text-[#1F3A2E] bg-gray-50'
    //                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    //         }`}
    //     >
    //         {label}
    //     </button>
    // );

    const renderContent = () => {
        const currentData = reportData[activeTab] || [];

        if (loading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A2E]"></div>
                </div>
            );
        }

        if (currentData.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">
                        <FiFilter className="w-8 h-8 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">No data available</h3>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting the date range or limit.</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        {activeTab === 'top_customers' && (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoices</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Purchase</th>
                            </tr>
                        )}
                        {activeTab === 'profit_analysis' && (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost (Est.)</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Selling Price</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Units Sold</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Profit</th>
                            </tr>
                        )}
                        {activeTab === 'fast_moving' && (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Units Sold</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Rem.</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
                            </tr>
                        )}
                        {activeTab === 'slow_moving' && (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sold</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Since Sale</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                            </tr>
                        )}
                        {activeTab === 'dead_stock' && (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Value</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">In Inventory Since</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {activeTab === 'top_customers' && currentData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">#{idx + 1}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.customerName}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{item.customerPhone}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.invoiceCount}</td>
                                <td className="px-6 py-3 text-sm text-[#1F3A2E] font-bold text-right">{formatCurrency(item.totalSpent)}</td>
                                <td className="px-6 py-3 text-sm text-gray-500 text-right">{formatDate(item.lastPurchase)}</td>
                            </tr>
                        ))}
                        {activeTab === 'profit_analysis' && currentData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{item.category}</td>
                                <td className="px-6 py-3 text-sm text-gray-500 text-right">{formatCurrency(item.cost)}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.sellingPrice)}</td>
                                <td className={`px-6 py-3 text-sm font-medium text-right ${parseFloat(item.margin) > 20 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {item.margin}%
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.unitsSold}</td>
                                <td className="px-6 py-3 text-sm text-[#1F3A2E] font-bold text-right">{formatCurrency(item.totalProfit)}</td>
                            </tr>
                        ))}
                        {activeTab === 'fast_moving' && currentData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{item.category}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.unitsSold}</td>
                                <td className="px-6 py-3 text-sm text-[#1F3A2E] font-medium text-right">{formatCurrency(item.revenue)}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.stockRemaining}</td>
                                <td className={`px-6 py-3 text-sm font-medium text-center ${item.daysStockLeft < 7 ? 'text-red-600' : 'text-green-600'}`}>
                                    {item.daysStockLeft} days
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'slow_moving' && currentData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{item.category}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.stock}</td>
                                <td className="px-6 py-3 text-sm text-gray-500 text-right">{formatDate(item.lastSold)}</td>
                                <td className={`px-6 py-3 text-sm font-medium text-center ${item.daysSinceLastSale > 90 ? 'text-red-600' : 'text-amber-600'}`}>
                                    {item.daysSinceLastSale} days
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.sellingPrice)}</td>
                            </tr>
                        ))}
                        {activeTab === 'dead_stock' && currentData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{item.category}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-center">{item.stock}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.stockValue)}</td>
                                <td className="px-6 py-3 text-sm text-gray-500 text-right">{formatDate(item.inInventorySince)}</td>
                                <td className="px-6 py-3 text-sm text-right">
                                    <button
                                        onClick={() => navigate(`/purchase-orders/new?product=${item.id}&qty=10`)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                                    >
                                        Create PO
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>  
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select 
                                    value={period}
                                    onChange={(e) => setPeriod(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-[#1F3A2E] focus:ring-1 focus:ring-[#1F3A2E] cursor-pointer shadow-sm hover:bg-gray-50"
                                >
                                    {periods.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                onClick={exportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1F3A2E] text-white text-sm font-medium rounded-lg hover:bg-[#243d32] transition-colors shadow-sm"
                            >
                                <FiDownload className="w-4 h-4" /> Export Report
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto gap-6 border-b border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-[#1F3A2E] text-[#1F3A2E]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                             {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        
                        <div className="flex items-center gap-2 relative">
                             <span className="text-sm text-gray-500">Show:</span>
                             <div className="relative">
                                 <select 
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="appearance-none text-sm border border-gray-200 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:border-[#1F3A2E] bg-white cursor-pointer shadow-sm"
                                >
                                    <option value="10">10 results</option>
                                    <option value="20">20 results</option>
                                    <option value="50">50 results</option>
                                    <option value="100">100 results</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Reports;