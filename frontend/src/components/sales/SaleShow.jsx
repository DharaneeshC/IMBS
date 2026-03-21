import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { FiArrowLeft, FiPrinter, FiDownload, FiPhone, FiMail } from 'react-icons/fi';

const numberToWords = (num) => {
    if (!num) return '';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanOneThousand = (n) => {
        if (n === 0) return '';
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
        return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };
    
    let str = '';
    
    // Crores
    if (num >= 10000000) {
        str += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    
    // Lakhs
    if (num >= 100000) {
        str += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    
    // Thousands
    if (num >= 1000) {
        str += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    
    str += convertLessThanOneThousand(num);
    
    return str.trim() + ' Rupees Only';
};

const SaleShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSale();
    }, [id]);

    const fetchSale = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/sales/${id}`);
            setSale(response.data.data);
        } catch (error) {
            console.error('Error fetching sale:', error);
            alert('Failed to load invoice');
            navigate('/sales/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!sale) {
        return null;
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate GST breakdown (CGST/SGST for intrastate, IGST for interstate)
    const calculateGSTBreakdown = () => {
        const taxAmount = parseFloat(sale.taxAmount) || 0;
        // Assuming intrastate - split into CGST/SGST (9% each for 18% GST)
        const isInterstate = false; // Could be determined by state comparison
        
        if (isInterstate) {
            return { igst: taxAmount, cgst: 0, sgst: 0 };
        } else {
            return { igst: 0, cgst: taxAmount / 2, sgst: taxAmount / 2 };
        }
    };

    const gstBreakdown = sale ? calculateGSTBreakdown() : { cgst: 0, sgst: 0, igst: 0 };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button
                    onClick={() => navigate('/sales/invoices')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <FiArrowLeft /> Back to Invoices
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-[#1a2e1a] border border-[#1a2e1a] rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <FiPrinter /> Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a2e1a] text-white rounded-lg hover:bg-[#243d32] transition-colors"
                    >
                        <FiDownload /> Download PDF
                    </button>
                </div>
            </div>

            {/* Invoice */}
            <div className="bg-white dark:bg-gray-800 border-[0.5px] border-[#e0e0e0] rounded-lg p-6 max-w-[800px] mx-auto invoice-print">
                {/* Invoice Header with Logo */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                        {/* Company Logo & Name */}
                        <div className="flex items-start gap-4">
                            <div className="w-[44px] h-[44px] flex items-center justify-center rounded-[6px] bg-[#1a2e1a] text-white text-[18px] font-semibold">
                                SJ
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">SHANMUGA JEWELLERS</h2>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Premium Gold & Diamond Jewellery</p>
                            </div>
                        </div>
                        {/* Invoice Details */}
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1 text-[#111111]">INVOICE</h1>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{sale.invoiceNumber}</p>
                        </div>
                    </div>
                    
                    {/* Company Details */}
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Shop Address:</p>
                            <p>123 Jewellers Street, T.Nagar</p>
                            <p>Chennai, Tamil Nadu 600017</p>
                            <p className="mt-2"><strong>Phone:</strong> +91 98765 43210</p>
                            <p><strong>Email:</strong> shanmugajewellers@gmail.com</p>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p><strong className="text-gray-900 dark:text-white">GST No:</strong> 33AABCS1234F1Z5</p>
                            <p><strong className="text-gray-900 dark:text-white">PAN:</strong> AABCS1234F</p>
                            <p><strong className="text-gray-900 dark:text-white">State:</strong> Tamil Nadu (33)</p>
                            <p className="mt-2"><strong className="text-gray-900 dark:text-white">Bank:</strong> HDFC Bank</p>
                            <p><strong className="text-gray-900 dark:text-white">A/C:</strong> 50100987654321</p>
                            <p><strong className="text-gray-900 dark:text-white">IFSC:</strong> HDFC0001234</p>
                        </div>
                    </div>
                </div>

                {/* Customer and Date Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Bill to:</h3>
                        <div className="text-gray-900 dark:text-gray-100">
                            <p className="font-semibold text-sm mb-1">{sale.customerName}</p>
                            {sale.customerPhone && (
                                <p className="flex items-center gap-2 text-xs">
                                    <FiPhone className="text-gray-400" /> {sale.customerPhone}
                                </p>
                            )}
                            {sale.customerEmail && (
                                <p className="flex items-center gap-2 text-xs">
                                    <FiMail className="text-gray-400" /> {sale.customerEmail}
                                </p>
                            )}
                            {sale.customerAddress && (
                                <p className="text-xs mt-1">{sale.customerAddress}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Date</p>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{formatDate(sale.saleDate)}</p>
                        </div>
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 capitalize">{sale.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Payment Status</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize
                                ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                                  sale.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-orange-100 text-orange-800'}`}>
                                {sale.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table with Weight Details */}
                <div className="mb-8 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Product</th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Weight (g)</th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unit Price</th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">GST%</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">GST Amt</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items && sale.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-3 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{item.product?.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.product?.type}
                                            {item.product?.sku && ` • SKU: ${item.product.sku}`}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <div className="text-gray-900 dark:text-gray-100 text-xs">
                                            {item.product?.grossWeight ? (
                                                <>
                                                    <div><strong>Gross:</strong> {parseFloat(item.product.grossWeight).toFixed(3)}g</div>
                                                    {item.product?.netWeight && <div><strong>Net:</strong> {parseFloat(item.product.netWeight).toFixed(3)}g</div>}
                                                    {item.product?.stoneWeight && <div><strong>Stone:</strong> {parseFloat(item.product.stoneWeight).toFixed(3)}g</div>}
                                                </>
                                            ) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center text-gray-900 dark:text-gray-100 font-medium">{item.quantity}</td>
                                    <td className="px-3 py-3 text-right text-gray-900 dark:text-gray-100">₹{parseFloat(item.unitPrice).toFixed(2)}</td>
                                    <td className="px-3 py-3 text-center text-gray-900 dark:text-gray-100">{item.taxRate}%</td>
                                    <td className="px-3 py-3 text-right text-gray-900 dark:text-gray-100">₹{parseFloat(item.taxAmount).toFixed(2)}</td>
                                    <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-white">₹{parseFloat(item.lineTotal).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals with GST Breakdown */}
                <div className="flex justify-end mt-4">
                    <div className="w-[340px]">
                        <div className="flex justify-between mb-2 text-xs text-gray-700 dark:text-gray-300">
                            <span>Subtotal (Before Tax):</span>
                            <span className="font-semibold">₹{parseFloat(sale.subtotal).toFixed(2)}</span>
                        </div>
                        
                        {/* GST Breakdown */}
                        <div className="p-3 rounded-lg mb-2 bg-[#f5f5f0] border border-gray-200">
                            <div className="text-xs font-semibold mb-1 text-[#111111]">GST Breakdown:</div>
                            {gstBreakdown.cgst > 0 && (
                                <>
                                    <div className="flex justify-between text-xs text-[#111111]">
                                        <span>CGST @ 9%:</span>
                                        <span className="font-semibold">₹{gstBreakdown.cgst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-[#111111]">
                                        <span>SGST @ 9%:</span>
                                        <span className="font-semibold">₹{gstBreakdown.sgst.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            {gstBreakdown.igst > 0 && (
                                <div className="flex justify-between text-xs text-[#111111]">
                                    <span>IGST @ 18%:</span>
                                    <span className="font-semibold">₹{gstBreakdown.igst.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold mt-1 pt-1 text-[#111111] border-t border-gray-300">
                                <span>Total GST:</span>
                                <span>₹{parseFloat(sale.taxAmount).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {sale.discountAmount > 0 && (
                            <div className="flex justify-between mb-2 text-xs text-green-600 dark:text-green-400">
                                <span>Discount:</span>
                                <span className="font-semibold">-₹{parseFloat(sale.discountAmount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                <span>Total Amount:</span>
                                <span className="text-[#111111]">₹{parseFloat(sale.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {/* Amount in Words */}
                        <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-400 italic border-t border-gray-200 pt-1">
                            <strong>Amount in Words:</strong> 
                            <span className="ml-1">
                                {numberToWords(Math.round(sale.totalAmount))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Notes:</h3>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{sale.notes}</p>
                    </div>
                )}

                {/* Footer with Terms & Barcode */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Terms & conditions:</h3>
                            <ul className="text-[10px] text-gray-600 dark:text-gray-400 space-y-0.5 list-none">
                                <li>• Goods once sold cannot be returned or exchanged</li>
                                <li>• Subject to Chennai jurisdiction only</li>
                                <li>• Making charges are non-refundable</li>
                                <li>• Please verify weight and purity before purchase</li>
                            </ul>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">For SHANMUGA JEWELLERS</p>
                                <div className="border-t border-gray-400 inline-block px-8 pt-1">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Authorized Signatory</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Barcode Section */}
                    <div className="mt-4 text-center border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="inline-block">
                            <svg className="mx-auto" width="150" height="30" xmlns="http://www.w3.org/2000/svg">
                                {/* Simple barcode representation using vertical lines based on invoice number */}
                                {sale.invoiceNumber.split('').map((char, i) => {
                                    const width = (char.charCodeAt(0) % 3) + 1;
                                    const x = i * 10;
                                    return <rect key={i} x={x} y="0" width={width} height="30" fill="#000" />;
                                })}
                            </svg>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 font-mono">{sale.invoiceNumber}</p>
                        </div>
                    </div>
                    
                    <div className="text-center text-[11px] text-[#888888] mt-3">
                        <p className="font-semibold text-[#111111]">Thank you for your business!</p>
                        <p className="mt-0.5">For any queries, please contact us at shanmugajewellers@gmail.com or call +91 98765 43210</p>
                    </div>
                </div>
            </div>
            
            {/* Print & PDF Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .invoice-print, .invoice-print * {
                        visibility: visible;
                    }

                    .invoice-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        max-width: none !important;
                        font-size: 12px;
                        line-height: 1.4;
                    }

                    /* Ensure background colors print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Hide specific print-hidden elements (buttons etc) just in case */
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SaleShow;