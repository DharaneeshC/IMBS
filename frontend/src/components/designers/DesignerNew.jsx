import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { HiArrowLeft, HiCamera, HiX } from 'react-icons/hi';
import Tesseract from 'tesseract.js';

const DesignerNew = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const firstErrorRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: '',
    displayName: '',
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstin: '',
    status: 'active',
    image: null
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [extractionBanner, setExtractionBanner] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }

    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageUpload = async (e, mode) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === 'photo') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData(prev => ({ ...prev, image: file }));
      setExtractionBanner(null);
      setError(null);
      return;
    }

    if (mode === 'ocr') {
      setAiLoading(true);
      setExtractionBanner(null);
      setError(null);
      try {
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        
        const map = {
          'Company Name': 'companyName',
          'Company': 'companyName',
          'Display Name': 'displayName',
          'Contact Person': 'name',
          'Name': 'name',
          'Email': 'email',
          'Phone': 'phone',
          'Contact': 'phone',
          'GSTIN': 'gstin',
          'GST': 'gstin',
          'Street Address': 'address.street',
          'Address': 'address.street',
          'City': 'address.city',
          'State': 'address.state',
          'PIN Code': 'address.pincode',
          'PIN': 'address.pincode'
        };

        const updates = {};
        const addressUpdates = {};
        let count = 0;

        lines.forEach(line => {
          let separatorIdx = Math.max(line.indexOf(':'), line.indexOf('-'));
          let labelStr = '';
          let valueStr = '';
          
          if (separatorIdx > -1) {
            labelStr = line.substring(0, separatorIdx).trim();
            valueStr = line.substring(separatorIdx + 1).trim();
          } else {
            // Attempt inline matching without separator
            for (const key of Object.keys(map)) {
              if (line.toLowerCase().startsWith(key.toLowerCase())) {
                labelStr = key;
                valueStr = line.substring(key.length).trim();
                break;
              }
            }
          }

          if (labelStr && valueStr) {
            for (const [key, fieldName] of Object.entries(map)) {
              if (labelStr.toLowerCase().includes(key.toLowerCase())) {
                // Ensure we don't overwrite already found matched fields
                if (fieldName.startsWith('address.')) {
                  const addrKey = fieldName.split('.')[1];
                  if (!addressUpdates[addrKey]) {
                    addressUpdates[addrKey] = valueStr.replace(/[^0-9a-zA-Z .,-@_]/g, '').trim();
                    count++;
                  }
                } else {
                  if (!updates[fieldName]) {
                    updates[fieldName] = valueStr.replace(/[^0-9a-zA-Z .,-@_]/g, '').trim();
                    count++;
                  }
                }
                break; // Stop looking through map keys for this line once matched
              }
            }
          }
        });

        if (count > 0) {
          setFormData(prev => ({
            ...prev,
            ...updates,
            address: {
              ...prev.address,
              ...addressUpdates
            }
          }));
          setExtractionBanner({ count });
          
          // Clear errors for auto-filled fields
          setFieldErrors({});
        } else {
          setError("Could not extract details — please fill manually.");
        }
      } catch (err) {
        setError('Extraction failed: ' + err.message);
      } finally {
        setAiLoading(false);
      }
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setExtractionBanner(null);
    setError(null);
    setAiLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Clear extracted fields
    setFormData(prev => ({
      ...prev,
      companyName: '',
      displayName: '',
      name: '',
      email: '',
      phone: '',
      gstin: '',
      image: null,
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    }));
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Inline validation
    const errors = {};
    if (!formData.companyName) errors.companyName = 'Company Name is required';
    if (!formData.displayName) errors.displayName = 'Display Name is required';
    if (!formData.name) errors.name = 'Contact Person is required';
    if (!formData.email) errors.email = 'Email Address is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTimeout(() => { 
        firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
      }, 50);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = { ...formData };
      if (payload.image) {
        payload.image = await toBase64(payload.image);
      }
      await api.post('/designers', payload);
      navigate('/designers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create designer');
      setLoading(false);
    }
  };

  // Helper styles
  const inputClass = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors ${fieldErrors[field] ? 'border-red-500' : 'border-gray-300'}`;
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";
  const ErrorMsg = ({ field }) => fieldErrors[field] ? (
    <p ref={Object.keys(fieldErrors)[0] === field ? firstErrorRef : null} className="text-[11px] text-red-600 mt-1">{fieldErrors[field]}</p>
  ) : null;

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* Page Header matching Jewellery Inventory */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Designer</h1>
          </div>
          <div>
            <Link to="/designers" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm">
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto p-4">
        
        {/* Error / AI logic banners */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 text-red-700 text-[13px] rounded border border-red-200 inline-flex">
            {error}
          </div>
        )}        <form onSubmit={handleSubmit} className="w-full">

          <div className="bg-white rounded-lg px-5 pt-4 pb-2 mb-4 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Designer Information</h2>
            
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Top OCR Upload Box - Placed neatly on the left */}
              <div className="w-[120px] flex-shrink-0 flex flex-col items-center gap-2">
                <div className="relative w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 overflow-hidden hover:bg-gray-100 transition-colors">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={clearImage}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white text-gray-800 shadow-sm"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                      {aiLoading && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1F3A2E] mb-2"></div>
                          <span className="text-[10px] font-semibold text-gray-700">Reading...</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <HiCamera className="w-8 h-8 text-gray-400 mb-1" />
                      {aiLoading ? (
                          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1F3A2E] mb-2"></div>
                            <span className="text-[10px] font-semibold text-gray-700">Reading...</span>
                          </div>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-500">Upload photo</span>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex flex-col items-stretch gap-2 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => handleImageUpload(e, 'photo')}
                    className="hidden"
                    id="designer-photo-upload"
                  />
                  <label 
                    htmlFor="designer-photo-upload"
                    className="px-2 py-1.5 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded cursor-pointer transition-colors border border-gray-200"
                  >
                    Set Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'ocr')}
                    className="hidden"
                    id="ocr-upload"
                  />
                  <label 
                    htmlFor="ocr-upload"
                    className="px-2 py-1.5 text-center bg-[#1F3A2E]/10 hover:bg-[#1F3A2E]/20 text-[#1F3A2E] text-[11px] font-semibold rounded cursor-pointer transition-colors border border-[#1F3A2E]/20"
                  >
                    Scan Details
                  </label>
                </div>
              </div>

              {/* General Information Section */}
              <div className="flex-1 w-full relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={inputClass('companyName')}
                      placeholder="e.g., Diamond House International"
                    />
                    <ErrorMsg field="companyName" />
                  </div>

                  <div>
                    <label className={labelClass}>Display Name *</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className={inputClass('displayName')}
                      placeholder="e.g., Diamond House"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Shown in product listings and invoices</p>
                    <ErrorMsg field="displayName" />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Person *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass('name')}
                      placeholder="Contact person name"
                    />
                    <ErrorMsg field="name" />
                  </div>

                  <div>
                    <label className={labelClass}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass('email')}
                      placeholder="email@company.com"
                    />
                    <ErrorMsg field="email" />
                  </div>

                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass('phone')}
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>
                  
                  {/* GSTIN and Status Inline row */}
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className={labelClass}>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg px-5 pt-4 pb-2 mb-4 border border-gray-100 shadow-sm">
            {/* Address Section */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Address Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>PIN Code</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
                      placeholder="PIN code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-[14px] font-medium text-white bg-[#1a1d2e] dark:bg-[#1F3A2E] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Designer'}
              </button>
              <Link
                to="/designers"
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

export default DesignerNew;
