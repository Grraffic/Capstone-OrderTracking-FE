import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import QrScanner from "qr-scanner";

/**
 * QRCodeScannerModal Component
 *
 * Modal for scanning QR codes using device camera
 * Allows users to scan inventory items via QR code
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
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initScanner = async () => {
      try {
        setError(null);
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            // QR code scanned successfully
            setScannedData(result.data);
            if (onScan) {
              onScan(result.data);
            }
            // Optionally close modal after successful scan
            // onClose();
          },
          {
            onDecodeError: (error) => {
              // Silently ignore decode errors
              console.debug("QR decode error:", error);
            },
            preferredCamera: "environment",
            maxScansPerSecond: 5,
          }
        );

        setScanner(qrScanner);
        setIsScanning(true);
        await qrScanner.start();
      } catch (err) {
        console.error("Scanner initialization error:", err);
        setError(
          err.message || "Failed to access camera. Please check permissions."
        );
        setIsScanning(false);
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
  }, [isOpen, onScan]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#0C2340]">
            Scan QR Code
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Stream */}
          <div className="mb-4 rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full aspect-square object-cover"
              style={{ display: isScanning ? "block" : "none" }}
            />
            {!isScanning && (
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {error ? "Camera Error" : "Initializing camera..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Please ensure you have granted camera permissions and try again.
              </p>
            </div>
          )}

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">
                QR Code Scanned Successfully!
              </p>
              <p className="text-xs text-green-600 break-all">{scannedData}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              📱 Point your camera at a QR code to scan it. The scanner will
              automatically detect and process the code.
            </p>
          </div>

          {/* Status */}
          <div className="text-center">
            {isScanning && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-600">Camera is active</p>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600">Camera access denied</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;

