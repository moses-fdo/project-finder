"use client";

import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Check, Crop } from "lucide-react";

interface CropImageModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function CropImageModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: CropImageModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropping, setCropping] = useState(false);
  const mountedRef = useRef(true);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Track mounted state to avoid setState on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset position/scale whenever a new image is loaded
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      if (!mountedRef.current) return;
      imageRef.current = img;
      setPosition({ x: 0, y: 0 });
      setScale(1);
    };
  }, [imageSrc]);

  // All hooks are above this guard — safe to early-return here
  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropSave = () => {
    const img = imageRef.current;
    if (!img) return;

    setCropping(true);
    const outputCanvas = document.createElement("canvas");
    const outputSize = 400;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext("2d");

    if (!ctx) { setCropping(false); return; }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    const cropBoxSize = 240;
    const containerCenterX = 150;
    const containerCenterY = 150;

    const aspect = img.width / img.height;
    let renderWidth = cropBoxSize * scale;
    let renderHeight = (cropBoxSize / aspect) * scale;

    if (aspect < 1) {
      renderHeight = cropBoxSize * scale;
      renderWidth = cropBoxSize * aspect * scale;
    }

    const drawX = containerCenterX - renderWidth / 2 + position.x;
    const drawY = containerCenterY - renderHeight / 2 + position.y;

    const cropLeft = (containerCenterX - cropBoxSize / 2 - drawX) * (img.width / renderWidth);
    const cropTop = (containerCenterY - cropBoxSize / 2 - drawY) * (img.height / renderHeight);
    const cropWidth = cropBoxSize * (img.width / renderWidth);
    const cropHeight = cropBoxSize * (img.height / renderHeight);

    ctx.drawImage(
      img,
      Math.max(0, cropLeft),
      Math.max(0, cropTop),
      Math.min(img.width, cropWidth),
      Math.min(img.height, cropHeight),
      0,
      0,
      outputSize,
      outputSize
    );

    outputCanvas.toBlob(
      (blob) => {
        if (!mountedRef.current) return;
        setCropping(false);
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 space-y-5 bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Crop size={18} className="text-primary" />
            <h3 className="text-base font-bold text-foreground">Crop Profile Picture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Crop Preview Area */}
        <div className="space-y-4">
          <div
            className="relative w-[300px] h-[300px] mx-auto bg-black/40 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border border-border flex items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none pointer-events-none transition-transform duration-75"
                style={{
                  width: "240px",
                  height: "auto",
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                }}
              />
            )}

            {/* Circular Crop Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/60 flex items-center justify-center">
              <div className="w-[240px] h-[240px] rounded-full border-2 border-primary shadow-2xl" />
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Drag to reposition image inside the circle
          </p>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-xl border border-border">
            <ZoomOut size={15} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-secondary rounded-lg"
            />
            <ZoomIn size={15} className="text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropSave}
            disabled={cropping}
            className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check size={14} />
            {cropping ? "Cropping…" : "Crop & Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
