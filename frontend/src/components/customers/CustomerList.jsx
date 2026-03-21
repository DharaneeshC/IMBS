import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, searchTerm, filterType, filterStatus]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
            };
            if (filterType !== 'all') params.customerType = filterType;
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await api.get('/customers', { params });
            setCustomers(response.data.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                totalPages: response.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getStatusBadge = (status) => {
        const map = {
            active: 'text-green-600',
            inactive: 'text-gray-500',
            blocked: 'text-red-600',
        };
        return map[status] || map.active;
    };

    const getTypeBadge = (type) => {
        const map = {
            regular: 'text-blue-600',
            wholesale: 'text-purple-600',
            vip: 'text-amber-600',
            other: 'text-gray-500',
        };
        return map[type] || map.regular;
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

    // Derived stats from current page data
    const activeCount = customers.filter(c => c.status === 'active').length;
    const vipCount = customers.filter(c => c.customerType === 'vip').length;
    const totalPurchases = customers.reduce((sum, c) => {
        return sum + (c.sales || []).reduce((s, sale) => s + parseFloat(sale.totalAmount || 0), 0);
    }, 0);

    // Per-customer computed values
    const getCustomerTotalPurchases = (c) =>
        (c.sales || []).reduce((s, sale) => s + parseFloat(sale.totalAmount || 0), 0);

    const getCustomerLastPurchase = (c) => {
        const dates = (c.sales || []).map(s => new Date(s.saleDate)).filter(Boolean);
        if (!dates.length) return null;
        return new Date(Math.max(...dates));
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

    return (
        <div className="bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 py-2">
                    {/* Top row */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

                        {/* Search */}
                        <div className="flex-1 max-w-2xl mx-auto">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, page:1})); }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-all bg-gray-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/customers/new')}
                            className="px-4 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                        >
                            <FiPlus /> Add New Customer
                        </button>
                    </div>

                    {/* Filter pills + stats row */}
                    <div className="flex items-center justify-between gap-4 mt-3">
                        <div className="flex gap-2 items-center flex-wrap">
                            {/* Type pills */}
                            <FilterPill label="All" value="all" current={filterType} onClick={v => { setFilterType(v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="Regular" value="regular" current={filterType} onClick={v => { setFilterType(v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="Wholesale" value="wholesale" current={filterType} onClick={v => { setFilterType(v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="VIP" value="vip" current={filterType} onClick={v => { setFilterType(v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="Other" value="other" current={filterType} onClick={v => { setFilterType(v); setPagination(p=>({...p,page:1})); }} />

                            <div className="h-4 border-l border-gray-300 mx-2" />

                            {/* Status pills */}
                            <FilterPill label="Active" value="active" current={filterStatus} onClick={v => { setFilterStatus(prev => prev === v ? 'all' : v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="Inactive" value="inactive" current={filterStatus} onClick={v => { setFilterStatus(prev => prev === v ? 'all' : v); setPagination(p=>({...p,page:1})); }} />
                            <FilterPill label="Blocked" value="blocked" current={filterStatus} onClick={v => { setFilterStatus(prev => prev === v ? 'all' : v); setPagination(p=>({...p,page:1})); }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Subtitle - Large and Centered */}
            <div className="flex items-center justify-center mt-6 mb-4">
                {!loading && customers.length > 0 && (
                    <h2 className="text-2xl font-bold text-gray-900 text-center">
                        {pagination.total} customers · {activeCount} active · {vipCount} VIP · {formatIndianCurrency(totalPurchases)} total purchases
                    </h2>
                )}
            </div>

            {/* Table */}
            <div className="px-4 pb-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3A2E] mx-auto" />
                            <p className="mt-3 text-sm text-gray-500">Loading customers...</p>
                        </div>
                    </div>
                ) : customers.length === 0 ? (
                    <p className="text-[13px] text-gray-500 mt-6">
                        No customers yet — add your first customer
                    </p>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Name</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Phone</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Email</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Type</th>
                                        <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Total Purchases</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Last Purchase</th>
                                        <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">Status</th>
                                        <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {customers.map((customer) => {
                                        const fullName = customer.fullName || '—';
                                        const totalAmt = getCustomerTotalPurchases(customer);
                                        const lastDate = getCustomerLastPurchase(customer);
                                        return (
                                            <tr key={customer.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <Link
                                                        to={`/customers/${customer.id}`}
                                                        className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                                    >
                                                        {fullName}
                                                    </Link>
                                                    {customer.company && (
                                                        <div className="text-xs text-gray-400">{customer.company}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-700">{customer.phone || '—'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{customer.email || '—'}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getTypeBadge(customer.customerType)}`}>
                                                        {customer.customerType ? customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                                    {formatIndianCurrency(totalAmt)}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {lastDate ? formatDate(lastDate) : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(customer.status)}`}>
                                                        {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Link
                                                        to={`/customers/${customer.id}`}
                                                        className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                    <span className="mx-1 text-gray-300">·</span>
                                                    <Link
                                                        to={`/customers/${customer.id}/edit`}
                                                        className="text-sm font-semibold text-gray-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-sm text-gray-600">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 bg-[#1F3A2E] text-white rounded-lg text-sm">
                                        {pagination.page}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerList;
