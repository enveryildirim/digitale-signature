import React, { useState, useEffect } from 'react';
import { FileImage, FileVideo, Globe, Play } from 'lucide-react';
import { Media } from '../types';

interface MediaThumbnailProps {
  media: Media;
  className?: string;
}

export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({ media, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset states when media changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
  }, [media.id, media.url]);

  const handleImageError = () => {
    // If newly uploaded, disk file write might take a few ms; retry once after 600ms
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setHasError(false);
      }, 600);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const getMediaSrc = () => {
    if (!media.url) return '';
    if (retryCount > 0) {
      const sep = media.url.includes('?') ? '&' : '?';
      return `${media.url}${sep}retry=${retryCount}`;
    }
    return media.url;
  };

  // 1. IMAGE Media Type
  if (media.type === 'IMAGE') {
    return (
      <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden ${className}`}>
        {/* Skeleton loading animation */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-slate-850 animate-pulse flex items-center justify-center text-slate-600">
            <FileImage className="w-8 h-8 opacity-40 animate-pulse" />
          </div>
        )}

        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-4 text-center">
            <FileImage className="w-10 h-10 text-slate-500 mb-2" />
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-full">
              {media.title}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Önizleme yüklenemedi</span>
          </div>
        ) : (
          <img
            key={`${media.id}-${retryCount}`}
            src={getMediaSrc()}
            alt={media.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    );
  }

  // 2. VIDEO Media Type (Render real first-frame video thumbnail + Play badge)
  if (media.type === 'VIDEO') {
    return (
      <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden ${className}`}>
        {/* Skeleton loader */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-slate-850 animate-pulse flex items-center justify-center text-slate-600">
            <FileVideo className="w-8 h-8 opacity-40 animate-pulse" />
          </div>
        )}

        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
            <FileVideo className="w-10 h-10 text-sky-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-full">
              {media.title}
            </span>
          </div>
        ) : (
          <>
            <video
              key={`${media.id}-${retryCount}`}
              src={`${getMediaSrc()}#t=0.5`}
              preload="metadata"
              muted
              playsInline
              onLoadedData={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Centered Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-slate-900/70 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-sky-600/90 group-hover:border-sky-400 transition-all duration-200">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Video Duration Badge (Bottom-Right) */}
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-black/75 text-slate-200 border border-white/10 backdrop-blur-sm pointer-events-none shadow">
              {media.duration} sn
            </div>
          </>
        )}
      </div>
    );
  }

  // 3. URL Media Type (Web Page Mockup Card)
  let domain = 'Web Bağlantısı';
  try {
    domain = new URL(media.url).hostname;
  } catch {
    domain = media.url;
  }

  return (
    <div className={`relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center overflow-hidden ${className}`}>
      {/* Mini browser top bar mockup */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner group-hover:border-slate-700 transition">
        <div className="flex items-center gap-1.5 self-start mb-2 opacity-60">
          <div className="w-2 h-2 rounded-full bg-rose-500/80" />
          <div className="w-2 h-2 rounded-full bg-amber-500/80" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
        </div>
        <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 mb-1.5 border border-emerald-500/20 group-hover:scale-110 transition duration-200">
          <Globe className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-mono text-slate-300 font-semibold truncate max-w-full">
          {domain}
        </span>
        <span className="text-[10px] text-slate-500 mt-0.5">Canlı Web Sayfası</span>
      </div>
    </div>
  );
};
