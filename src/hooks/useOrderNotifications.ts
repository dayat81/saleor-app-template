import { useEffect, useRef,useState } from 'react';

interface OrderNotificationOptions {
  enabled?: boolean;
  sound?: boolean;
  vibrate?: boolean;
}

export function useOrderNotifications(
  orders: any[],
  options: OrderNotificationOptions = {}
) {
  const { 
    enabled = true, 
    sound = true, 
    vibrate = true 
  } = options;

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const lastOrderCountRef = useRef(0);
  const processedOrdersRef = useRef(new Set<string>());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          setNotificationsEnabled(permission === 'granted');
        });
      } else {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    }
  }, []);

  // Check for new orders and show notifications
  useEffect(() => {
    if (!enabled || !notificationsEnabled || orders.length === 0) {
      return;
    }

    // Find truly new orders (orders we haven't seen before)
    const newOrders = orders.filter(order => !processedOrdersRef.current.has(order.id));
    
    if (newOrders.length > 0) {
      // Add new order IDs to processed set
      newOrders.forEach(order => processedOrdersRef.current.add(order.id));

      // Clean up old processed orders (keep last 100)
      if (processedOrdersRef.current.size > 100) {
        const orderIds = Array.from(processedOrdersRef.current);
        const toKeep = orderIds.slice(-50);
        processedOrdersRef.current = new Set(toKeep);
      }

      // Show notification for new orders
      if (newOrders.length === 1) {
        const order = newOrders[0];
        const notification = new Notification(`🍽️ New Order #${order.number}`, {
          body: `$${order.total?.gross?.amount} - ${order.lines?.length || 0} items`,
          icon: '/favicon.ico',
          tag: `order-${order.id}`,
          requireInteraction: true,
          actions: [
            { action: 'accept', title: '✅ Accept' },
            { action: 'view', title: '👀 View Details' }
          ]
        });

        // Add click handler
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } else {
        new Notification(`🍽️ ${newOrders.length} New Orders!`, {
          body: `You have ${newOrders.length} new orders waiting for confirmation.`,
          icon: '/favicon.ico',
          tag: 'multiple-new-orders',
          requireInteraction: true
        });
      }

      // Play notification sound
      if (sound) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAzOP1fLReiwEIXPG8N+SQgkTXbLp6ah');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore audio play errors
          });
        } catch (error) {
          // Ignore audio errors
        }
      }

      // Trigger vibration on mobile devices
      if (vibrate && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    // Update the last order count
    lastOrderCountRef.current = orders.length;
  }, [orders, enabled, notificationsEnabled, sound, vibrate]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  const showOrderAcceptedNotification = (orderNumber: string, preparationTime: string) => {
    if (notificationsEnabled) {
      new Notification(`✅ Order #${orderNumber} Accepted`, {
        body: `Preparation time: ${preparationTime}`,
        icon: '/favicon.ico',
        tag: `accepted-${orderNumber}`
      });
    }
  };

  const showOrderRejectedNotification = (orderNumber: string, reason: string) => {
    if (notificationsEnabled) {
      new Notification(`❌ Order #${orderNumber} Rejected`, {
        body: reason,
        icon: '/favicon.ico',
        tag: `rejected-${orderNumber}`
      });
    }
  };

  return {
    notificationPermission,
    notificationsEnabled,
    requestPermission,
    showOrderAcceptedNotification,
    showOrderRejectedNotification
  };
}