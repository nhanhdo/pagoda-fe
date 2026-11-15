import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Dashboard quick actions link to `<page>?create=1`. When that flag is present,
 * strip it from the URL (so refresh/back doesn't reopen the form) and open the
 * page's "add new" form if the current user is allowed to.
 */
export function useCreateParam(open, allowed = true) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') !== '1') return;
    params.delete('create');
    const rest = params.toString();
    navigate({ pathname: location.pathname, search: rest ? `?${rest}` : '' }, { replace: true });
    if (allowed) open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
}
