import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';

const PAGE_SIZE = 10;
const DEFAULT_STATUS = 'đang_hoạt_động';

export function usePersonnelList() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const search = params.get('search') || '';
  const query = search.trim();
  const filterType = params.get('type') || '';
  const filterStatus = params.get('status') ?? DEFAULT_STATUS;
  const viewChoice = params.get('view');
  const [debouncedSearch, setDebouncedSearch] = useState(query);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);

  const updateParams = (values: Record<string, string | null>) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      Object.entries(values).forEach(([key, value]) => {
        if (value === null) next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };
  const setPage = (n: number) => updateParams({ page: n > 1 ? String(n) : null });
  const setSearch = (value: string) => updateParams({ search: value || null, page: null });
  const setFilterType = (value: string) => updateParams({ type: value || null, page: null });
  const setFilterStatus = (value: string) => updateParams({ status: value === DEFAULT_STATUS ? null : value, page: null });
  const setViewChoice = (value: string) => updateParams({ view: value });
  const clearFilters = () => updateParams({ search: null, type: null, status: '', page: null });
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (query !== debouncedSearch) {
      setLoading(true);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    api.get('/personnel', {
      params: { page, limit: PAGE_SIZE, search: debouncedSearch, type: filterType, status: filterStatus },
      signal: controller.signal,
    }).then(({ data: result }) => {
      if (controller.signal.aborted) return;
      setData(result.data);
      setTotal(result.total);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [page, query, debouncedSearch, filterType, filterStatus, revision]);

  const handleDelete = async (id: number | string) => {
    try {
      await api.delete(`/personnel/${id}`);
      message.success(t.personnel.deleteSuccess);
      if (data.length === 1 && page > 1) setPage(page - 1);
      else refresh();
      return true;
    } catch (error: any) {
      message.error(error?.response?.data?.message || t.personnel.deleteError);
      return false;
    }
  };

  return {
    data, total, loading, loadError, page, search, filterType, filterStatus, viewChoice,
    setPage, setSearch, setFilterType, setFilterStatus, setViewChoice, clearFilters, refresh, handleDelete,
  };
}
