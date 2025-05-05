import { useState, useEffect } from 'react';
import garageApi from '@/services/api';

interface OrderCounts {
  todayCount: number;
  tomorrowCount: number;
}

export function useOrderCounts() {
  const [counts, setCounts] = useState<OrderCounts>({ todayCount: 0, tomorrowCount: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const response = await garageApi.get('/purchase_orders/expected_counts');
        
        setCounts({
          todayCount: response.data.todayCount || 0,
          tomorrowCount: response.data.tomorrowCount || 0
        });
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching order counts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading, error };
}
