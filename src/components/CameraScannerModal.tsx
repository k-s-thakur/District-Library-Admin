"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, X, Scan, AlertCircle, Upload, Sparkles } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  subtitle?: string;
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Circulation Optical Scanner",
  subtitle = "Align accession barcode (Code-128) or member QR pass to camera",
}: CameraScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  // Play audio beep upon successful recognition
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // safe ignore
      }
    }
    setIsCameraActive(false);
    setIsStarting(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsStarting(true);
    try {
      const elementId = "html5-optical-scanner-region";

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODABAR,
          ],
          verbose: false,
        });
      }

      const scanner = scannerRef.current;
      if (scanner.isScanning) {
        await scanner.stop();
      }

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333334,
      };

      const handleSuccess = (decodedText: string) => {
        const code = decodedText.trim();
        if (!code) return;
        playBeep();
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            setIsCameraActive(false);
            onScan(code);
            onClose();
          });
      };

      try {
        // 1. Try back/environment camera first
        await scanner.start({ facingMode: "environment" }, config, handleSuccess, () => {});
      } catch {
        try {
          // 2. Try front/user camera (e.g. laptop webcam)
          await scanner.start({ facingMode: "user" }, config, handleSuccess, () => {});
        } catch (camErr: any) {
          // 3. Try any available camera device
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await scanner.start(cameras[0].id, config, handleSuccess, () => {});
          } else {
            throw camErr;
          }
        }
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(
        err.message ||
          "Unable to access camera device. Please grant camera permission in your browser or use manual barcode entry."
      );
      stopCamera();
    } finally {
      setIsStarting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError(null);
    try {
      const fileScanner = new Html5Qrcode("html5-file-region", { verbose: false });
      const result = await fileScanner.scanFile(file, true);
      if (result) {
        playBeep();
        await stopCamera();
        onScan(result.trim());
        onClose();
      }
    } catch {
      setCameraError("Could not recognize a barcode or QR code in this image. Please upload a clear photo of the code.");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      stopCamera();
      onScan(manualCode.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden container for file scan */}
        <div id="html5-file-region" className="hidden" />

        {/* Camera Viewfinder Box */}
        <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
          {/* Live Scanner Region */}
          <div
            id="html5-optical-scanner-region"
            className={`w-full h-full overflow-hidden ${isCameraActive ? "block" : "hidden"}`}
          />

          {/* Offline / Placeholder View */}
          {!isCameraActive && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-800 shadow-inner">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">Device Camera Offline</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Click below to activate live webcam optical detection or enter the accession code manually.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isStarting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md disabled:opacity-60"
                >
                  <Camera className={`w-3.5 h-3.5 ${isStarting ? "animate-spin" : ""}`} />
                  <span>{isStarting ? "Starting..." : "Activate Camera Scanner"}</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-700"
                  title="Upload image containing barcode or QR"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Overlay Controls */}
          {isCameraActive && (
            <>
              {/* Laser beam & targeting box */}
              <div className="absolute inset-8 border-2 border-[#0d7a55] rounded-xl pointer-events-none flex items-center justify-center shadow-lg">
                <div className="w-full h-0.5 bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-emerald-400 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Live Viewfinder
                </div>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-medium rounded-lg backdrop-blur-xs transition cursor-pointer z-10"
              >
                <CameraOff className="w-3 h-3 text-red-400" />
                <span>Stop Camera</span>
              </button>
            </>
          )}
        </div>

        {/* Camera Error Alert if blocked */}
        {cameraError && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Camera Notice</p>
              <p className="text-[11px] text-amber-700">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Manual Keyboard / USB Barcode Gun Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2 text-xs">
          <label className="text-slate-700 font-semibold flex items-center justify-between">
            <span>Or Enter Barcode / Accession / QR Token:</span>
            <span className="text-[10px] font-normal text-slate-400">USB Scanners supported</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ACC-2026-0001 or QR-ACC-2026-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] text-xs font-mono font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white rounded-xl font-semibold cursor-pointer disabled:opacity-50 transition text-xs shadow-xs"
            >
              Scan & Route
            </button>
          </div>

          {/* Quick 1-Click Test Chips for Desk Simulation */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Quick Test:</span>
            </span>
            {["ACC-2026-0001", "ACC-2026-0002", "GPL-2026-0185"].map((testCode) => (
              <button
                key={testCode}
                type="button"
                onClick={() => {
                  playBeep();
                  stopCamera();
                  onScan(testCode);
                  onClose();
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-[#e2f6ee] text-slate-700 hover:text-[#0d7a55] border border-slate-200 hover:border-emerald-300 font-mono text-[10px] font-semibold transition cursor-pointer"
                title={`Click to simulate scanning ${testCode}`}
              >
                {testCode}
              </button>
            ))}
          </div>
        </form>

        {/* Quick Hint */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Supported: Code-128, Code-39, QR Code</span>
          <span className="text-emerald-700 font-medium">Auto-routes to Issue or Return</span>
        </div>
      </div>
    </div>
  );
}
