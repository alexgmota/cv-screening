'use client';

import { useCallback, useState } from 'react';
import { Nav } from '@/components/nav/nav';
import { CandidatesTable } from '@/components/candidates/candidates-table';
import { CvViewerPanel } from '@/components/cv-viewer/cv-viewer-panel';
import { useCvs } from '@/hooks/use-cvs';

export default function CvsPage() {
  const {
    cvs,
    pagination,
    isLoading,
    error,
    searchInput,
    setSearchInput,
    page,
    setPage,
  } = useCvs();

  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  const handleOpenCv = useCallback((cvId: string) => {
    setSelectedCvId(cvId);
  }, []);

  const handleCloseCv = useCallback(() => {
    setSelectedCvId(null);
  }, []);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold">CV Database</h1>
          <p className="text-sm text-gray-500">Browse and search candidates</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
            Loading candidates...
          </div>
        ) : cvs.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
            No candidates found
          </div>
        ) : (
          <CandidatesTable cvs={cvs} onOpenCv={handleOpenCv} />
        )}

        {!isLoading && cvs.length > 0 && pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pagination.total} candidate{pagination.total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      <CvViewerPanel cvId={selectedCvId} onClose={handleCloseCv} />
    </div>
  );
}
