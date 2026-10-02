'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAdminList<T>(endpoint: string, key: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetch(endpoint);
    const json = await res.json();
    setData(json[key] || []);
    setLoading(false);
  }, [endpoint, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
