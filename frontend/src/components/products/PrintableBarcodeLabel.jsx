import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * PrintableBarcodeLabel Component
 * 
 * Displays a print-friendly barcode label for jewellery items
 * Can be used to print labels that attach to jewellery boxes/tags
 */
const PrintableBarcodeLabel = ({ product, showHeader = true, showQR = false }) => {
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="barcode-label-container">
      {/* Print Button (hidden on print) */}
      <div className="print:hidden mb-4 flex justify-end">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Label
        </button>
      </div>

      {/* Printable Label */}
      <div className="barcode-label bg-white border-2 border-gray-800 rounded p-6 max-w-2xl mx-auto print:border-black print:max-w-none">
        {/* Shop Header */}
        {showHeader && (
          <div className="text-center border-b-2 border-gray-800 pb-3 mb-4 print:border-black">
            <h1 className="text-2xl font-bold text-gray-900">Your Jewellery Shop</h1>
            <p className="text-sm text-gray-600">Premium Gold & Diamond Jewellery</p>
            <p className="text-xs text-gray-500 mt-1">+91 98765 43210 | info@yourjewellery.com</p>
          </div>
        )}

        {/* Product Information */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-semibold">{product.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Price:</span>
              <span className="ml-2 font-semibold text-green-600">₹{product.price?.toLocaleString()}</span>
            </div>
            {product.metalPurity && (
              <div>
                <span className="text-gray-600">Purity:</span>
                <span className="ml-2 font-semibold">{product.metalPurity}</span>
              </div>
            )}
            {product.grossWeight && (
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-2 font-semibold">{product.grossWeight}g</span>
              </div>
            )}
          </div>
        </div>

        {/* Barcode Section */}
        <div className="border-2 border-gray-300 rounded p-4 bg-white print:border-gray-800">
          <div className="text-center">
            {product.sku ? (
              <>
                <Barcode
                  value={product.sku}
                  height={70}
                  fontSize={16}
                  displayValue={true}
                  background="#ffffff"
                  lineColor="#000000"
                  margin={5}
                />
                <p className="text-xs text-gray-600 mt-2 font-mono font-bold">{product.sku}</p>
              </>
            ) : (
              <p className="text-red-600 font-semibold">SKU Not Available</p>
            )}
          </div>
        </div>

        {/* QR Code (Optional) */}
        {showQR && product.sku && (
          <div className="mt-4 text-center border-t-2 border-gray-200 pt-4 print:border-gray-600">
            <p className="text-xs text-gray-600 mb-2">QR Code for Mobile Scanning</p>
            <div className="inline-block p-2 bg-white border border-gray-300 rounded">
              <QRCodeCanvas
                value={JSON.stringify({
                  sku: product.sku,
                  name: product.name,
                  price: product.price,
                  id: product.id
                })}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        )}

        {/* Footer Instructions */}
        <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-200 pt-2 print:border-gray-400">
          <p>Scan this barcode at billing counter for quick checkout</p>
          <p className="mt-1">Goods once sold cannot be returned or exchanged</p>
        </div>
      </div>

      {/* Print Styling */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .barcode-label-container {
            margin: 0;
            padding: 10mm;
          }
          
          .barcode-label {
            border: 2px solid #000 !important;
            page-break-inside: avoid;
            max-width: 100%;
            box-shadow: none;
          }
          
          /* Hide all other elements except the label */
          body * {
            visibility: hidden;
          }
          
          .barcode-label-container,
          .barcode-label-container * {
            visibility: visible;
          }
          
          .barcode-label-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Optimize for thermal printers (80mm width) */
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          
          /* For A4 label sheets */
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * BarcodeSheetPrint Component
 * 
 * Prints multiple barcode labels on one page (useful for bulk printing)
 */
export const BarcodeSheetPrint = ({ products }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="barcode-sheet-container">
      {/* Print Button */}
      <div className="print:hidden mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Bulk Barcode Print Sheet</h2>
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors font-medium"
        >
          Print All Labels ({products.length})
        </button>
      </div>

      {/* Label Grid - 2x4 labels per page */}
      <div className="grid grid-cols-2 gap-4 print:gap-2">
        {products.map((product) => (
          <div key={product.id} className="border-2 border-gray-800 rounded p-4 bg-white print:border-black print:break-inside-avoid">
            <div className="text-center">
              <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
              <p className="text-xs text-gray-600 mb-2">₹{product.price?.toLocaleString()} | {product.type}</p>
              {product.sku ? (
                <Barcode
                  value={product.sku}
                  height={40}
                  fontSize={10}
                  displayValue={true}
                  background="#ffffff"
                  lineColor="#000000"
                  width={1.5}
                />
              ) : (
                <p className="text-xs text-red-600">No SKU</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .barcode-sheet-container,
          .barcode-sheet-container * {
            visibility: visible;
          }
          
          .barcode-sheet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableBarcodeLabel;
