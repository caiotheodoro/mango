"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ZoomIn } from "lucide-react";
import type { ImageData } from "./types";

interface ImageGridProps {
  images: ImageData[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const handleClose = useCallback(() => setSelectedImage(null), []);

  if (images.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:flex md:flex-row md:flex-nowrap gap-3 mt-2 w-full md:h-52"
      >
        {images.map((image, index) => (
          <Card
            key={index}
            className="md:flex-1 min-w-0 h-32 md:h-full overflow-hidden cursor-pointer group relative border border-[var(--color-input-border)] rounded-xl shadow-editorial hover:border-[var(--color-accent-terracotta)]/30 transition-colors"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={image.thumbnail || image.url}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/10"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Credit */}
              <div className="mt-4 flex items-center justify-between text-white/70 text-sm">
                <p>{selectedImage.alt}</p>
                <a
                  href={selectedImage.credit.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  Photo by {selectedImage.credit.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
