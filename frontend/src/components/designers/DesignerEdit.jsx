import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import { HiArrowLeft, HiCamera, HiX } from 'react-icons/hi';

const DesignerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    companyName: '',
    displayName: '',
    name: '',
    email: '',
    phone: '',
    image: null,
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstin: '',
    status: 'active'
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDesigner();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDesigner = async () => {
    try {
      const response = await api.get(`/designers/${id}`);
      const designer = response.data.designer;
      setFormData({
        companyName: designer.companyName || '',
        displayName: designer.displayName || '',
        name: designer.name || '',
        email: designer.email || '',
        phone: designer.phone || '',
        image: null,
        address: {
          street: designer.address?.street || '',
          city: designer.address?.city || '',
          state: designer.address?.state || '',
          pincode: designer.address?.pincode || '',
          country: designer.address?.country || 'India'
        },
        gstin: designer.gstin || '',
        status: designer.status || 'active'
      });
      if (designer.image) setPreviewUrl(designer.image);
      setLoading(false);
    } catch (err) {
      setError('Failed to load designer');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData(prev => ({ ...prev, image: file }));
    setError(null);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    
    try {
      const payload = { ...formData };
      if (payload.image && typeof payload.image !== 'string') {
        payload.image = await toBase64(payload.image);
      } else if (!previewUrl) {
        payload.image = ''; // Deleted image
      } else {
        delete payload.image; // Keep existing image untouched
      }
      
      await api.put(`/designers/${id}`, payload);
      navigate(`/designers/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update designer');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3A2E] mx-auto"></div>
          <p className="mt-3 text-[13px] text-gray-600">Loading designer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-semibold text-[13px]">{error}</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent transition-colors";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Page Header matching Jewellery Inventory */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Designer</h1>
          </div>
          <div>
            <Link to={`/designers/${id}`} className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-[13px] font-medium transition-all shadow-sm">
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Form Area - Full width within container */}
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <form onSubmit={handleSubmit} className="w-full">
          
          <div className="bg-white rounded-lg px-4 pt-3 pb-2 mb-3 border border-gray-100 shadow-sm">
            <div className="border-b border-gray-100 pb-2.5 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Designer Information</h2>
              <div className="flex items-center gap-2">
                <Link
                  to={`/designers/${id}`}
                  className="text-[12px] font-medium text-gray-600 hover:text-[#1F3A2E] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-3 py-1 text-[12px] font-medium text-white bg-[#1F3A2E] rounded hover:bg-[#243d32] transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-5">
              {/* Left Column: Image Upload */}
              <div className="w-[100px] flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="relative w-[100px] h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 overflow-hidden hover:bg-gray-100 transition-colors">
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
                    </>
                  ) : (
                    <>
                      <HiCamera className="w-6 h-6 text-gray-400 mb-0.5" />
                      <span className="text-[10px] font-medium text-gray-500">Upload photo</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col items-stretch gap-1.5 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    id="designer-photo-update"
                  />
                  <label 
                    htmlFor="designer-photo-update"
                    className="px-2 py-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium rounded cursor-pointer transition-colors border border-gray-200"
                  >
                    Change Photo
                  </label>
                </div>
              </div>

              {/* Right Column: Designer Info Inputs */}
              <div className="flex-1 w-full relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Display Name *</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter display name"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Shown in app navigation</p>
                  </div>

                  <div>
                    <label className={labelClass}>Contact Person *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter contact name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter phone"
                    />
                  </div>
                  
                  {/* GSTIN and Status Inline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>GSTIN <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. 24AABC..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] transition-colors"
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

            {/* Address Section */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Address Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Street Address</label>
                  <textarea
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    rows="2"
                    className={`${inputClass} resize-none`}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>PIN Code</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter PIN code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="border-t border-gray-100 pt-4 mt-4 mb-4">
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`${inputClass} md:w-48`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
        </form>
      </div>
    </div>
  );
};

export default DesignerEdit;
