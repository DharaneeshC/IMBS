import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import Tesseract from 'tesseract.js';

// Compress image to max 800px & JPEG quality 0.7 before base64
const compressImage = (file, maxPx = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality);
    };
    img.src = url;
  });
};

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [designers, setDesigners] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [extractionBanner, setExtractionBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [skuError, setSkuError] = useState('');
  const [aiFilledFields, setAiFilledFields] = useState([]);
  const firstErrorRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', type: '', description: '', quantity: '', cost: '', price: '',
    designer: '', frontImage: null, rearImage: null, otherImages: [],
    returnable: 'yes', dimensionLength: '', dimensionWidth: '', dimensionHeight: '',
    dimensionUnit: 'cm', weight: '', weightUnit: 'g', metalType: '', purity: '',
    hallmarkCertified: 'no', certificationAuthority: '', grossWeight: '',
    stoneWeight: '', netMetalWeight: '', metalRate: '', makingCharges: '',
    makingChargesType: 'flat', stoneValue: '', gstPercent: '3', sku: '',
    occasion: '', gender: '', size: '', gemstoneType: '', gemstoneCount: '', gemstoneCarat: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    fetchProduct();
    fetchDesigners(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const p = response.data;
      const data = {
        name: p.name || '', type: p.type || '', description: p.description || '',
        quantity: p.quantity || '', cost: p.cost || '', price: p.price || '',
        designer: p.designer?.id || '', frontImage: p.frontImage || null,
        rearImage: p.rearImage || null, otherImages: p.otherImages ? JSON.parse(p.otherImages) : [],
        returnable: p.returnable || 'yes', dimensionLength: p.dimensionLength || '',
        dimensionWidth: p.dimensionWidth || '', dimensionHeight: p.dimensionHeight || '',
        dimensionUnit: p.dimensionUnit || 'cm', weight: p.weight || '', weightUnit: p.weightUnit || 'g',
        metalType: p.metalType || '', purity: p.metalPurity || p.purity || '',
        hallmarkCertified: p.hallmarkCertified || 'no', certificationAuthority: p.certificationAuthority || '',
        grossWeight: p.grossWeight || '', stoneWeight: p.stoneWeight || '', netMetalWeight: p.netWeight || p.netMetalWeight || '',
        metalRate: p.metalRate || '', makingCharges: p.makingCharges || '',
        makingChargesType: p.makingChargesType || 'flat', stoneValue: p.stoneValue || '',
        gstPercent: p.gstPercent || '3', sku: p.sku || '',
        occasion: p.occasion || '', gender: p.gender || '', size: p.size || '',
        gemstoneType: p.gemstoneType || '', gemstoneCount: p.gemstoneCount || '', gemstoneCarat: p.gemstoneCarat || ''
      };
      setFormData(data);
      setOriginalData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
    }
  };

  const fetchDesigners = async () => {
    try {
      const res = await api.get('/designers');
      setDesigners(res.data.filter(d => d.status === 'active'));
    } catch { setError('Failed to load designers'); }
  };

  const recalcPrice = (data) => {
    const netWeight = parseFloat(data.netMetalWeight) || 0;
    const metalRate = parseFloat(data.metalRate) || 0;
    const stoneValue = parseFloat(data.stoneValue) || 0;
    const makingCharges = parseFloat(data.makingCharges) || 0;
    const gstPercent = parseFloat(data.gstPercent) || 0;
    const metalValue = netWeight * metalRate;
    const makingAmount = data.makingChargesType === 'percentage'
      ? (metalValue * makingCharges / 100) : makingCharges;
    const subtotal = metalValue + makingAmount + stoneValue;
    return (subtotal + subtotal * gstPercent / 100).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'grossWeight' || name === 'stoneWeight') {
        const gross = parseFloat(name === 'grossWeight' ? value : prev.grossWeight) || 0;
        const stone = parseFloat(name === 'stoneWeight' ? value : prev.stoneWeight) || 0;
        updated.netMetalWeight = (gross - stone).toFixed(3);
      }
      if (['metalRate','netMetalWeight','makingCharges','makingChargesType','stoneValue','gstPercent','grossWeight','stoneWeight'].includes(name)) {
        updated.price = recalcPrice(updated);
      }
      return updated;
    });
  };

  const getPurityOptions = () => {
    switch (formData.metalType) {
      case 'Gold': return ['24K (999)', '22K (916)', '18K (750)', '14K (585)'];
      case 'Silver': return ['999 (Fine Silver)', '925 (Sterling)', '800'];
      case 'Platinum': return ['950', '900', '850'];
      case 'Diamond': return ['N/A'];
      default: return [];
    }
  };

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file);
    r.onload = () => res(r.result); r.onerror = rej;
  });

  // Anthropic extraction removed in favor of Tesseract.js
  const handleClearImage = () => {
    const cleared = {};
    aiFilledFields.forEach(f => { cleared[f] = ''; });
    setFormData(prev => ({ ...prev, frontImage: null, ...cleared }));
    setAiFilledFields([]);
    ['uploadProductPhoto', 'uploadDetailsSheet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  // Product photo — visual scan removed per Tesseract.js transition
  const handleProductPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setFormData(prev => ({ ...prev, frontImage: compressed }));
  };

  // Details sheet — structured extraction with Tesseract.js
  const handleDetailsSheetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const lines = text.split('\n').filter(l => l.trim());

      const map = {
        'Product Name': 'name',
        'Type / Category': 'type',
        'Category': 'type',
        'Type': 'type',
        'Metal Type': 'metalType',
        'Purity': 'purity',
        'Gross Weight': 'grossWeight',
        'Stone Weight': 'stoneWeight',
        'Gemstone Type': 'gemstoneType',
        'Number of Stones': 'gemstoneCount',
        'Making Charges': 'makingCharges',
        'Cost Price': 'cost',
        'SKU': 'sku',
        'Description': 'description'
      };

      const updates = {};
      let count = 0;

      lines.forEach(line => {
        let separatorIdx = Math.max(line.indexOf(':'), line.indexOf('-'));
        let labelStr = '';
        let valueStr = '';
        
        if (separatorIdx > -1) {
          labelStr = line.substring(0, separatorIdx).trim();
          valueStr = line.substring(separatorIdx + 1).trim();
        } else {
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
              if (!updates[fieldName]) {
                 // basic cleanup for numerical / alphanumeric matching
                 updates[fieldName] = valueStr.replace(/[^0-9a-zA-Z .,-]/g, '').trim();
                 count++;
              }
            }
          }
        }
      });

      if (count > 0) {
        setFormData(prev => {
          const merged = { ...prev, ...updates };
          if (merged.grossWeight && merged.stoneWeight && !updates.netMetalWeight) {
            merged.netMetalWeight = (parseFloat(merged.grossWeight) - parseFloat(merged.stoneWeight)).toFixed(3);
          }
          if (!updates.price) {
            merged.price = recalcPrice(merged);
          }
          return merged;
        });
        setExtractionBanner({ count });
      } else {
        setError("Tesseract could not find recognizable fields. Make sure the image is clearer.");
      }
    } catch (err) { setError('Extraction failed: ' + err.message); }
    finally { setAiLoading(false); }
  };

  const handleGenerateSKU = async () => {
    if (!formData.type || !formData.purity) { setSkuError('Select Product Type and Purity first'); return; }
    setSkuError('');
    try {
      const metalPurity = formData.purity.split(' ')[0];
      const res = await api.post('/products/generate-sku', { type: formData.type, metalPurity });
      setFormData(prev => ({ ...prev, sku: res.data.sku }));
    } catch { setSkuError('Failed to generate SKU. Try again.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name) errors.name = 'Product name is required';
    if (!formData.type) errors.type = 'Category is required';
    if (!formData.quantity) errors.quantity = 'Quantity is required';
    if (!formData.designer) errors.designer = 'Designer is required';
    if (!formData.metalType) errors.metalType = 'Metal type is required';
    if (!formData.purity) errors.purity = 'Purity is required';
    if (!formData.grossWeight) errors.grossWeight = 'Gross weight is required';
    if (!formData.metalRate) errors.metalRate = 'Metal rate is required';
    if (!formData.makingCharges) errors.makingCharges = 'Making charges required';
    if (!formData.description) errors.description = 'Description is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTimeout(() => { firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const productData = { ...formData };
      if (formData.frontImage && typeof formData.frontImage !== 'string') {
        productData.frontImage = await toBase64(await compressImage(formData.frontImage));
      }
      if (formData.rearImage && typeof formData.rearImage !== 'string') {
        productData.rearImage = await toBase64(await compressImage(formData.rearImage));
      }
      
      if (formData.otherImages && formData.otherImages.length > 0) {
        const existingImages = formData.otherImages.filter(img => typeof img === 'string');
        const newImages = formData.otherImages.filter(img => typeof img !== 'string');
        const newImagesBase64 = newImages.length > 0 
          ? await Promise.all(newImages.map(async img => toBase64(await compressImage(img))))
          : [];
        const allImages = [...existingImages, ...newImagesBase64];
        productData.otherImages = allImages.length > 0 ? JSON.stringify(allImages) : null;
      } else { 
        productData.otherImages = null; 
      }
      
      // Map for phase 2 naming
      productData.metalPurity = productData.purity;
      productData.netWeight = productData.netMetalWeight;

      await api.put(`/products/${id}`, productData);
      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  const metalValue = (parseFloat(formData.netMetalWeight) || 0) * (parseFloat(formData.metalRate) || 0);
  const estimatedMarkup = formData.price && formData.cost ? parseFloat(formData.price) - parseFloat(formData.cost) : 0;
  const estimatedMargin = formData.cost > 0 && formData.price > 0
    ? ((estimatedMarkup / parseFloat(formData.cost)) * 100).toFixed(2) : 0;

  const sectionStyle = { borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' };
  const fc = (field) => `input-field text-sm${fieldErrors[field] ? ' border-red-400' : ''}`;
  const FE = ({ field }) => fieldErrors[field]
    ? <p ref={Object.keys(fieldErrors)[0] === field ? firstErrorRef : null} className="text-xs text-red-600 mt-0.5">{fieldErrors[field]}</p>
    : null;

  const getImageUrl = (image) => {
    if (!image) return null;
    return typeof image === 'string' ? image : URL.createObjectURL(image);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="bg-white min-h-full">
      {/* Page Header matching Jewellery Inventory */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Title on the left */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Jewellery Product</h1>
          </div>

          {/* Big Elaborate Centered Price Summary */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center justify-between gap-4 md:gap-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm px-5 py-2">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Cost Price</p>
                <p className="text-base font-black text-gray-900">₹{formData.cost ? parseFloat(formData.cost).toLocaleString('en-IN') : '0'}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Selling Price</p>
                <p className="text-base font-black text-[#1F3A2E]">₹{formData.price ? parseFloat(formData.price).toLocaleString('en-IN') : '0'}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Markup</p>
                <p className="text-sm font-bold text-gray-700">₹{estimatedMarkup.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Margin</p>
                <p className="text-sm font-bold text-gray-700">{estimatedMargin}%</p>
              </div>
            </div>
          </div>

          {/* Back button on the right */}
          <div>
            <Link to={`/products/${id}`} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm">
              Back
            </Link>
          </div>

        </div>
      </div>

      {/* Form area */}
      <div className="px-4 py-4 max-w-full">
        {extractionBanner && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded px-3 py-2 flex items-center justify-between">
            <p className="text-sm text-blue-800">Details extracted — <strong>{extractionBanner.count} fields filled.</strong> Please review before saving.</p>
            <button type="button" onClick={() => setExtractionBanner(null)} className="text-blue-400 hover:text-blue-600 text-xl leading-none ml-3">&times;</button>
          </div>
        )}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xl leading-none ml-3">&times;</button>
          </div>
        )}
        {hasChanges && !error && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 flex items-center justify-between">
            <p className="text-yellow-800 text-sm">You have unsaved changes.</p>
          </div>
        )}

        {designers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Designers Found</h3>
            <p className="text-gray-600 mb-6">Add at least one active designer before you can edit products</p>
            <Link to="/designers/new" className="inline-block px-6 py-2 bg-[#1F3A2E] text-white font-medium rounded-lg hover:bg-[#243d32] transition-colors">
              Add Your First Designer
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* ── Left: Form ── */}
              <div className="lg:col-span-2 bg-white rounded-lg px-5 pt-4 pb-2">

                {/* Image + Name row */}
                <div style={sectionStyle}>
                  <div className="flex items-start gap-4">
                    {/* Upload box */}
                    <div style={{ flexShrink: 0, width: 120 }}>
                      <input type="file" accept="image/*" onChange={handleProductPhotoUpload} className="hidden" id="uploadProductPhoto" />
                      <input type="file" accept="image/*" onChange={handleDetailsSheetUpload} className="hidden" id="uploadDetailsSheet" />

                      {/* Box with × button */}
                      <div className="relative" style={{ width: 120, height: 110 }}>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden w-full h-full"
                          onClick={() => !formData.frontImage && document.getElementById('uploadProductPhoto').click()}
                        >
                          {formData.frontImage ? (
                            <img src={getImageUrl(formData.frontImage)} alt="Preview" className="w-full h-full object-contain" />
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-gray-500 text-center px-1 leading-tight">Upload photo</span>
                            </>
                          )}
                        </div>
                        {/* × clear button */}
                        {formData.frontImage && (
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="absolute top-1 right-1 w-5 h-5 bg-gray-900 bg-opacity-60 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all"
                            style={{ fontSize: 12, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Upload action buttons */}
                      <div className="mt-1.5 flex flex-col gap-1">
                        <button type="button" disabled={aiLoading}
                          onClick={() => document.getElementById('uploadProductPhoto').click()}
                          className="w-full text-xs px-1 py-1 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 truncate">
                          Product photo
                        </button>
                        <button type="button" disabled={aiLoading}
                          onClick={() => document.getElementById('uploadDetailsSheet').click()}
                          className="w-full text-xs px-1 py-1 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 truncate">
                          {aiLoading ? 'Reading document...' : 'Details sheet'}
                        </button>
                      </div>
                    </div>

                    {/* Name / Category / Qty */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange}
                          className={fc('name')} placeholder="e.g., Diamond Eternity Ring" />
                        <FE field="name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Type / Category *</label>
                        <select name="type" value={formData.type} onChange={handleChange} className={fc('type')}>
                          <option value="">Select category</option>
                          {['Ring','Necklace','Bracelet','Earring','Pendant','Anklet','Bangle','Chain','Others'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <FE field="type" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                          className={fc('quantity')} min="0" placeholder="0" />
                        <FE field="quantity" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                      <textarea name="description" value={formData.description} onChange={handleChange}
                        className={fc('description')} rows="3"
                        placeholder="Enter detailed product description, materials, features, etc." />
                      <FE field="description" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Designer *</label>
                      <select name="designer" value={formData.designer} onChange={handleChange} className={fc('designer')}>
                        <option value="">Select a designer</option>
                        {designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <FE field="designer" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Occasion</label>
                      <select name="occasion" value={formData.occasion} onChange={handleChange} className="input-field text-sm">
                        <option value="">Select occasion</option>
                        {['Wedding','Engagement','Daily Wear','Festive','Party'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="input-field text-sm">
                        <option value="">Select gender</option>
                        <option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
                      <input type="text" name="size" value={formData.size} onChange={handleChange}
                        className="input-field text-sm" placeholder="e.g., 7, 18 inches" />
                    </div>
                  </div>
                </div>

                {/* Metal & Purity */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Metal & Purity</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Metal Type *</label>
                      <select name="metalType" value={formData.metalType} onChange={handleChange} className={fc('metalType')}>
                        <option value="">Select metal type</option>
                        <option value="Gold">Gold</option><option value="Silver">Silver</option>
                        <option value="Platinum">Platinum</option><option value="Diamond">Diamond</option>
                      </select>
                      <FE field="metalType" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Purity / Karat *</label>
                      <select name="purity" value={formData.purity} onChange={handleChange}
                        className={fc('purity')} disabled={!formData.metalType}>
                        <option value="">Select purity</option>
                        {getPurityOptions().map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                      {!formData.metalType && <p className="text-xs text-gray-500 mt-0.5">Select metal type first</p>}
                      <FE field="purity" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Hallmark Certified</label>
                      <div className="flex items-center gap-6 mt-1">
                        {['yes','no'].map(v => (
                          <label key={v} className="flex items-center cursor-pointer">
                            <input type="radio" name="hallmarkCertified" value={v}
                              checked={formData.hallmarkCertified === v} onChange={handleChange}
                              className="w-4 h-4 text-[#1F3A2E] focus:ring-[#1F3A2E]" />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Certification Authority</label>
                      <select name="certificationAuthority" value={formData.certificationAuthority} onChange={handleChange} className="input-field text-sm">
                        <option value="">Select authority</option>
                        <option value="BIS">BIS (Bureau of Indian Standards)</option>
                        <option value="IGI">IGI (International Gemological Institute)</option>
                        <option value="GIA">GIA (Gemological Institute of America)</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weight Details */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Weight Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Gross Weight (g) *</label>
                      <input type="number" name="grossWeight" value={formData.grossWeight} onChange={handleChange}
                        className={fc('grossWeight')} step="0.001" placeholder="0.000" />
                      <FE field="grossWeight" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Stone Weight (g/ct)</label>
                      <input type="number" name="stoneWeight" value={formData.stoneWeight} onChange={handleChange}
                        className="input-field text-sm" step="0.001" placeholder="0.000" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Net Metal Weight (g)</label>
                      <input type="number" name="netMetalWeight" value={formData.netMetalWeight}
                        className="input-field text-sm bg-gray-50" readOnly placeholder="Auto-calculated" />
                    </div>
                  </div>
                </div>

                {/* Gemstone Information */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Gemstone Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Gemstone Type</label>
                      <select name="gemstoneType" value={formData.gemstoneType} onChange={handleChange} className="input-field text-sm">
                        <option value="">None / Not Applicable</option>
                        {['Diamond','Emerald','Ruby','Sapphire','Pearl','Coral','Topaz','Others'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Stones</label>
                      <input type="number" name="gemstoneCount" value={formData.gemstoneCount} onChange={handleChange}
                        className="input-field text-sm" min="0" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Total Carats</label>
                      <input type="number" name="gemstoneCarat" value={formData.gemstoneCarat} onChange={handleChange}
                        className="input-field text-sm" step="0.001" min="0" placeholder="0.000" />
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Pricing Breakdown</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Metal Rate (₹/g) *</label>
                        <input type="number" name="metalRate" value={formData.metalRate} onChange={handleChange}
                          className={fc('metalRate')} step="0.01" placeholder="Current market rate" />
                        <FE field="metalRate" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Metal Value (₹)</label>
                        <input type="number" value={metalValue > 0 ? metalValue.toFixed(2) : '0'}
                          className="input-field text-sm bg-gray-50" readOnly />
                        <p className="text-xs text-[#1F3A2E] mt-0.5">Auto-calculated</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Making Charges *</label>
                        <div className="flex gap-2">
                          <input type="number" name="makingCharges" value={formData.makingCharges} onChange={handleChange}
                            className={`${fc('makingCharges')} flex-1`} step="0.01" placeholder="0.00" />
                          <select name="makingChargesType" value={formData.makingChargesType} onChange={handleChange}
                            className="input-field text-sm w-24">
                            <option value="flat">₹ Flat</option>
                            <option value="percentage">% Metal</option>
                          </select>
                        </div>
                        <FE field="makingCharges" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Stone Value (₹)</label>
                        <input type="number" name="stoneValue" value={formData.stoneValue} onChange={handleChange}
                          className="input-field text-sm" step="0.01" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">GST %</label>
                        <select name="gstPercent" value={formData.gstPercent} onChange={handleChange} className="input-field text-sm">
                          <option value="0">0% - No GST</option>
                          <option value="3">3% - Gold/Silver</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Final Selling Price (₹)</label>
                        <input type="number" name="price" value={formData.price}
                          className="input-field text-sm bg-yellow-50 font-bold text-green-700" readOnly />
                        <p className="text-xs text-[#1F3A2E] mt-0.5">Auto-calculated with GST</p>
                      </div>
                    </div>

                    {formData.metalRate && formData.netMetalWeight && (
                      <div className="p-3 bg-green-50 rounded border border-green-100">
                        <h4 className="text-xs font-semibold text-green-800 mb-2">Price Summary</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Metal ({formData.netMetalWeight}g × ₹{formData.metalRate})</span>
                            <span className="font-medium">₹{metalValue.toFixed(2)}</span>
                          </div>
                          {formData.makingCharges && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Making Charges</span>
                              <span className="font-medium">₹{formData.makingChargesType === 'flat'
                                ? parseFloat(formData.makingCharges).toFixed(2)
                                : (metalValue * parseFloat(formData.makingCharges) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {formData.stoneValue && parseFloat(formData.stoneValue) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Stone Value</span>
                              <span className="font-medium">₹{parseFloat(formData.stoneValue).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-green-300 pt-1 flex justify-between">
                            <span className="text-green-800 font-bold">Final Price</span>
                            <span className="font-bold text-green-700">₹{formData.price || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Cost Price (₹) <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <input type="number" name="cost" value={formData.cost} onChange={handleChange}
                        className="input-field text-sm" step="0.01" placeholder="Your purchase/manufacturing cost" />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div style={sectionStyle}>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Additional Details</h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Item Code</label>
                    <div className="flex items-center space-x-2">
                      <input type="text" name="sku" value={formData.sku} onChange={handleChange}
                        className="input-field text-sm flex-1" placeholder="e.g., RNG-22K-0001" />
                      <button type="button" onClick={handleGenerateSKU}
                        className="px-4 py-2 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors text-sm font-medium whitespace-nowrap">
                        Generate SKU
                      </button>
                    </div>
                    {skuError && <p className="text-xs text-red-600 mt-0.5">{skuError}</p>}
                  </div>
                </div>

                {/* Advanced Fields */}
                <div className="pb-3">
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-[#1F3A2E] hover:underline font-medium">
                    {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
                  </button>
                </div>

                {showAdvanced && (
                  <>
                    <div style={sectionStyle}>
                      <h2 className="text-sm font-bold text-gray-900 mb-3">Cancellation & Returns</h2>
                      <div className="flex items-center gap-6">
                        {['yes','no'].map(v => (
                          <label key={v} className="flex items-center cursor-pointer">
                            <input type="radio" name="returnable" value={v}
                              checked={formData.returnable === v} onChange={handleChange}
                              className="w-4 h-4 text-[#1a1d2e] focus:ring-[#1a1d2e]" />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={sectionStyle}>
                      <h2 className="text-sm font-bold text-gray-900 mb-3">Dimensions (L × W × H)</h2>
                      <div className="flex items-center gap-2">
                        {['dimensionLength','dimensionWidth','dimensionHeight'].map((dim, i) => (
                          <React.Fragment key={dim}>
                            <input type="number" name={dim} value={formData[dim]} onChange={handleChange}
                              className="input-field text-sm" placeholder={['L','W','H'][i]} step="0.01" />
                            {i < 2 && <span className="text-gray-500 font-bold">×</span>}
                          </React.Fragment>
                        ))}
                        <select name="dimensionUnit" value={formData.dimensionUnit} onChange={handleChange}
                          className="input-field text-sm w-20">
                          <option value="cm">cm</option><option value="mm">mm</option><option value="in">in</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pb-5 pt-2">
                  <button type="submit" disabled={submitting || !hasChanges}
                    className="px-6 py-2.5 bg-[#1F3A2E] text-white font-bold rounded-lg hover:bg-[#243d32] transition-colors text-sm disabled:opacity-50">
                    {submitting ? 'Updating...' : hasChanges ? 'Update Product' : 'No Changes'}
                  </button>
                  <Link to={`/products/${id}`} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Cancel
                  </Link>
                </div>
              </div>

              {/* ── Right: Product Preview — fully sticky ── */}
              <div className="lg:col-span-1">
                <div style={{ position: 'sticky', top: 50 }}
                  className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Product Preview</h3>

                  {/* Image — max 260px height */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden"
                    style={{ height: 260 }}>
                    {formData.frontImage
                      ? <img src={getImageUrl(formData.frontImage)} alt="Preview" className="w-full h-full object-contain" />
                      : <p className="text-xs text-gray-400">No image</p>
                    }
                  </div>

                  {/* Compact details */}
                  <div className="space-y-1.5" style={{ fontSize: 12 }}>
                    <div>
                      <span className="text-gray-500">Name: </span>
                      <span className="font-semibold text-gray-900">{formData.name || '—'}</span>
                    </div>
                    {[
                      { label: 'Category', value: formData.type },
                      { label: 'Metal', value: formData.metalType },
                      { label: 'Purity', value: formData.purity },
                      { label: 'Net Weight', value: formData.netMetalWeight ? `${formData.netMetalWeight}g` : null },
                      { label: 'Qty', value: formData.quantity ? `${formData.quantity} pcs` : null },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between border-t border-gray-100 pt-1.5">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{value || '—'}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                      <span className="text-gray-700 font-semibold">Final Price</span>
                      <span className="font-bold text-gray-900 text-sm">₹{formData.price ? parseFloat(formData.price).toLocaleString() : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductEdit;
