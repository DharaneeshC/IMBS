import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { FiSearch, FiArrowLeft, FiX } from 'react-icons/fi';
import { HiCamera } from 'react-icons/hi';
import CameraScanner from '../../components/CameraScanner';

const SaleNew = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    // Barcode Scanning States
    const [scanInput, setScanInput] = useState('');
    const [scanning, setScanScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const [scanSuccess, setScanSuccess] = useState('');
    const scanInputRef = useRef(null);
    
    // Camera Scanner State
    const [showCameraScanner, setShowCameraScanner] = useState(false);

    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        paidVia: 'cash',
        notes: '',
        status: 'confirmed'
    });

    const [items, setItems] = useState([]);
    const [totals, setTotals] = useState({
        subtotal: 0,
        gstTotal: 0,
        discount: 0,
        finalAmount: 0
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [items]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (scanInput.length >= 2) {
                setSearchTerm(scanInput);
            } else {
                setSearchTerm('');
                setSearchResults([]);
            }
        }, 300); // 300ms debounce to avoid searching while scanning
        return () => clearTimeout(timeoutId);
    }, [scanInput]);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            searchProducts();
        }
    }, [searchTerm]);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers', { params: { limit: 100 } });
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const searchProducts = async () => {
        try {
            setSearching(true);
            const response = await api.get('/sales/search-products', {
                params: { query: searchTerm }
            });
            setSearchResults(response.data.data);
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Add Product Logic (for both manual scan and camera scan)
    const handleAddProduct = async (skuOrProduct) => {
        setScanError('');
        setScanSuccess('');
        
        try {
            let product = skuOrProduct;
            
            // If sku passed as string, fetch product
            if (typeof skuOrProduct === 'string') {
                // 1. CLEANUP: Trim whitespace/newlines
                const scannedText = skuOrProduct.trim();
                const scannedTextUpper = scannedText.toUpperCase();
                
                let found = false;

                // STRATEGY: 
                // A. Try Uppercase SKU match first (Since manual entry works and is Uppercase)
                try {
                    const response = await api.get(`/products/sku/${scannedTextUpper}`);
                    product = response.data;
                    found = true;
                } catch (e) {
                    // console.log("Uppercase SKU lookup failed");
                }

                // B. If failed and original was different (e.g. lowercase), try original
                if (!found && scannedText !== scannedTextUpper) {
                    try {
                        const response = await api.get(`/products/sku/${scannedText}`);
                        product = response.data;
                        found = true;
                    } catch (e) {
                        // console.log("Original SKU lookup failed");
                    }
                }

                // C. Fallback: Search by query (Broad search)
                if (!found) {
                    const searchResponse = await api.get('/sales/search-products', {
                        params: { query: scannedText }
                    });
                    
                    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
                        // Pick exact match if possible (checking both SKU and Name)
                        const exactMatch = searchResponse.data.data.find(
                            p => p.sku.toUpperCase() === scannedTextUpper || 
                                 p.name.toUpperCase() === scannedTextUpper
                        );
                        product = exactMatch || searchResponse.data.data[0];
                        found = true;
                    }
                }

                if (!found) {
                    throw new Error(`Product not found`);
                }
            }

            // Check stock
            if (product.quantity <= 0) {
                setScanError(`${product.name} is out of stock!`);
                setTimeout(() => setScanError(''), 3000);
                return;
            }

            // Add to invoice
            addProductToInvoice(product);
            
            // Success feedback
            setScanSuccess(`${product.name} added`);
            setTimeout(() => setScanSuccess(''), 1000);

        } catch (error) {
            console.error('Error adding product:', error);
            const sku = typeof skuOrProduct === 'string' ? skuOrProduct : 'Unknown';
            // Show exactly what was scanned in brackets to detect hidden spaces
            setScanError(`Not Found: [${sku}]`);
            setTimeout(() => setScanError(''), 3000);
        }
    };

    // Barcode Input Handler
    const handleBarcodeScanInput = async (e) => {
        if (e.key === 'Enter' && scanInput.trim()) {
            e.preventDefault();
            setScanScanning(true);
            await handleAddProduct(scanInput);
            setScanInput('');
            setScanScanning(false);
            if (scanInputRef.current) {
                scanInputRef.current.focus();
            }
        }
    };

    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === parseInt(customerId));
        if (customer) {
            setFormData({
                ...formData,
                customerId: customer.id,
                customerName: customer.fullName || '',
                customerEmail: customer.email || '',
                customerPhone: customer.phone || '',
                customerAddress: customer.streetAddress || ''
            });
        } else {
            setFormData({
                ...formData,
                customerId: '',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                customerAddress: ''
            });
        }
    };

    const addProductToInvoice = (product) => {
        const existingIndex = items.findIndex(item => item.productId === product.id);
        
        if (existingIndex >= 0) {
            const updatedItems = [...items];
            updatedItems[existingIndex].quantity += 1;
            calculateLineTotal(updatedItems[existingIndex]);
            setItems(updatedItems);
        } else {
            const newItem = {
                productId: product.id,
                productName: product.name,
                productType: product.type,
                productSku: product.sku,
                quantity: 1,
                unitPrice: parseFloat(product.price) || 0,
                netWeight: 0,
                metalRate: 0,
                makingCharge: 0,
                taxRate: 3,
                taxAmount: 0,
                lineTotal: 0
            };
            calculateLineTotal(newItem);
            setItems([...items, newItem]);
        }
        setScanInput(''); // Clear the input field
        setSearchTerm('');
        setSearchResults([]);
    };

    const calculateLineTotal = (item) => {
        const baseAmount = item.quantity * item.unitPrice;
        const taxAmount = (baseAmount * item.taxRate) / 100;
        item.taxAmount = parseFloat(taxAmount.toFixed(2));
        item.lineTotal = parseFloat((baseAmount + taxAmount).toFixed(2));
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = parseFloat(value) || 0;
        calculateLineTotal(updatedItems[index]);
        setItems(updatedItems);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const gstTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const finalAmount = subtotal + gstTotal - totals.discount;

        setTotals({
            subtotal: parseFloat(subtotal.toFixed(2)),
            gstTotal: parseFloat(gstTotal.toFixed(2)),
            discount: totals.discount,
            finalAmount: parseFloat(finalAmount.toFixed(2))
        });
    };

    const handleDiscountChange = (discount) => {
        const discountValue = parseFloat(discount) || 0;
        const finalAmount = totals.subtotal + totals.gstTotal - discountValue;
        setTotals({
            ...totals,
            discount: discountValue,
            finalAmount: parseFloat(finalAmount.toFixed(2))
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customerName) {
            alert('Please enter customer name');
            return;
        }

        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        try {
            setLoading(true);

            let finalCustomerId = formData.customerId;
            let finalCustomerName = formData.customerName;
            
            const isWalkInWithPhone = !finalCustomerId && formData.customerName && formData.customerPhone;

            const saleData = {
                ...formData,
                customerId: finalCustomerId,
                customerName: finalCustomerName,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    netWeight: item.netWeight || 0,
                    metalRate: item.metalRate || 0,
                    makingCharge: item.makingCharge || 0,
                    taxRate: item.taxRate || 3,
                    taxAmount: item.taxAmount || 0,
                    lineTotal: item.lineTotal || 0
                })),
                subtotal: totals.subtotal || 0,
                taxAmount: totals.gstTotal || 0,
                discountAmount: totals.discount || 0,
                totalAmount: totals.finalAmount || 0,
                status: 'confirmed',
                paymentStatus: formData.paymentStatus,
                ...(formData.paymentStatus === 'paid' && {
                    paymentMethod: formData.paidVia,
                    paidAt: new Date().toISOString()
                })
            };

            await api.post('/sales', saleData);
            
            const toastMessage = isWalkInWithPhone ? `Invoice created & Customer synced` : 'Invoice created successfully';
            alert(toastMessage);

            if (isWalkInWithPhone) {
                navigate('/customers');
            } else {
                navigate('/sales/invoices');
            }
        } catch (error) {
            console.error('Error creating sale:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create invoice';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="w-full mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/sales/invoices')}
                            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto px-6 py-8">
                <form onSubmit={handleSubmit}>
                    
                    {/* Form Rows - Now Larger and Borderless */}
                    <div className="mb-10 space-y-8">
                        {/* Row 1: Invoice No, Date, Payment Mode */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Invoice No</label>
                                <input
                                    type="text"
                                    value="Auto Generated"
                                    disabled
                                    className="w-full px-4 h-11 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-base font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={new Date().toISOString().split('T')[0]}
                                    disabled
                                    className="w-full px-4 h-11 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-base font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Payment Mode</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ 
                                            ...formData, 
                                            paymentMethod: val,
                                            paymentStatus: val !== 'other' ? 'paid' : 'pending',
                                            paidVia: val !== 'other' ? val : formData.paidVia
                                        });
                                    }}
                                    className="w-full px-4 h-11 border border-gray-300 rounded-md text-gray-900 text-base font-medium focus:ring-2 focus:ring-[#1a2e1a] focus:border-[#1a2e1a]"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Payment Status */}
                        <div className="flex items-center gap-6">
                            <label className="text-sm font-bold text-gray-800 w-32">Payment Status:</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentStatus: 'pending' })}
                                    className={`px-5 py-2 text-sm rounded-md transition-colors font-bold border ${
                                        formData.paymentStatus === 'pending'
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Pending
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })}
                                    className={`px-5 py-2 text-sm rounded-md transition-colors font-bold border ${
                                        formData.paymentStatus === 'paid'
                                            ? 'bg-green-50 text-green-700 border-green-300 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Paid
                                </button>
                            </div>
                            
                            {formData.paymentStatus === 'paid' && (
                                <select
                                    value={formData.paidVia}
                                    onChange={(e) => setFormData({ ...formData, paidVia: e.target.value })}
                                    className="ml-4 px-3 h-10 border border-gray-300 rounded-md text-sm font-bold w-40 focus:ring-2 focus:ring-[#1a2e1a]"
                                >
                                    <option value="cash">Via Cash</option>
                                    <option value="card">Via Card</option>
                                    <option value="upi">Via UPI</option>
                                    <option value="bank_transfer">Via Bank Transfer</option>
                                    <option value="cheque">Via Cheque</option>
                                    <option value="other">Other</option>
                                </select>
                            )}
                        </div>

                        {/* Row 3: Customer Select & Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Select Customer</label>
                                <select
                                    value={formData.customerId}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                    className="w-full px-4 h-11 border border-gray-300 rounded-md text-gray-900 text-base font-medium focus:ring-2 focus:ring-[#1a2e1a] focus:border-[#1a2e1a]"
                                >
                                    <option value="">Walk-in / Manual Entry</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.fullName} — {customer.phone}
                                        </option>
                                    ))}
                                </select>
                                {formData.customerId && (
                                    <button
                                        type="button"
                                        onClick={() => handleCustomerChange('')}
                                        className="mt-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        ✕ Clear selection
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Customer Name</label>
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Enter customer name"
                                    disabled={!!formData.customerId}
                                    className={`w-full px-4 h-11 border border-gray-300 rounded-md text-base ${
                                        formData.customerId ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900 font-medium'
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 4: Phone & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    placeholder="Enter phone"
                                    readOnly={!!formData.customerId}
                                    className={`w-full px-4 h-11 border border-gray-300 rounded-md text-base ${
                                        formData.customerId ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900 font-medium'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                    placeholder="Enter email"
                                    readOnly={!!formData.customerId}
                                    className={`w-full px-4 h-11 border border-gray-300 rounded-md text-base ${
                                        formData.customerId ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900 font-medium'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scan & Search Section */}
                    <div className="mb-6 relative">
                        {/* Feedback Toast */}
                        {(scanSuccess || scanError) && (
                            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center gap-2 ${
                                scanSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                                {scanSuccess || scanError}
                            </div>
                        )}

                        <div className="flex flex-col gap-1 relative">
                            {/* Combined Scan & Search Input */}
                            <div className="flex gap-2 relative">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                                        onKeyDown={handleBarcodeScanInput}
                                        placeholder="Scan barcode or search product..."
                                        className="w-full pl-11 pr-4 h-12 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-base font-bold focus:ring-2 focus:ring-[#1a2e1a] focus:border-[#1a2e1a]"
                                        disabled={scanning}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCameraScanner(true)}
                                    className="px-5 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-base font-bold flex items-center gap-2 shadow-sm"
                                >
                                    <HiCamera className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleAddProduct(product)}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    SKU: {product.sku} | Stock: {product.quantity}
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold text-[#1a2e1a]">
                                                ₹{product.price}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Items Table - Larger */}
                    <div className="mb-8 overflow-x-auto">
                        <table className="w-full text-base border-collapse">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-800">Product</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-800">SKU</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-800 w-24">Qty</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-800">Unit Price</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-800">GST%</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-800">Total</th>
                                    <th className="px-3 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                    items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 last:border-none hover:bg-gray-50">
                                            <td className="px-4 py-4 text-gray-900 font-bold">{item.productName}</td>
                                            <td className="px-4 py-4 text-gray-500 font-mono text-sm">{item.productSku || '-'}</td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    className="w-20 px-2 py-2 border border-gray-300 rounded-md text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-900 font-bold">₹{item.unitPrice.toFixed(2)}</td>
                                            <td className="px-4 py-4 text-center text-gray-500 font-bold">{item.taxRate}%</td>
                                            <td className="px-4 py-4 text-right font-bold text-[#1a2e1a] text-lg">₹{item.lineTotal.toFixed(2)}</td>
                                            <td className="px-3 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                >
                                                    <FiX className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-base font-medium">
                                            No items added. Scan product or search above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="flex justify-end mb-10 border-t-2 border-gray-200 pt-6">
                        <div className="w-[350px]">
                            <div className="flex justify-between mb-3 text-base font-bold text-gray-700">
                                <span>Subtotal:</span>
                                <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between mb-3 text-base font-bold text-gray-700">
                                <span>GST Total:</span>
                                <span>₹{totals.gstTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4 text-base font-bold text-gray-700">
                                <span>Discount:</span>
                                <input
                                    type="number"
                                    value={totals.discount}
                                    onChange={(e) => handleDiscountChange(e.target.value)}
                                    className="w-[100px] px-3 py-2 border border-gray-300 rounded-md text-right text-base font-bold focus:ring-2 focus:ring-[#1a2e1a] focus:outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex justify-between text-2xl font-black text-[#1a2e1a] border-t-2 border-gray-200 pt-4 mt-2">
                                <span>Final Amount:</span>
                                <span>₹{totals.finalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-6">
                        <button
                            type="button"
                            onClick={() => navigate('/sales/invoices')}
                            className="text-base font-bold text-gray-500 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || items.length === 0}
                            className="px-8 py-3 bg-[#1a2e1a] text-white text-base font-bold rounded-lg hover:bg-[#243d32] disabled:opacity-50 transition-colors shadow-md"
                        >
                            {loading ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>

                </form>
            </div>

            {/* Camera Modal */}
            {showCameraScanner && (
                <CameraScanner
                    onScan={handleAddProduct}
                    onClose={() => setShowCameraScanner(false)}
                />
            )}
        </div>
    );
};

export default SaleNew;
