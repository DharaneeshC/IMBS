import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { HiX } from 'react-icons/hi';

/**
 * Extracts a clean SKU from a raw QR code scan result.
 *
 * QR codes on jewellery products may contain:
 *   - plain SKU:  "GEN-0006"
 *   - URL:        "https://example.com/products/GEN-0006"
 *   - JSON:       '{"sku":"GEN-0006","name":"Ring"}'
 *   - padded:     "  GEN-0006\n"
 *
 * Strategy:
 *  1. Trim whitespace / newlines.
 *  2. If it looks like a URL, take the last path segment.
 *  3. If it looks like JSON try to parse "sku" / "code" / "id" fields.
 *  4. Return whatever is left (trimmed & uppercased).
 */
function extractSku(raw) {
    let text = raw.trim();

    // Try JSON
    if (text.startsWith('{') || text.startsWith('[')) {
        try {
            const parsed = JSON.parse(text);
            const sku = parsed.sku || parsed.code || parsed.id || parsed.SKU || parsed.barcode;
            if (sku) return String(sku).trim().toUpperCase();
        } catch (_) {
            // not valid JSON — fall through
        }
    }

    // Try URL — take the last meaningful path segment
    try {
        const url = new URL(text);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
            text = segments[segments.length - 1];
        }
    } catch (_) {
        // not a URL — fall through
    }

    return text.toUpperCase();
}

const CameraScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);
    const [lastScanned, setLastScanned] = useState('');

    useEffect(() => {
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode('reader');
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 30,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        disableFlip: false,
                    },
                    (decodedText) => {
                        // Extract and clean the SKU from what the camera read
                        const sku = extractSku(decodedText);
                        if (!sku) return;

                        setLastScanned(sku);

                        if (scannerRef.current && scannerRef.current.isScanning) {
                            scannerRef.current.stop().then(() => {
                                onScan(sku);
                                onClose();
                            }).catch(() => {
                                onScan(sku);
                                onClose();
                            });
                        }
                    },
                    () => {
                        // Per-frame error — ignore
                    }
                );
            } catch (err) {
                console.error('Error starting scanner:', err);
                setError('Could not start camera. Please ensure camera permissions are granted.');
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [onScan, onClose]);

    const handleStop = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => onClose()).catch(() => onClose());
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-[420px] overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                        <h2 className="text-[14px] font-semibold text-gray-900">Scan Product QR / Barcode</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Point the camera at the product QR code or barcode</p>
                    </div>
                    <button onClick={handleStop} className="text-gray-500 hover:text-gray-700">
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-black" style={{ height: 300 }}>
                    <div id="reader" className="w-full h-full"></div>

                    {/* Crosshair overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-52 h-52 border-2 border-white/60 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-[#c9a84c] rounded-tl-md"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-[#c9a84c] rounded-tr-md"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-[#c9a84c] rounded-bl-md"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-[#c9a84c] rounded-br-md"></div>
                        </div>
                    </div>

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
                    {lastScanned ? (
                        <span className="text-xs text-gray-500">
                            Detected: <span className="font-mono font-semibold text-gray-800">{lastScanned}</span>
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Waiting for scan...</span>
                    )}
                    <button
                        onClick={handleStop}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <style>{`
                #reader video {
                    object-fit: cover;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }
                #reader__scan_region {
                    background: transparent !important;
                }
                #reader__dashboard_section_swaplink,
                #reader__status_span,
                #reader__dashboard {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};

export default CameraScanner;