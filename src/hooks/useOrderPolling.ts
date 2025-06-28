import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from 'urql';
import { RestaurantOrderQueueDocument } from '@/generated/graphql';

interface UseOrderPollingOptions {
  channelId: string;
  status?: string[];
  pollInterval?: number;
  enabled?: boolean;
}

export function useOrderPolling({
  channelId,
  status = ['UNCONFIRMED', 'UNFULFILLED'],
  pollInterval = 15000,
  enabled = true
}: UseOrderPollingOptions) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isBackground, setIsBackground] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query for orders
  const [ordersResult, refetchOrders] = useQuery({
    query: RestaurantOrderQueueDocument,
    variables: { 
      channel: channelId, 
      status,
      first: 20 
    },
    requestPolicy: 'cache-and-network'
  });

  // Handle visibility change to adjust polling frequency
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackground(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Manual refresh function
  const refreshOrders = useCallback(() => {
    refetchOrders({ requestPolicy: 'network-only' });
    setLastUpdate(new Date());
  }, [refetchOrders]);

  // Setup polling interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Adjust polling frequency based on page visibility
    const actualPollInterval = isBackground ? pollInterval * 2 : pollInterval;

    const poll = () => {
      refetchOrders({ requestPolicy: 'network-only' });
      setLastUpdate(new Date());
    };

    intervalRef.current = setInterval(poll, actualPollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isBackground, pollInterval, refetchOrders]);

  // Focus polling - refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (enabled) {
        refreshOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, refreshOrders]);

  const orders = ordersResult.data?.orders?.edges?.map(edge => edge.node) || [];

  return {
    orders,
    isLoading: ordersResult.fetching,
    error: ordersResult.error,
    lastUpdate,
    refreshOrders,
    isPolling: enabled && !!intervalRef.current
  };
}