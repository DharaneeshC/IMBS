import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

const PurchaseOrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, searchTerm, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
            };
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get('/purchase-orders', { params });
            setOrders(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                totalPages: response.data.pagination?.totalPages || 0
            }));
            setError(null);
        } catch (err) {
            console.error('Error fetching purchase orders:', err);
            setError('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-600',
            sent: 'bg-amber-100 text-amber-800',
            partial: 'bg-blue-100 text-blue-800',
            received: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-700'
        };
        // Normalize status
        let s = status?.toLowerCase() || 'draft';
        if (s === 'pending') s = 'sent';
        if (s === 'approved') s = 'sent';
        return (
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${styles[s] || styles.draft}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
        );
    };

    const formatIndianCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const FilterPill = ({ label, value, current, onClick }) => (
        <button
            onClick={() => onClick(value)}
            className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                current === value
                    ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
        >
            {label}
        </button>
    );

    // Dynamic stats
    const pendingOrders = orders.filter(o => o.status === 'sent' || o.status === 'pending' || o.status === 'approved');
    const pendingCount = pendingOrders.length;
    const totalCommitted = pendingOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
    const receivedCount = orders.filter(o => o.status === 'received').length;

    return (
        <div className="bg-white min-h-screen">
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 py-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                        
                        <div className="flex-1 max-w-2xl mx-auto">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search purchase orders..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPagination(p => ({ ...p, page: 1 }));
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <Link
                            to="/purchase-orders/new"
                            className="px-4 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                        >
                            <FiPlus /> Add Purchase Order
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <FilterPill label="All" value="all" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                        <FilterPill label="Draft" value="draft" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                        <FilterPill label="Sent" value="sent" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                        <FilterPill label="Received" value="received" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                        <FilterPill label="Partial" value="partial" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                        <FilterPill label="Cancelled" value="cancelled" current={statusFilter} onClick={v => { setStatusFilter(v); setPagination(p=>({...p,page:1})); }} />
                    </div>
                </div>
            </div>

            <div className="px-4 mt-4 mb-2">
                {!loading && orders.length > 0 && (
                    <p className="text-sm text-gray-500 font-medium">
                        {pagination.total} orders · {pendingCount} pending · {formatIndianCurrency(totalCommitted)} total committed · {receivedCount} received
                    </p>
                )}
            </div>

            <div className="px-4 pb-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-[13px] mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A2E]"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="mt-8 text-center text-[13px] text-gray-400">
                        No purchase orders yet — create your first order
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">PO Number</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Designer</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                    <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">Items</th>
                                    <th className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">Total Amount</th>
                                    <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <Link to={`/purchase-orders/${order.id}`} className="text-sm font-semibold text-[#1F3A2E] hover:underline">
                                                {order.poNumber}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="text-[13px] font-medium text-gray-900">
                                                {order.designer?.companyName || 'Unknown Designer'}
                                            </div>
                                            <div className="text-[11px] text-gray-500">
                                                {order.designer?.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {formatDate(order.orderDate)}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-600">
                                            {order.items?.length || 0}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                                            {formatIndianCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Link to={`/purchase-orders/${order.id}`} className="text-sm font-medium text-[#1F3A2E] hover:underline">
                                                View
                                            </Link>
                                            <span className="mx-2 text-gray-300">·</span>
                                            <Link to={`/purchase-orders/${order.id}/edit`} className="text-sm font-medium text-gray-500 hover:text-gray-900 hover:underline">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 text-sm border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 text-sm border border-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrderList;
