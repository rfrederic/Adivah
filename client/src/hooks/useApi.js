import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Charge une URL de l'API ; se relance quand l'URL change. */
export function useApi(url) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(url), url });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url, controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
  }, [url, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
