import React, { useState, useRef } from 'react';
import { uploadImage } from '@/lib/supabase';
import { Upload, X, Image, Loader } from 'lucide-react';

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(f => uploadImage(f, 'properties'))
      );
      onChange([...images, ...urls]);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-slate-500">Uploading images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Drop images here or click to upload</p>
            <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB each</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-video">
              <img src={url} className="w-full h-full object-cover rounded-lg" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">Cover</span>
              )}
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div onClick={() => inputRef.current?.click()} className="aspect-video border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
            <Image className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
}
