import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';

const CustomerShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Notes
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Mark as paid state
    const [markingAsPaid, setMarkingAsPaid] = useState(null);
    const [paymentMode, setPaymentMode] = useState('');

    useEffect(() => {
        fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/customers/${id}`);
            setCustomer(response.data.data);
        } catch (err) {
            setError('Failed to load customer');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await api.delete(`/customers/${id}`);
                navigate('/customers');
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete customer');
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
            // Refresh customer data to update invoice list
            fetchCustomer();
        } catch (err) {
            alert('Failed to update payment status');
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            const existingNotes = customer.notes || '';
            const timestamp = new Date().toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const newNote = `[${timestamp}] ${noteText.trim()}`;
            const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
            await api.put(`/customers/${id}`, { notes: updatedNotes });
            setNoteText('');
            fetchCustomer();
        } catch (err) {
            alert('Failed to save note');
        } finally {
            setSavingNote(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatIndianCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    const getTypeBadge = (type) => {
        const map = {
            regular: 'bg-blue-50 text-blue-700 border border-blue-200',
            wholesale: 'bg-purple-50 text-purple-700 border border-purple-200',
            vip: 'bg-amber-50 text-amber-700 border border-amber-200',
            other: 'bg-gray-50 text-gray-600 border border-gray-200',
        };
        return map[type] || map.regular;
    };

    const getPaymentBadge = (status) => {
        const map = {
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            overdue: 'bg-red-100 text-red-800',
        };
        return map[status] || map.pending;
    };

    const getStatusBadge = (status) => {
        const map = {
            draft: 'bg-gray-100 text-gray-800',
            confirmed: 'bg-blue-100 text-blue-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return map[status] || map.confirmed;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3A2E] mx-auto" />
                    <p className="mt-4 text-sm text-gray-500">Loading customer...</p>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-700">{error || 'Customer not found'}</p>
                    <Link to="/customers" className="mt-4 inline-block text-sm text-[#1F3A2E] hover:underline">
                        ← Back to Customers
                    </Link>
                </div>
            </div>
        );
    }

    const fullName = customer.fullName || '—';
    const sales = customer.sales || [];

    // Stats
    const totalPurchasesAmt = sales.reduce((s, sale) => s + parseFloat(sale.totalAmount || 0), 0);
    const invoiceCount = sales.length;
    const lastPurchaseDate = sales.length
        ? formatDate(sales.reduce((latest, s) => new Date(s.saleDate) > new Date(latest) ? s.saleDate : latest, sales[0].saleDate))
        : '—';

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'notes', label: 'Notes' },
    ];

    // Parse notes into entries
    const noteEntries = customer.notes
        ? customer.notes.split('\n').filter(Boolean).reverse()
        : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-6 py-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/customers"
                                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                ← Back to Customers
                            </Link>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Link
                                to={`/customers/${id}/edit`}
                                className="font-semibold text-[#1F3A2E] hover:underline"
                            >
                                Edit
                            </Link>
                            <span className="text-gray-300">·</span>
                            <button
                                onClick={handleDelete}
                                className="font-semibold text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Name + badge */}
                    <div className="flex items-center gap-3 mt-2">
                        <h1 className="text-[20px] font-medium text-gray-900">{fullName}</h1>
                        {customer.customerType && (
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded ${getTypeBadge(customer.customerType)}`}>
                                {customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1)}
                            </span>
                        )}
                    </div>

                    {/* Info strip */}
                    <p className="text-[13px] text-gray-500 mt-1">
                        {customer.phone && <><span className="text-gray-700">Phone:</span> {customer.phone}</>}
                        {customer.email && <> · <span className="text-gray-700">Email:</span> {customer.email}</>}
                        {customer.createdAt && <> · <span className="text-gray-700">Since:</span> {formatDate(customer.createdAt)}</>}
                    </p>

                    {/* Tabs */}
                    <div className="flex items-center gap-0 mt-4 border-b border-gray-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 text-[13px] transition-colors border-b-2 font-normal ${
                                    activeTab === tab.id
                                        ? 'border-[#1F3A2E] text-[#1F3A2E]'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-6">

                {/* ─── OVERVIEW TAB ─── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats row */}
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total Purchases</p>
                                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatIndianCurrency(totalPurchasesAmt)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Invoices</p>
                                <p className="text-lg font-bold text-gray-900 mt-0.5">{invoiceCount}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Last Purchase</p>
                                <p className="text-lg font-bold text-gray-900 mt-0.5">{lastPurchaseDate}</p>
                            </div>
                        </div>

                        {/* Address */}
                        {(customer.streetAddress || customer.city || customer.state) && (
                            <div>
                                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                                <p className="text-[14px] text-gray-700">
                                    {[customer.streetAddress, customer.city, customer.state, customer.pinCode].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        )}

                        {/* GSTIN */}
                        {customer.gstin && (
                            <div>
                                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">GSTIN</p>
                                <p className="text-[14px] font-mono text-gray-700">{customer.gstin}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── INVOICES TAB ─── */}
                {activeTab === 'invoices' && (
                    <>
                        {sales.length === 0 ? (
                            <p className="text-[13px] text-gray-400 py-6">No invoices yet.</p>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Invoice No</th>
                                            <th className="px-3 py-2.5 text-left text-sm font-bold text-gray-900">Date</th>
                                            <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Amount</th>
                                            <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">Payment</th>
                                            <th className="px-3 py-2.5 text-center text-sm font-bold text-gray-900">Status</th>
                                            <th className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).map(sale => (
                                            <tr key={sale.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <Link
                                                        to={`/sales/invoices/${sale.id}`}
                                                        className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                                    >
                                                        {sale.invoiceNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{formatDate(sale.saleDate)}</td>
                                                <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                                    {formatIndianCurrency(sale.totalAmount)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getPaymentBadge(sale.paymentStatus)}`}>
                                                            {sale.paymentStatus === 'paid' ? 'Paid' : sale.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
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
                                                                        onClick={() => { setMarkingAsPaid(null); setPaymentMode(''); }}
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
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(sale.status)}`}>
                                                        {sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Link
                                                        to={`/sales/invoices/${sale.id}`}
                                                        className="text-sm font-semibold text-[#1F3A2E] hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ─── NOTES TAB ─── */}
                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        {/* Add note */}
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors resize-none"
                                placeholder="Add a note about this customer..."
                            />
                            <div className="mt-2">
                                <button
                                    onClick={handleSaveNote}
                                    disabled={savingNote || !noteText.trim()}
                                    className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#1F3A2E] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {savingNote ? 'Saving...' : 'Add Note'}
                                </button>
                            </div>
                        </div>

                        {/* Existing notes */}
                        {noteEntries.length === 0 ? (
                            <p className="text-[13px] text-gray-400">No notes yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {noteEntries.map((entry, idx) => {
                                    const match = entry.match(/^\[(.+?)\]\s(.+)$/s);
                                    return (
                                        <div key={idx} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                                            {match ? (
                                                <>
                                                    <p className="text-[11px] text-gray-400 mb-1">{match[1]}</p>
                                                    <p className="text-[14px] text-gray-800">{match[2]}</p>
                                                </>
                                            ) : (
                                                <p className="text-[14px] text-gray-800">{entry}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerShow;
