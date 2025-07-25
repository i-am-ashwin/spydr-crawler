'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
}

export default function AuthenticatedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  fallbackSrc = "/default-image.jpg"
}: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!src || src === fallbackSrc) {
        setImageSrc(fallbackSrc);
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('Failed to load authenticated image:', error);
        setImageSrc(fallbackSrc);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      if (imageSrc && imageSrc !== fallbackSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, fallbackSrc]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-neutral-900/30`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
