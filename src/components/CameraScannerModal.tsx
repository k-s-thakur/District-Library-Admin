"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, X, Scan, AlertCircle } from "lucide-react";

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
  title = "Optical Barcode & QR Scanner",
  subtitle = "Align book accession barcode or member QR code within the frame",
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Play audio beep upon successful recognition
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera video capture is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Initialize BarcodeDetector if available
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ["code_128", "code_39", "ean_13", "qr_code", "upc_a"],
          });

          intervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && !isProcessing) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  const detected = barcodes[0].rawValue.trim();
                  if (detected) {
                    setIsProcessing(true);
                    playBeep();
                    stopCamera();
                    onScan(detected);
                    onClose();
                  }
                }
              } catch {
                // frame detection pass
              }
            }
          }, 350);
        } catch {
          // BarcodeDetector format error
        }
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(err.message || "Unable to access camera device.");
      stopCamera();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode("");
      setCameraError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center">
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder / Simulation Box */}
        <div className="relative aspect-4/3 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-700">
          {isCameraActive ? (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Aim Box & Laser */}
              <div className="absolute inset-8 border-2 border-[#0d7a55] rounded-xl pointer-events-none flex items-center justify-center shadow-lg">
                <div className="w-full h-0.5 bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">
                  Live Viewfinder
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">Device Camera Offline</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Click below to activate live webcam optical detection or enter the accession code manually.
                </p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Activate Camera Scanner</span>
              </button>
            </div>
          )}

          {/* Active Camera Toggle Button in overlay */}
          {isCameraActive && (
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-medium rounded-lg backdrop-blur-xs transition cursor-pointer"
            >
              <CameraOff className="w-3 h-3 text-red-400" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>

        {/* Camera Error Alert if blocked */}
        {cameraError && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Camera Access Notice</p>
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
              placeholder="e.g. ACC-2026-0024 or QR-ACC-2026-0024"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] text-xs font-mono"
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
