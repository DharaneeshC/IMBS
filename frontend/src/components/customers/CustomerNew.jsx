import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';

const CustomerNew = () => {
    const navigate = useNavigate();
    const firstErrorRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: '',
        displayName: '',
        phone: '',
        email: '',
        customerType: 'Regular',
        status: 'Active',
        gstin: '',
        dateOfBirth: '',
        streetAddress: '',
        city: '',
        state: '',
        pinCode: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (fieldErrors[name]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
        if (!formData.phone.trim()) errors.phone = 'Phone is required';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                fullName: formData.fullName.trim(),
                displayName: formData.displayName || formData.fullName.trim(),
                phone: formData.phone,
                email: formData.email || undefined,
                customerType: formData.customerType,
                status: formData.status,
                gstin: formData.gstin || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                streetAddress: formData.streetAddress || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                pinCode: formData.pinCode || undefined,
            };

            await api.post('/customers', payload);
            navigate('/customers');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create customer');
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `w-full px-2.5 h-9 text-[13px] border rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-colors ${
            fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
        }`;
    const labelClass = 'block text-[13px] font-semibold text-gray-700 mb-1.5';
    const ErrorMsg = ({ field }) =>
        fieldErrors[field] ? (
            <p ref={Object.keys(fieldErrors)[0] === field ? firstErrorRef : null} className="text-[11px] text-red-600 mt-1">
                {fieldErrors[field]}
            </p>
        ) : null;

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
                    </div>
                    <div>
                        <Link to="/customers" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm">
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
                        {/* Customer Information */}
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Customer Information
                            </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            {/* Row 1 */}
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={inputClass('fullName')}
                                    placeholder="e.g., Dharaneesh C"
                                />
                                <ErrorMsg field="fullName" />
                            </div>
                            <div>
                                <label className={labelClass}>Display Name</label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className={inputClass('displayName')}
                                    placeholder="e.g., Dharaneesh"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">Name shown on invoices</p>
                            </div>

                            {/* Row 2 */}
                            <div>
                                <label className={labelClass}>Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={inputClass('phone')}
                                    placeholder="+91-XXXXXXXXXX"
                                />
                                <ErrorMsg field="phone" />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputClass('email')}
                                    placeholder="email@example.com"
                                />
                            </div>

                            {/* Row 3 */}
                            <div>
                                <label className={labelClass}>Customer Type</label>
                                <select
                                    name="customerType"
                                    value={formData.customerType}
                                    onChange={handleChange}
                                    className="w-full px-2.5 h-9 text-[13px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-colors"
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-2.5 h-9 text-[13px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-colors"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Blocked">Blocked</option>
                                </select>
                            </div>
                            
                            {/* Details Toggle */}
                            <div className="sm:col-span-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-[13px] font-medium text-[#1F3A2E] hover:underline flex items-center gap-1"
                                >
                                    {showDetails ? '− Hide Details' : '+ Add Details'}
                                </button>
                            </div>

                            {/* Row 4 (Conditionally Rendered) */}
                            {showDetails && (
                                <>
                                    <div>
                                        <label className={labelClass}>GSTIN <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="text"
                                            name="gstin"
                                            value={formData.gstin}
                                            onChange={handleChange}
                                            className={inputClass('gstin')}
                                            placeholder="e.g., 24AABCD5678G1Z1"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date of Birth <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className={inputClass('dateOfBirth')}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Address (Conditionally Rendered) */}
                    {showDetails && (
                        <div className="mb-6 mt-6">
                            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                Address
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Street Address</label>
                                    <input
                                        type="text"
                                        name="streetAddress"
                                        value={formData.streetAddress}
                                        onChange={handleChange}
                                        className={inputClass('streetAddress')}
                                        placeholder="Street address"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={inputClass('city')}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className={inputClass('state')}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>PIN Code</label>
                                        <input
                                            type="text"
                                            name="pinCode"
                                            value={formData.pinCode}
                                            onChange={handleChange}
                                            className={inputClass('pinCode')}
                                            placeholder="PIN code"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-[14px] font-medium text-white bg-[#1a1d2e] dark:bg-[#1F3A2E] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Customer'}
                        </button>
                        <Link 
                            to="/customers" 
                            className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </Link>
                    </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerNew;
