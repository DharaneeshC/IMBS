import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { HiShieldExclamation, HiClipboardCopy, HiDuplicate } from 'react-icons/hi';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';

const ProductShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        navigate('/products');
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      // Create a copy of the product
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        sku: null // Generate new SKU
      };
      delete duplicatedProduct.id;
      delete duplicatedProduct.createdAt;
      delete duplicatedProduct.updatedAt;

      const response = await api.post('/products', duplicatedProduct);
      navigate(`/products/${response.data.id}`);
    } catch (err) {
      alert('Failed to duplicate product');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handlePrintLabel = async () => {
    if (!product.sku) {
      alert('Cannot print label: No SKU available');
      return;
    }

    try {
      // Generate barcode as base64 using existing barcode element
      const barcodeElement = document.getElementById('barcode-section');
      let barcodeBase64 = '';

      if (barcodeElement) {
        const barcodeCanvas = barcodeElement.querySelector('canvas');
        if (barcodeCanvas) {
          barcodeBase64 = barcodeCanvas.toDataURL('image/png');
        }
      }

      // If barcode canvas not found, create one using JsBarcode
      if (!barcodeBase64) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple barcode pattern (placeholder - you may want to install jsbarcode)
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(product.sku, canvas.width/2, canvas.height - 5);

        // Draw simple barcode lines
        for (let i = 0; i < product.sku.length; i++) {
          const x = 20 + (i * 8);
          ctx.fillRect(x, 5, 2, 25);
          ctx.fillRect(x + 4, 5, 1, 25);
        }

        barcodeBase64 = canvas.toDataURL('image/png');
      }

      // Generate QR code as base64 using existing QR element
      const qrElement = document.getElementById('qrcode-section');
      let qrBase64 = '';

      if (qrElement) {
        const qrCanvas = qrElement.querySelector('canvas');
        if (qrCanvas) {
          qrBase64 = qrCanvas.toDataURL('image/png');
        }
      }

      // If no QR code available, create placeholder
      if (!qrBase64) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 80;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 10, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(15, 15, 50, 50);
        qrBase64 = canvas.toDataURL('image/png');
      }

      // Open print window with ultra-compact layout (business card size)
      const printWindow = window.open('', '_blank', 'width=300,height=200');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jewelry Tag - ${product.name}</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: 3.5in 2in;
              }
              body { margin: 0; padding: 0; }
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              background: white;
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .tag {
              width: 240px;
              height: 120px;
              background: white;
              display: flex;
              flex-direction: column;
            }

            .product-name {
              font-size: 9px;
              font-weight: bold;
              text-align: center;
              padding: 2px;
              line-height: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .codes-row {
              flex: 1;
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 2px;
            }

            .barcode-section {
              flex: 1;
              text-align: center;
            }

            .qr-section {
              width: 60px;
              text-align: center;
            }

            .barcode-img {
              width: 140px;
              height: 35px;
              object-fit: contain;
            }

            .qr-img {
              width: 55px;
              height: 55px;
              object-fit: contain;
            }

            .sku {
              font-size: 7px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 1px;
              line-height: 1;
            }

            @media screen {
              body {
                padding: 10px;
                background: #f5f5f5;
              }
              .tag {
                border: 1px solid #ccc;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="product-name">${product.name}</div>
            <div class="codes-row">
              <div class="barcode-section">
                <img src="${barcodeBase64}" alt="Barcode" class="barcode-img">
                <div class="sku">${product.sku}</div>
              </div>
              <div class="qr-section">
                <img src="${qrBase64}" alt="QR Code" class="qr-img">
              </div>
            </div>
          </div>

          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 500);
            });
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error('Error generating label:', error);
      alert('Failed to generate label. Please try again.');
    }
  };

  const formatIndianCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const markup = product.price - product.cost;
  const markupPercentage = ((markup / product.cost) * 100).toFixed(0);

  const getStockStatus = () => {
    if (product.quantity <= 0) return 'Out of Stock';
    if (product.quantity <= 5) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="bg-white min-h-full">
      {/* Breadcrumb Bar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-2">
          <nav className="flex items-center text-sm text-gray-600 font-semibold">
            <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-bold">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 pt-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column - Image Zone */}
          <div className="lg:col-span-4">
            {/* Image - no border, no card */}
            <div className="w-full">
              <img
                src={product.frontImage || "https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Action Links */}
            <div className="mt-3 mb-0 text-center text-sm space-x-3">
              <Link to={`/products/${id}/edit`} className="text-gray-900 hover:text-[#1F3A2E] transition-colors font-bold">
                Edit
              </Link>
              <button onClick={handleDuplicate} className="text-gray-900 hover:text-[#1F3A2E] transition-colors font-bold">
                Duplicate
              </button>
              <button onClick={handleDelete} className="text-red-600 hover:text-red-700 transition-colors font-bold">
                Delete
              </button>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="lg:col-span-8">

            {/* Product Identity Section */}
            <div className="pb-4 border-b border-gray-200">
              {/* Line 1: Name + Category */}
              <h1 className="text-[28px] font-bold text-[#000] leading-tight">
                {product.name} <span className="text-[16px] text-[#333] font-semibold ml-2">{product.type}</span>
              </h1>

              {/* Line 2: Metal & Purity */}
              <div className="text-[16px] text-[#222] mt-2 font-semibold">
                18K White Gold    Diamond    1 ct
              </div>

              {/* Line 3: SKU */}
              <div className="flex items-center gap-1.5 text-[15px] text-[#222] mt-2 font-semibold">
                <span>SKU: <span className="font-mono font-bold">{product.sku || 'Not Generated'}</span></span>
                {product.sku && (
                  <button
                    onClick={() => copyToClipboard(product.sku)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy SKU"
                  >
                    <HiClipboardCopy className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Line 4: Description */}
              <p className="text-[16px] text-[#111] mt-3 leading-relaxed font-medium">
                {product.description}
              </p>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Line 5: Cost · Selling · Margin · Markup - all one line */}
              <div className="text-[16px] text-[#000] font-bold">
                Cost ₹{formatIndianCurrency(product.cost)} &nbsp;•&nbsp; Selling ₹{formatIndianCurrency(product.price)} &nbsp;•&nbsp; Margin {markupPercentage}% &nbsp;•&nbsp; Markup ₹{formatIndianCurrency(markup)}
              </div>
            </div>

            {/* Stock Section */}
            <div className="pt-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {/* Left side: Qty · Status · Add to Sale */}
                <div className="flex items-center gap-3 text-[20px]">
                  <span className="font-bold text-[#000]">Qty: {product.quantity}</span>
                  <span className="text-[#999]">•</span>
                  <span className="text-[15px] text-[#2a7a2a] font-bold">
                    {getStockStatus()}
                  </span>
                  <span className="text-[#999]">•</span>
                  <Link
                    to={`/sales/new?product=${product.id}`}
                    className="text-[15px] text-[#000] hover:underline transition-colors font-bold"
                  >
                    Add to Sale
                  </Link>
                </div>

                {/* Right side: Total value */}
                <div className="text-[17px] text-[#000] font-bold">
                  Total value: ₹{formatIndianCurrency(product.price * product.quantity)}
                </div>
              </div>

              {/* Second row: Weight & Last updated */}
              <div className="text-[15px] text-[#222] mt-3 font-semibold flex items-center gap-2">
                Net weight: 4.2g <span className="text-gray-400">•</span> Gross: 5.1g <span className="text-gray-400">•</span> Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Low Stock Warning (if applicable) */}
              {product.quantity > 0 && product.quantity <= 5 && (
                <div className="mt-3 text-[14px] text-amber-800 bg-amber-50 px-4 py-3 rounded font-bold">
                  Low stock alert: Only {product.quantity} {product.quantity === 1 ? 'item' : 'items'} remaining
                </div>
              )}
            </div>

            {/* Barcode & Designer Section */}
            <div className="border-t border-gray-200 pt-4 pb-0">
              <div className="flex items-center justify-between">

                {/* Left: Barcode */}
                <div className="flex-shrink-0">
                  <div className="w-[140px] h-[50px] flex items-center justify-center" id="barcode-section">
                    {product.sku ? (
                      <Barcode
                        value={product.sku}
                        height={40}
                        fontSize={10}
                        displayValue={false}
                        background="#ffffff"
                        lineColor="#000000"
                        width={1.2}
                      />
                    ) : (
                      <p className="text-gray-400 text-xs">No SKU</p>
                    )}
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-[13px] font-bold text-gray-900">{product.sku || 'N/A'}</div>
                    <div className="text-[12px] text-gray-500 font-semibold">Barcode (1D)</div>
                  </div>
                </div>

                {/* Center: QR Code */}
                <div className="flex-shrink-0 mx-6">
                  <div className="w-[70px] h-[70px] flex items-center justify-center" id="qrcode-section">
                    {product.sku ? (
                      <QRCodeCanvas
                        value={JSON.stringify({
                          sku: product.sku,
                          name: product.name,
                          price: product.price,
                          id: product.id
                        })}
                        size={70}
                        level="H"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="w-[70px] h-[70px] bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No QR
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-[12px] text-gray-500 font-semibold">QR Code (2D)</div>
                  </div>
                </div>

                {/* Right side: Designer + Print button */}
                <div className="flex-1 flex items-center justify-between ml-6">
                  {/* Designer */}
                  <div className="text-[16px] text-[#000] font-bold">
                    {product.designer ? (
                      <>
                        Designer: <Link to={`/designers/${product.designer.id}`} className="text-[#1F3A2E] hover:underline font-bold">{product.designer.name}</Link>
                      </>
                    ) : (
                      <span className="text-gray-400">No designer assigned</span>
                    )}
                  </div>

                  {/* Print Label button - outlined style */}
                  <button
                    onClick={handlePrintLabel}
                    className="px-5 py-2.5 border-2 border-gray-400 text-gray-900 rounded hover:bg-gray-50 transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Label
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShow;


