import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleCrop = async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const container = containerRef.current;

    if (!canvas || !image || !container) return;

    const cropSize = 400;
    canvas.width = cropSize;
    canvas.height = cropSize;

    const ctx = canvas.getContext('2d');
    
    const containerRect = container.getBoundingClientRect();
    const containerSize = Math.min(containerRect.width, containerRect.height);
    
    const scale = image.naturalWidth / (containerSize / zoom);
    const sourceSize = cropSize * scale;
    
    const sourceX = Math.max(0, (image.naturalWidth / 2) - (sourceSize / 2) - (position.x * scale));
    const sourceY = Math.max(0, (image.naturalHeight / 2) - (sourceSize / 2) - (position.y * scale));

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      cropSize,
      cropSize
    );

    canvas.toBlob((blob) => {
      onCropComplete(blob);
    }, 'image/jpeg', 0.95);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>プロフィール画像をトリミング</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s'
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }} />
              <div className="absolute inset-0 border-2 border-white rounded-full" style={{
                width: '80%',
                height: '80%',
                top: '10%',
                left: '10%'
              }} />
            </div>

            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Move className="w-4 h-4" />
              ドラッグして位置を調整
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" />
                <span>ズーム</span>
              </div>
              <ZoomIn className="w-4 h-4" />
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button onClick={handleCrop} className="bg-red-600 hover:bg-red-700">
            トリミング完了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}