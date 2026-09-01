'use client';

import { useEffect, useCallback } from 'react';

interface CvViewerPanelProps {
  cvId: string | null;
  onClose: () => void;
}

const CV_SERVICE_URL = process.env.NEXT_PUBLIC_CV_SERVICE_URL || 'http://localhost:4002';

export function CvViewerPanel({ cvId, onClose }: CvViewerPanelProps) {
  const isOpen = cvId !== null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[40vw] min-w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">CV Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {isOpen && (
          <iframe
            src={`${CV_SERVICE_URL}/api/cvs/${cvId}/pdf`}
            className="w-full h-[calc(100%-49px)] border-0"
            title="CV Preview"
          />
        )}
      </div>
    </>
  );
}
