import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { FiArrowLeft, FiPackage, FiPrinter } from 'react-icons/fi';

const PurchaseOrderShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [receiving, setReceiving] = useState(false);
    const [receiveQuantities, setReceiveQuantities] = useState({});

    useEffect(() => {
        fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/purchase-orders/${id}`);
            setOrder(response.data.data || response.data);
            
            // Initialize receive quantities
            const quantities = {};
            const items = response.data.data?.PurchaseOrderItems || response.data.PurchaseOrderItems || [];
            items.forEach(item => {
                const remaining = item.quantity - (item.receivedQuantity || 0);
                quantities[item.id] = remaining > 0 ? remaining : 0;
            });
            setReceiveQuantities(quantities);
            
            setError(null);
        } catch (err) {
            console.error('Error fetching purchase order:', err);
            setError('Failed to load purchase order details');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveQuantityChange = (itemId, value) => {
        setReceiveQuantities(prev => ({
            ...prev,
            [itemId]: parseInt(value) || 0
        }));
    };

    const handleMarkAsReceived = async () => {
        if (!window.confirm('Mark this purchase order as received? This will directly update your inventory stock levels.')) {
            return;
        }

        try {
            setReceiving(true);
            const itemsToReceive = (order.PurchaseOrderItems || []).map(item => ({
                itemId: item.id,
                quantityReceived: receiveQuantities[item.id] || 0
            })).filter(it => it.quantityReceived > 0);

            if (itemsToReceive.length === 0) {
                alert('Please enter at least one quantity to receive.');
                setReceiving(false);
                return;
            }

            await api.post(`/purchase-orders/${id}/receive`, { items: itemsToReceive });
            
            fetchOrder(); // Refresh the order data
        } catch (err) {
            console.error('Error receiving purchase order:', err);
            alert('Failed to receive stock: ' + (err.response?.data?.message || err.message));
        } finally {
            setReceiving(false);
        }
    };

    const getStatusBadge = (status) => {
        let s = status?.toLowerCase() || 'draft';
        if (s === 'pending' || s === 'approved') s = 'sent';

        const styles = {
            draft: 'bg-gray-100 text-gray-600',
            sent: 'bg-amber-100 text-amber-800',
            partial: 'bg-blue-100 text-blue-800',
            received: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2.5 py-1 rounded text-[12px] font-semibold ${styles[s] || styles.draft}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amt) => '₹' + parseFloat(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500 text-[13px]">Loading purchase order...</div>;
    if (error || !order) return <div className="p-8 text-red-600">{error || 'Purchase order not found'}</div>;

    let displayStatus = order.status?.toLowerCase();
    if (displayStatus === 'pending' || displayStatus === 'approved') displayStatus = 'sent';

    const canReceive = displayStatus === 'sent' || displayStatus === 'partial';

    return (
        <div className="bg-gray-50 min-h-screen pb-20 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <FiArrowLeft /> Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <FiPrinter /> Print
                        </button>
                        {canReceive && (
                            <button
                                onClick={handleMarkAsReceived}
                                disabled={receiving}
                                className="flex items-center gap-2 px-5 py-2 bg-[#1F3A2E] hover:bg-[#243d32] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                <FiPackage /> {receiving ? 'Processing...' : 'Receive Stock'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Purchase Order Document */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                    {/* PO Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Purchase Order</h1>
                            <p className="text-gray-500 text-sm font-medium">{order.poNumber}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-3">{getStatusBadge(order.status)}</div>
                            <p className="text-[13px] text-gray-500">Order Date: <span className="text-gray-900 font-medium">{formatDate(order.orderDate)}</span></p>
                            {order.expectedDeliveryDate && (
                                <p className="text-[13px] text-gray-500 mt-1">Expected: <span className="text-gray-900 font-medium">{formatDate(order.expectedDeliveryDate)}</span></p>
                            )}
                        </div>
                    </div>

                    {/* Designer Information */}
                    <div className="mb-8">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order From</h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="font-semibold text-gray-900 text-[14px]">{order.designer?.companyName || 'Unknown Company'}</p>
                            <p className="text-[13px] text-gray-600 mt-1">{order.designer?.name}</p>
                            <p className="text-[13px] text-gray-600 mt-1">{order.designer?.phone}</p>
                            {order.designer?.email && <p className="text-[13px] text-gray-600 mt-1">{order.designer.email}</p>}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Line Items</h3>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Product</th>
                                        <th className="px-4 py-3 font-medium text-center">Ordered</th>
                                        <th className="px-4 py-3 font-medium text-center">Received</th>
                                        {canReceive && <th className="px-4 py-3 font-medium text-center bg-[#f2fcf6] text-[#1F3A2E] print:hidden">Receive Qty</th>}
                                        <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                                        <th className="px-4 py-3 font-medium text-right bg-gray-50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(order.PurchaseOrderItems || []).map((item) => {
                                        const remaining = item.quantity - (item.receivedQuantity || 0);
                                        const productName = item.productName || item.Product?.name || 'Custom Item';
                                        const sku = item.Product?.sku || '—';

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{productName}</div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">SKU: {sku}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-900 font-medium">{item.quantity}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-medium ${item.receivedQuantity >= item.quantity ? 'text-green-600' : 'text-gray-900'}`}>
                                                        {item.receivedQuantity || 0}
                                                    </span>
                                                    {remaining > 0 && (
                                                        <div className="text-[11px] text-orange-500 mt-1 font-medium">Pending: {remaining}</div>
                                                    )}
                                                </td>
                                                {canReceive && (
                                                    <td className="px-4 py-3 text-center print:hidden bg-[#fbfdfc]">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={remaining}
                                                            value={receiveQuantities[item.id] !== undefined ? receiveQuantities[item.id] : 0}
                                                            onChange={(e) => handleReceiveQuantityChange(item.id, e.target.value)}
                                                            disabled={remaining === 0}
                                                            className="w-16 h-8 px-2 border border-gray-200 rounded text-center text-[13px] font-medium focus:border-[#1F3A2E] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900 bg-gray-50/50">
                                                    {formatCurrency(item.quantity * item.unitPrice)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64 border border-gray-100 rounded-lg overflow-hidden">
                            <div className="flex justify-between px-4 py-3 bg-gray-50">
                                <span className="text-[14px] font-bold text-gray-900">Total Amount</span>
                                <span className="text-[15px] font-bold text-[#1F3A2E]">
                                    {formatCurrency(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Order Notes</h3>
                            <p className="text-[13px] text-gray-700 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100/50 whitespace-pre-line">
                                {order.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderShow;
