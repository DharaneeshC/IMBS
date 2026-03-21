import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/api';
import { FiX, FiPlus, FiSearch } from 'react-icons/fi';

const PurchaseOrderNew = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const prefillProduct = queryParams.get('product');
    const prefillQty = queryParams.get('qty');

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initial references
    const [designers, setDesigners] = useState([]);
    const [products, setProducts] = useState([]);

    const [formData, setFormData] = useState({
        expectedDeliveryDate: '',
        orderDate: new Date().toISOString().split('T')[0],
        designerId: '',
        notes: '',
        status: 'pending' // Default to pending as Draft toggle is removed
    });

    const [items, setItems] = useState([]);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [designersRes, productsRes] = await Promise.all([
                    api.get('/designers?limit=1000'),
                    api.get('/products?limit=1000') // For autocomplete
                ]);
                const designersList = Array.isArray(designersRes.data) ? designersRes.data : (designersRes.data.data || []);
                const productsList = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.data || []);
                
                setDesigners(designersList);
                setProducts(productsList);

                // If prefilled from low stock alerts
                if (prefillProduct && prefillQty) {
                    const matchedProd = productsList.find(p => p.id.toString() === prefillProduct.toString());
                    if (matchedProd) {
                        setItems([{
                            id: Date.now().toString(),
                            productId: matchedProd.id,
                            productName: matchedProd.name,
                            sku: matchedProd.sku,
                            quantity: parseInt(prefillQty) || 1,
                            unitPrice: matchedProd.price || 0,
                            total: (parseInt(prefillQty) || 1) * (matchedProd.price || 0)
                        }]);
                    }
                }
            } catch (err) {
                console.error('Initial data fetch error:', err);
                setError('Failed to load required data');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
        
        // Click outside listener for dropdown
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [prefillProduct, prefillQty]);

    const handleDesignerChange = (e) => {
        setFormData({ ...formData, designerId: e.target.value });
    };

    const handleProductSelect = (prod) => {
        const newItem = {
            id: Date.now().toString(),
            productId: prod ? prod.id : null,
            productName: prod ? prod.name : searchTerm || 'Custom Item',
            sku: prod ? prod.sku : '—',
            quantity: 1,
            unitPrice: prod ? prod.price || 0 : 0,
            total: prod ? prod.price || 0 : 0
        };
        setItems([...items, newItem]);
        setSearchTerm('');
        setShowDropdown(false);
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unitPrice) || 0);
                }
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (id) => setItems(items.filter(item => item.id !== id));

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const selectedDesigner = designers.find(d => d.id.toString() === formData.designerId.toString());

    const filteredProducts = products.filter(p => 
        (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.designerId) return setError('Please select a designer');
        if (items.length === 0) return setError('Please add at least one item');

        try {
            setSubmitting(true);
            const payload = {
                designerId: formData.designerId,
                orderDate: formData.orderDate,
                expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
                status: formData.status,
                notes: formData.notes,
                subtotal: totalAmount,
                totalAmount: totalAmount,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName, // Handled implicitly or passed through
                    quantity: Math.max(1, parseFloat(item.quantity) || 1), // Ensure min 1
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    lineTotal: item.total
                }))
            };

            if (!payload.expectedDeliveryDate) {
                payload.expectedDeliveryDate = null;
            }

            await api.post('/purchase-orders', payload);
            navigate('/purchase-orders');
        } catch (err) {
            console.error('Save error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to create purchase order';
            const detailedError = err.response?.data?.error;
            setError(detailedError ? `${errorMsg}: ${detailedError}` : errorMsg);
            setSubmitting(false);
        }
    };

    const formatCurrency = (amt) => '₹' + parseFloat(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const inputStyle = "w-full px-3 h-9 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-[#1F3A2E] focus:ring-1 focus:ring-[#1F3A2E] transition-all bg-white";

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
                    </div>
                    <div>
                        <Link to="/purchase-orders" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm">
                            Back
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto p-4">
                {error && (
                    <div className="mb-4 px-3 py-2 bg-red-50 text-red-700 text-[13px] rounded border border-red-200 inline-flex">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="bg-white rounded-lg px-5 pt-4 pb-2 mb-4 border border-gray-100 shadow-sm">
                
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">PO Number</label>
                        <input 
                            type="text" 
                            value="Auto-generated" 
                            disabled 
                            className="w-full px-3 h-9 text-[13px] border border-gray-200 rounded bg-[#f5f5f0] text-gray-500 cursor-not-allowed" 
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Order Date</label>
                        <input 
                            type="date" 
                            value={formData.orderDate}
                            onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                            required
                            className={inputStyle} 
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Expected Delivery</label>
                        <input 
                            type="date" 
                            value={formData.expectedDeliveryDate}
                            onChange={(e) => setFormData({...formData, expectedDeliveryDate: e.target.value})}
                            className={inputStyle} 
                        />
                    </div>
                </div>

                <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Designer</label>
                    <select 
                        value={formData.designerId}
                        onChange={handleDesignerChange}
                        className={inputStyle}
                        required
                    >
                        <option value="">Select Designer...</option>
                        {designers.map(d => (
                            <option key={d.id} value={d.id}>{d.companyName} ({d.name})</option>
                        ))}
                    </select>
                    {selectedDesigner && (
                        <div className="mt-1.5 text-[12px] text-gray-500 font-medium">
                            Contact: {selectedDesigner.name} · {selectedDesigner.phone}
                        </div>
                    )}
                    </div>
                </div>

                <hr className="border-gray-100 my-5" />

                {/* Items Section */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[14px] font-semibold text-gray-900">Order Items</h2>
                        <div className="text-[14px] font-bold text-gray-900">
                            Total Amount: <span className="text-[#1F3A2E]">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                    
                    {/* Search Component */}
                    <div className="relative w-full max-w-md mb-4" ref={searchRef}>
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search product by name or SKU..."
                            value={searchTerm}
                            onClick={() => setShowDropdown(true)}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            className="w-full pl-9 pr-3 h-9 text-[13px] border border-gray-300 rounded focus:border-[#1F3A2E] focus:outline-none transition-all shadow-sm"
                        />
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-[13px] text-[#1F3A2E] font-medium hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
                                        onClick={() => handleProductSelect(null)}
                                    >
                                        <FiPlus /> Add custom item: "{searchTerm}"
                                    </button>
                                )}
                                {filteredProducts.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex justify-between items-center"
                                        onClick={() => handleProductSelect(p)}
                                    >
                                        <span className="font-medium text-gray-800">{p.name}</span>
                                        <span className="text-gray-400 text-[11px]">{p.sku}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    {items.length > 0 && (
                        <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
                            <table className="w-full text-[13px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Product</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">SKU</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Qty Ordered</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Unit Price</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Total</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="h-9">
                                            <td className="px-3 py-1">
                                                <input 
                                                    type="text" 
                                                    value={item.productName} 
                                                    onChange={e => updateItem(item.id, 'productName', e.target.value)}
                                                    className="w-full h-7 bg-transparent px-1 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded focus:outline-none font-medium text-gray-800"
                                                />
                                            </td>
                                            <td className="px-3 py-1 text-gray-500">{item.sku}</td>
                                            <td className="px-3 py-1">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                    className="w-full h-7 px-2 border border-gray-200 rounded focus:border-[#1F3A2E] focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-1">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                                                    className="w-full h-7 px-2 border border-gray-200 rounded focus:border-[#1F3A2E] focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-1 text-right font-medium text-gray-900">
                                                {formatCurrency(item.total)}
                                            </td>
                                            <td className="px-3 py-1 text-center">
                                                <button type="button" onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                                                    <FiX />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {items.length === 0 && (
                        <div className="text-[13px] text-gray-400 italic">No items added yet.</div>
                    )}

                    <div className="mt-3">
                        <button type="button" onClick={() => searchRef.current?.querySelector('input')?.focus()} className="text-[13px] text-[#1F3A2E] font-medium hover:underline flex items-center gap-1">
                            <FiPlus /> Add line item
                        </button>
                    </div>
                </div>

                <hr className="border-gray-100 my-5" />

                {/* Removed Total Summary from bottom as it moved to top */}
                {/* <div className="flex justify-end mb-6">...</div> */ }

                {/* Footer Controls */}
                <div className="pt-6 flex items-center gap-4 pb-4">
                    <button type="submit" disabled={submitting || items.length === 0} className="px-6 py-2.5 text-[14px] font-medium text-white bg-[#1a1d2e] dark:bg-[#1F3A2E] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        Save Purchase Order
                    </button>
                    <button type="button" onClick={() => navigate('/purchase-orders')} className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                </div>
                </div>
            </form>
            </div>
        </div>
    );
};

export default PurchaseOrderNew;
