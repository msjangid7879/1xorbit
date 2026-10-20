import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ imageSrc, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <h3 className="font-bold text-xs text-slate-200">Adjust & Crop Profile Picture (1:1)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={16} /></button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-72 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
            cropShape="round"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Zoom Slider & Actions */}
        <div className="p-4 bg-slate-900/60 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium">Zoom:</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Check size={14} /> Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}