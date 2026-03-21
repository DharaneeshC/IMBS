import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { useReactToPrint } from 'react-to-print';

const RepairOrderNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null); // For success state and printing
  const componentRef = useRef();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    productSKU: '',
    metalType: 'Gold',
    estimatedWeight: '',
    serviceType: 'Resizing',
    priority: 'Normal',
    issueDescription: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    repairCharges: '',
    advancePayment: '',
    paymentStatus: 'Pending',
    assignedTo: 'Store Staff'
  });

  const metalOptions = ['Gold', 'Silver', 'Platinum', 'Other'];
  const serviceOptions = ['Resizing', 'Stone Replacement', 'Polishing', 'Chain Repair', 'Clasp Repair', 'Engraving', 'Cleaning', 'Soldering', 'Other'];
  const staffOptions = ['Store Staff', 'Master Goldsmith', 'Polisher', 'Setter']; // Can be dynamic

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBalance = () => {
    const charges = parseFloat(formData.repairCharges) || 0;
    const advance = parseFloat(formData.advancePayment) || 0;
    return (charges - advance).toFixed(2);
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic validation
      if (!formData.customerName.trim()) throw new Error('Customer name is required');
      if (!formData.customerPhone.trim()) throw new Error('Customer phone is required');
      if (!formData.productName.trim()) throw new Error('Product name is required');
      if (!formData.expectedDeliveryDate) throw new Error('Expected delivery date is required');

      const submitData = {
        ...formData,
        repairCharges: parseFloat(formData.repairCharges) || 0,
        advancePayment: parseFloat(formData.advancePayment) || 0,
        // Calculate balance on backend to be safe, but frontend calc is good for UX
      };

      const response = await api.post('/repair-orders', submitData);
      setCreatedOrder(response.data);
      // Wait a moment for state to update then show toast/print option
      
      // Delay navigation to allow seeing success message/printing
      setTimeout(() => {
        navigate('/services/repair-orders');
      }, 3000); 

    } catch (err) {
      console.error('Create error:', err);
      setError(err.response?.data?.details || err.message || 'Failed to create repair order');
      setLoading(false);
    }
  };

  // If order created successfully, show success and print option
  if (createdOrder) {
    return (
      <div className="p-6 bg-white min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-xl font-medium mb-2">
             Repair order {createdOrder.orderNumber} created · Token: {createdOrder.tokenNumber}
          </div>
          <button 
            onClick={handlePrint}
            className="text-[#1F3A2E] hover:underline font-medium text-sm mt-2"
          >
            Print token slip →
          </button>
          <div className="mt-4 text-gray-500 text-xs">Redirecting to list...</div>
        </div>

        {/* Hidden Print Component - Positioned off-screen instead of display:none to ensure react-to-print captures it */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <div ref={componentRef} className="p-8 bg-white text-black font-sans text-xs w-[300px]">
                <div className="text-center font-bold text-lg mb-2">Shanmuga Jewellers</div>
                <div className="text-center mb-4 border-b-2 border-black pb-2 font-bold">REPAIR TOKEN</div>
                
                <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm">
                    <div className="font-bold">Token No:</div>
                    <div className="text-right font-bold text-lg">{createdOrder.tokenNumber}</div>
                    
                    <div className="font-bold">Date:</div>
                    <div className="text-right">{new Date().toLocaleDateString()}</div>
                    
                    <div className="font-bold">Customer:</div>
                    <div className="text-right">{createdOrder.customerName}</div>
                    
                    <div className="font-bold">Phone:</div>
                    <div className="text-right">{createdOrder.customerPhone}</div>
                </div>
                
                <div className="border-t border-black pt-2 mb-4">
                    <div className="font-bold mb-1">Item Details:</div>
                    <div>{createdOrder.productName} ({createdOrder.metalType})</div>
                    <div>{createdOrder.serviceType}</div>
                </div>
                
                <div className="border-t border-black pt-2">
                    <div className="flex justify-between">
                        <span>Charges:</span>
                        <span>₹{parseFloat(createdOrder.repairCharges).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Paid:</span>
                        <span>₹{parseFloat(createdOrder.advancePayment).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-1">
                        <span>Balance:</span>
                        <span>₹{parseFloat(createdOrder.balanceAmount).toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="text-center mt-6 text-[10px]">
                    Expected Delivery: {new Date(createdOrder.expectedDeliveryDate).toLocaleDateString()}
                </div>
            </div>
        </div>
      </div>
    );
  }

  const inputStyle = "w-full px-3 py-2 text-[14px] font-medium text-gray-900 border border-gray-300 rounded focus:outline-none focus:border-[#1F3A2E] focus:ring-1 focus:ring-[#1F3A2E] transition-all bg-white placeholder-gray-400";
  const labelStyle = "block text-[13px] font-bold text-gray-800 mb-1 uppercase tracking-wide";

  return (
    <div className="bg-white min-h-screen p-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">New Repair Order</h1>
                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Token: <span className="font-mono text-gray-900">TOK-XXXX</span>
                </span>
            </div>
            <Link to="/services/repair-orders" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                ← Back to Repair Orders
            </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] rounded border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Row */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className={labelStyle}>Customer Name</label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                            placeholder="e.g. Dharaneesh C"
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Phone Number</label>
                        <input
                            type="text"
                            name="customerPhone"
                            value={formData.customerPhone}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                            placeholder="+91-XXXXXXXXXX"
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Email (Optional)</label>
                        <input
                            type="email"
                            name="customerEmail"
                            value={formData.customerEmail}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="email@example.com"
                        />
                    </div>
                </div>
            </div>

            {/* Product Row */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="col-span-1">
                        <label className={labelStyle}>Product Name</label>
                        <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                            placeholder="e.g. Gold Ring"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className={labelStyle}>SKU (Optional)</label>
                        <input
                            type="text"
                            name="productSKU"
                            value={formData.productSKU}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="RNG-22K-0001"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className={labelStyle}>Metal Type</label>
                        <select
                            name="metalType"
                            value={formData.metalType}
                            onChange={handleChange}
                            className={inputStyle}
                        >
                            {metalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className={labelStyle}>Approx. weight (g)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="estimatedWeight"
                            value={formData.estimatedWeight}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            {/* Service Details */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                    <div className="col-span-1">
                        <label className={labelStyle}>Service Type</label>
                        <select
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            className={inputStyle}
                        >
                            {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                         <label className={labelStyle}>Priority</label>
                         <div className="flex bg-gray-50 rounded p-1 w-fit border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, priority: 'Normal'})}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${formData.priority === 'Normal' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Normal
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, priority: 'Urgent'})}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${formData.priority === 'Urgent' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Urgent
                            </button>
                         </div>
                    </div>
                    <div className="col-span-1">
                         <label className={labelStyle}>Assigned To</label>
                         <select
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            className={inputStyle}
                        >
                            {staffOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Additional details about the issue...</label>
                    <textarea
                        name="issueDescription"
                        value={formData.issueDescription}
                        onChange={handleChange}
                        className={`${inputStyle} h-[80px] resize-none`}
                        placeholder="Describe the issue or service required..."
                    ></textarea>
                </div>
            </div>

            {/* Schedule */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelStyle}>Received Date</label>
                        <input
                            type="date"
                            name="receivedDate"
                            value={formData.receivedDate}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Expected Delivery Date</label>
                        <input
                            type="date"
                            name="expectedDeliveryDate"
                            value={formData.expectedDeliveryDate}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Financial Details */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                    <div>
                        <label className={labelStyle}>Repair Charges (₹)</label>
                        <input
                            type="number"
                            name="repairCharges"
                            value={formData.repairCharges}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Advance Payment (₹)</label>
                        <input
                            type="number"
                            name="advancePayment"
                            value={formData.advancePayment}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Balance Amount (₹)</label>
                        <input
                            type="text"
                            value={calculateBalance()}
                            readOnly
                            className={`${inputStyle} bg-gray-50 text-gray-700 font-bold`}
                        />
                    </div>
                     <div>
                         <label className={labelStyle}>Payment Status</label>
                         <div className="flex bg-gray-50 rounded p-1 w-fit border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, paymentStatus: 'Pending'})}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${formData.paymentStatus === 'Pending' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, paymentStatus: 'Paid'})}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${formData.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Paid
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => navigate('/services/repair-orders')}
                    className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-[#1a2e1a] text-white text-sm font-bold rounded hover:bg-[#243d32] transition-colors disabled:opacity-50 shadow-md"
                >
                    {loading ? 'Creating...' : 'Create Repair Order'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RepairOrderNew;
