import { useEffect, useRef, useState } from "react";
import {
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import QrScanner from "qr-scanner";

/**
 * QRCodeScannerModal Component
 *
 * Enhanced modal for scanning QR codes using device camera
 * Supports scanning both inventory items and student order receipts
 *
 * Props:
 * - isOpen: Boolean indicating if modal is open
 * - onClose: Function to close modal
 * - onScan: Function called when QR code is scanned (receives scanned data)
 */
const QRCodeScannerModal = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  // Parse QR code data to check if it's an order receipt
  const parseQRData = (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "order_receipt" && parsed.orderNumber) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        setScannedData(null);
        setOrderDetails(null);

        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            // QR code scanned successfully
            const data = result.data;
            setScannedData(data);

            // Check if it's an order receipt QR code
            const orderData = parseQRData(data);
            if (orderData) {
              setOrderDetails(orderData);
            }

            if (onScan) {
              onScan(data);
            }

            // Auto-close after 2.5 seconds on successful scan
            setTimeout(() => {
              handleClose();
            }, 2500);
          },
          {
            onDecodeError: (error) => {
              // Silently ignore decode errors
              console.debug("QR decode error:", error);
            },
            preferredCamera: "environment",
            maxScansPerSecond: 5,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        setScanner(qrScanner);
        await qrScanner.start();
        setIsScanning(true);
        setIsInitializing(false);
      } catch (err) {
        console.error("Scanner initialization error:", err);
        setError(
          err.message || "Failed to access camera. Please check permissions."
        );
        setIsScanning(false);
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.destroy();
        setScanner(null);
        setIsScanning(false);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (scanner) {
      scanner.destroy();
      setScanner(null);
      setIsScanning(false);
    }
    setScannedData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0C2340] to-[#1e3a8a]">
          <div className="flex items-center gap-3">
            <Camera className="text-white" size={24} />
            <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Video Stream with Overlay */}
          <div className="mb-6 rounded-xl overflow-hidden bg-black relative">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              style={{ display: isScanning ? "block" : "none" }}
            />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-[#e68b00] rounded-lg relative">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!isScanning && !error && (
              <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#e68b00] animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm font-medium">
                    Initializing camera...
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Please wait</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center px-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-white text-sm font-medium mb-2">
                    Camera Error
                  </p>
                  <p className="text-gray-400 text-xs">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Success Message with Order Details */}
          {scannedData && !orderDetails && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    QR Code Scanned Successfully!
                  </p>
                  <p className="text-xs text-green-700 break-all font-mono bg-green-100 p-2 rounded">
                    {scannedData}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Receipt Details */}
          {orderDetails && (
            <div className="mb-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
                <div>
                  <p className="text-base font-bold text-green-800">
                    Order Receipt Scanned!
                  </p>
                  <p className="text-xs text-green-700">
                    Order details retrieved successfully
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">Order #:</span>
                  <span className="text-gray-900 font-mono">
                    {orderDetails.orderNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">Student:</span>
                  <span className="text-gray-900">
                    {orderDetails.studentName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-900">
                    {new Date(orderDetails.orderDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">Total:</span>
                  <span className="text-gray-900 font-semibold">
                    ₱{orderDetails.totalAmount.toFixed(2)}
                  </span>
                </div>

                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Items:
                    </p>
                    <ul className="space-y-1">
                      {orderDetails.items.map((item, index) => (
                        <li
                          key={index}
                          className="text-xs text-gray-600 flex justify-between"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">
                            ₱{item.price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!scannedData && !error && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    How to scan:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Point your camera at the QR code</li>
                    <li>• Keep the code within the orange frame</li>
                    <li>• Hold steady until the code is detected</li>
                    <li>• The scanner will automatically process the code</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="mt-4 text-center">
            {isScanning && !scannedData && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-600 font-medium">
                  Camera is active - Ready to scan
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;
