import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

const SaleList = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [markingAsPaid, setMarkingAsPaid] = useState(null);
    const [paymentMode, setPaymentMode] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, searchTerm, filterPaymentStatus, filterStatus]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
            };

            if (filterPaymentStatus !== 'all') {
                params.paymentStatus = filterPaymentStatus;
            }

            if (filterStatus !== 'all') {
                params.status = filterStatus;
            }

            const response = await api.get('/sales', { params });
            setSales(response.data.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                totalPages: response.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice? Stock will be restored.')) {
            try {
                await api.delete(`/sales/${id}`);
                fetchSales();
                alert('Invoice deleted successfully');
            } catch (error) {
                console.error('Error deleting sale:', error);
                alert(error.response?.data?.message || 'Failed to delete invoice');
            }
        }
    };

    const handleMarkAsPaid = async (saleId, mode) => {
        try {
            await api.put(`/sales/${saleId}/payment-status`, {
                paymentStatus: 'paid',
                paymentMethod: mode,
                paidAt: new Date().toISOString()
            });
            setMarkingAsPaid(null);
            setPaymentMode('');
            fetchSales();
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment status');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            draft: 'text-gray-600',
            confirmed: 'text-[#1F3A2E]',
            shipped: 'text-purple-600',
            delivered: 'text-green-600',
            cancelled: 'text-red-600'
        };
        return statusClasses[status] || statusClasses.confirmed;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatIndianCurrency = (amount) => {
        const num = parseFloat(amount);
        return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    // Calculate stats
    const totalInvoices = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);
    const pendingPayment = sales.filter(s => s.paymentStatus === 'pending').length;
    const paidCount = sales.filter(s => s.paymentStatus === 'paid').length;

    return (
        <div className="bg-white relative">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 shadow-sm relative z-30">
                <div className="container mx-auto px-4 py-2">
                    {/* Top Row: Title, Search, Actions */}
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
                        </div>

                        {/* Centered Search Bar */}
                        <div className="flex-1 max-w-2xl mx-auto">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search invoices..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-all bg-gray-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/sales/invoices/new')}
                                className="px-4 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                            >
                                <FiPlus /> Create New Invoice
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between gap-4 mt-3">
                        {/* Filter Pills - Left */}
                        <div className="flex gap-2 items-center">
                            {/* Payment Status Pills */}
                            <button
                                onClick={() => { setFilterPaymentStatus('all'); setFilterStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterPaymentStatus === 'all' && filterStatus === 'all'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => { setFilterPaymentStatus('paid'); setFilterStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterPaymentStatus === 'paid'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Paid
                            </button>
                            <button
                                onClick={() => { setFilterPaymentStatus('pending'); setFilterStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterPaymentStatus === 'pending'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => { setFilterPaymentStatus('overdue'); setFilterStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterPaymentStatus === 'overdue'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Overdue
                            </button>

                            {/* Vertical Divider */}
                            <div className="h-6 border-l border-gray-300 mx-1"></div>

                            {/* Status Pills */}
                            <button
                                onClick={() => { setFilterStatus('confirmed'); setFilterPaymentStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterStatus === 'confirmed'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Confirmed
                            </button>
                            <button
                                onClick={() => { setFilterStatus('draft'); setFilterPaymentStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterStatus === 'draft'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Draft
                            </button>
                            <button
                                onClick={() => { setFilterStatus('cancelled'); setFilterPaymentStatus('all'); setPagination(p=>({...p,page:1})); }}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                                    filterStatus === 'cancelled'
                                        ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Cancelled
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Huge Stats Centered */}
            {!loading && sales.length > 0 && (
                <div className="flex items-center justify-center mt-6 mb-4 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">
                        {totalInvoices} invoices · {formatIndianCurrency(totalAmount)} total · {pendingPayment} pending payment · {paidCount} paid
                    </h2>
                </div>
            )}

            {/* Sales Table */}
            <div className="container mx-auto px-4 py-4 bg-white">
                {loading ? (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1F3A2E] mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Loading invoices...</p>
                        </div>
                    </div>
                ) : sales.length === 0 ? (
                    <p className="text-center text-[15px] font-medium text-gray-400 py-20">
                        No invoices found
                    </p>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Invoice No</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Date</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Customer</th>
                                        <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Items</th>
                                        <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Amount</th>
                                        <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">Payment</th>
                                        <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">Status</th>
                                        <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <Link
                                                    to={`/sales/invoices/${sale.id}`}
                                                    className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                                >
                                                    {sale.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2 text-sm font-semibold text-gray-500">
                                                {formatDate(sale.saleDate)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-sm font-semibold text-gray-900">{sale.customerName}</div>
                                                {sale.customerPhone && (
                                                    <div className="text-xs text-gray-500">{sale.customerPhone}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                                                {sale.items?.length || 0} Items
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                                {formatIndianCurrency(sale.totalAmount)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 text-sm font-semibold ${
                                                        sale.paymentStatus === 'paid' ? 'text-green-600' :
                                                        sale.paymentStatus === 'overdue' ? 'text-red-500' :
                                                        'text-yellow-600'
                                                    }`}>
                                                        {sale.paymentStatus === 'paid' ? 'Paid' :
                                                         sale.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                                                    </span>
                                                    {sale.paymentStatus === 'pending' && (
                                                        markingAsPaid === sale.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <select
                                                                    value={paymentMode}
                                                                    onChange={(e) => setPaymentMode(e.target.value)}
                                                                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                                                    autoFocus
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="cash">Cash</option>
                                                                    <option value="upi">UPI</option>
                                                                    <option value="card">Card</option>
                                                                    <option value="cheque">Cheque</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => handleMarkAsPaid(sale.id, paymentMode)}
                                                                    disabled={!paymentMode}
                                                                    className="text-xs text-[#1F3A2E] font-semibold hover:underline disabled:opacity-50"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setMarkingAsPaid(null);
                                                                        setPaymentMode('');
                                                                    }}
                                                                    className="text-xs text-gray-500 hover:underline"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setMarkingAsPaid(sale.id)}
                                                                className="text-xs text-[#1F3A2E] font-semibold hover:underline"
                                                            >
                                                                Mark as Paid
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 text-sm font-semibold rounded ${getStatusBadge(sale.status)}`}>
                                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="text-sm font-semibold text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-sm text-gray-600">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 bg-[#1F3A2E] text-white rounded-lg">
                                        {pagination.page}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
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

export default SaleList;
