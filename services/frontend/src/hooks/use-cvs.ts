'use client';

import { useState, useCallback, useEffect } from 'react';
import { getCvs, CvListItem, CvListPagination } from '@/lib/api';

interface UseCvsReturn {
  cvs: CvListItem[];
  pagination: CvListPagination | null;
  isLoading: boolean;
  error: string | null;
  searchInput: string;
  setSearchInput: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  reload: () => void;
}

const LIMIT = 10;

export function useCvs(): UseCvsReturn {
  const [cvs, setCvs] = useState<CvListItem[]>([]);
  const [pagination, setPagination] = useState<CvListPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCvs({ search, page, limit: LIMIT });
        if (!cancelled) {
          setCvs(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load CVs');
          setCvs([]);
          setPagination(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [search, page, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handleSetSearchInput = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  return {
    cvs,
    pagination,
    isLoading,
    error,
    searchInput,
    setSearchInput: handleSetSearchInput,
    page,
    setPage,
    reload,
  };
}
