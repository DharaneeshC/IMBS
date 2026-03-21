import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/api';
import { HiArrowLeft, HiSave } from 'react-icons/hi';

const RepairOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    productSKU: '',
    metalType: '',
    estimatedWeight: '',
    serviceType: '',
    priority: 'Normal',
    issueDescription: '',
    receivedDate: '',
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
    repairCharges: '',
    advancePayment: '',
    paymentStatus: 'Pending',
    repairNotes: '',
    assignedTo: '',
    status: 'Pending'
  });

  const metalOptions = ['Gold', 'Silver', 'Platinum', 'Other'];
  const serviceOptions = ['Resizing', 'Stone Replacement', 'Polishing', 'Chain Repair', 'Clasp Repair', 'Engraving', 'Cleaning', 'Soldering', 'Other'];
  const staffOptions = ['Store Staff', 'Master Goldsmith', 'Polisher', 'Setter'];

  useEffect(() => {
    fetchRepairOrder();
  }, [id]);

  const fetchRepairOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/repair-orders/${id}`);
      const order = response.data;
      
      setFormData({
        ...order,
        receivedDate: order.receivedDate ? order.receivedDate.split('T')[0] : '',
        expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
        actualDeliveryDate: order.actualDeliveryDate ? order.actualDeliveryDate.split('T')[0] : '',
        customerEmail: order.customerEmail || '',
        productSKU: order.productSKU || '',
        metalType: order.metalType || '',
        estimatedWeight: order.estimatedWeight || '',
        serviceType: order.serviceType || '',
        priority: order.priority || 'Normal',
        repairNotes: order.repairNotes || '',
        assignedTo: order.assignedTo || ''
      });
    } catch (err) {
      setError('Failed to load repair order');
      console.error('Error fetching repair order:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.customerName.trim()) throw new Error('Customer name is required');
      if (!formData.customerPhone.trim()) throw new Error('Customer phone is required');
      if (!formData.productName.trim()) throw new Error('Product name is required');

      const submitData = {
        ...formData,
        repairCharges: parseFloat(formData.repairCharges) || 0,
        advancePayment: parseFloat(formData.advancePayment) || 0,
        actualDeliveryDate: formData.actualDeliveryDate || null
      };

      await api.put(`/repair-orders/${id}`, submitData);
      navigate('/services/repair-orders');
    } catch (err) {
      setError(err.message || 'Failed to update repair order');
    } finally {
      setSaving(false);
    }
  };

  const sectionStyle = { borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' };
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";
  const inputStyle = "w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#1F3A2E] focus:ring-1 focus:ring-[#1F3A2E] transition-all bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3A2E]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/services/repair-orders" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <HiArrowLeft className="w-5 h-5" />
             </Link>
             <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Repair Order</h1>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        #{formData.orderNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium 
                        ${formData.status === 'Pending' ? 'bg-gray-100 text-gray-700' : 
                          formData.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          formData.status === 'Delivered' ? 'bg-green-800 text-white' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {formData.status}
                    </span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
                type="button"
                onClick={() => navigate('/services/repair-orders')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
             >
                Cancel
             </button>
             <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-[#1F3A2E] text-white rounded-lg text-sm font-medium hover:bg-[#243d32] transition-colors shadow-sm flex items-center gap-2"
             >
                <HiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Customer & Product Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div style={sectionStyle}>
                        <h2 className="text-base font-bold text-gray-900 mb-4">Customer Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Customer Name</label>
                                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>Phone Number</label>
                                <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Email (Optional)</label>
                                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-base font-bold text-gray-900 mb-4">Product Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Product Name</label>
                                <input type="text" name="productName" value={formData.productName} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>SKU</label>
                                <input type="text" name="productSKU" value={formData.productSKU} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Metal Type</label>
                                <select name="metalType" value={formData.metalType} onChange={handleChange} className={inputStyle}>
                                    <option value="">Select...</option>
                                    {metalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Approx Weight (g)</label>
                                <input type="number" step="0.01" name="estimatedWeight" value={formData.estimatedWeight} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Service & Issue</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>Service Type</label>
                            <select name="serviceType" value={formData.serviceType} onChange={handleChange} className={inputStyle}>
                                {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className={inputStyle}>
                                <option value="Normal">Normal</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className={labelStyle}>Issue Description</label>
                        <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} rows="3" className={inputStyle}></textarea>
                    </div>
                    <div>
                        <label className={labelStyle}>Internal Notes</label>
                        <textarea name="repairNotes" value={formData.repairNotes} onChange={handleChange} rows="2" className={inputStyle} placeholder="Staff only notes..."></textarea>
                    </div>
                </div>
            </div>

            {/* Right Column - Status & Payment */}
            <div className="space-y-6">
                
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Status & Schedule</h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelStyle}>Current Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Assigned To</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={inputStyle}>
                                <option value="">Select Staff...</option>
                                {staffOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Received Date</label>
                            <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Expected Delivery</label>
                            <input type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} className={inputStyle} />
                        </div>
                        {(formData.status === 'Completed' || formData.status === 'Delivered') && (
                            <div>
                                <label className={labelStyle}>Actual Delivery</label>
                                <input type="date" name="actualDeliveryDate" value={formData.actualDeliveryDate} onChange={handleChange} className={inputStyle} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Financials</h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelStyle}>Repair Charges (₹)</label>
                            <input type="number" name="repairCharges" value={formData.repairCharges} onChange={handleChange} className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label className={labelStyle}>Advance Paid (₹)</label>
                            <input type="number" name="advancePayment" value={formData.advancePayment} onChange={handleChange} className={inputStyle} placeholder="0.00" />
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Balance Amount</span>
                                <span className="text-lg font-bold text-gray-900">₹{calculateBalance()}</span>
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>Payment Status</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'Pending'})} 
                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${formData.paymentStatus === 'Pending' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>
                                    Pending
                                </button>
                                <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'Paid'})} 
                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${formData.paymentStatus === 'Paid' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                    Paid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </form>
      </div>
    </div>
  );
};

export default RepairOrderEdit;
