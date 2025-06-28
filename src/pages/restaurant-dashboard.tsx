import { useQuery, useMutation } from 'urql';
import { useState, useEffect } from 'react';
import { RestaurantListsDocument, AcceptRestaurantOrderDocument, RejectRestaurantOrderDocument } from '@/generated/graphql';
import { ChannelSelector } from '@/components/restaurant/ChannelSelector';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import '../styles/restaurant-dashboard.css';

interface RestaurantDashboardProps {
  channelId?: string;
}

export default function RestaurantDashboard({ channelId }: RestaurantDashboardProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channelId || 'default-channel');

  // Use existing GraphQL operations from Phase 1
  const [channelsResult] = useQuery({ 
    query: RestaurantListsDocument,
    requestPolicy: 'cache-and-network'
  });
  
  // Enhanced order polling with real-time features
  const { 
    orders, 
    isLoading, 
    error, 
    lastUpdate, 
    refreshOrders,
    isPolling 
  } = useOrderPolling({
    channelId: selectedChannelId,
    status: ['UNCONFIRMED', 'UNFULFILLED'],
    pollInterval: 15000,
    enabled: true
  });

  // Enhanced notification system
  const {
    notificationsEnabled,
    requestPermission,
    showOrderAcceptedNotification,
    showOrderRejectedNotification
  } = useOrderNotifications(orders, {
    enabled: true,
    sound: true,
    vibrate: true
  });

  // Filter channels to show only restaurant channels (with F&B metadata)
  const restaurantChannels = channelsResult.data?.channels?.filter(channel => 
    channel.metadata?.some(meta => meta.key === 'restaurantType') || 
    channel.slug !== 'default-channel'  // Include all non-default channels for now
  ) || [];

  const currentChannel = restaurantChannels.find(channel => channel.id === selectedChannelId) || 
                         restaurantChannels[0];

  return (
    <div className="restaurant-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🍽️ F&B Restaurant Management</h1>
          <div className="header-controls">
            <ChannelSelector 
              channels={restaurantChannels}
              currentChannelId={selectedChannelId}
              onChannelChange={setSelectedChannelId}
            />
            <div className="notification-status">
              {notificationsEnabled ? '🔔 Notifications: ON' : (
                <button 
                  onClick={requestPermission}
                  style={{ 
                    background: 'none', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  🔕 Enable Notifications
                </button>
              )}
            </div>
            <div className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <ul>
          <li><a href="/restaurant-dashboard" className="active">📊 Dashboard</a></li>
          <li><a href="/menu-management">🍕 Menu</a></li>
          <li><a href="/order-queue">📋 Orders</a></li>
          <li><a href="/analytics">📈 Analytics</a></li>
          <li><a href="#settings">⚙️ Settings</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Quick Stats */}
          <section className="stats-section">
            <h2>Today's Overview</h2>
            <QuickStats 
              channelId={selectedChannelId} 
              orders={orders}
              currentChannel={currentChannel}
            />
          </section>

          {/* Order Notifications */}
          <section className="orders-section">
            <h2>Recent Orders</h2>
            <OrderNotifications 
              orders={orders}
              isLoading={isLoading}
              error={error}
              onRefresh={refreshOrders}
              onOrderUpdate={refreshOrders}
              showOrderAcceptedNotification={showOrderAcceptedNotification}
              showOrderRejectedNotification={showOrderRejectedNotification}
            />
          </section>

          {/* Restaurant Status */}
          <section className="status-section">
            <h2>Restaurant Status</h2>
            <RestaurantStatus channel={currentChannel} />
          </section>
        </div>
      </main>
    </div>
  );
}


// Quick Stats Component
interface QuickStatsProps {
  channelId: string;
  orders: any[];
  currentChannel: any;
}

function QuickStats({ channelId, orders, currentChannel }: QuickStatsProps) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => 
    sum + (order.total?.gross?.amount || 0), 0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-value">{totalOrders}</div>
        <div className="stat-label">Pending Orders</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">${totalRevenue.toFixed(2)}</div>
        <div className="stat-label">Today's Revenue</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">${avgOrderValue.toFixed(2)}</div>
        <div className="stat-label">Avg Order Value</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{currentChannel?.isActive ? '🟢 Open' : '🔴 Closed'}</div>
        <div className="stat-label">Status</div>
      </div>
    </div>
  );
}

// Order Notifications Component
interface OrderNotificationsProps {
  orders: any[];
  isLoading: boolean;
  error?: any;
  onRefresh: () => void;
  onOrderUpdate: () => void;
  showOrderAcceptedNotification: (orderNumber: string, preparationTime: string) => void;
  showOrderRejectedNotification: (orderNumber: string, reason: string) => void;
}

function OrderNotifications({ 
  orders, 
  isLoading, 
  error, 
  onRefresh, 
  onOrderUpdate,
  showOrderAcceptedNotification,
  showOrderRejectedNotification 
}: OrderNotificationsProps) {
  if (error) {
    return (
      <div className="orders-error">
        <p>Failed to load orders: {error.message}</p>
        <button onClick={onRefresh} className="refresh-btn">Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="orders-loading">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty">
        <p>No pending orders</p>
        <button onClick={onRefresh} className="refresh-btn">Refresh</button>
      </div>
    );
  }

  return (
    <div className="order-notifications">
      <div className="orders-header">
        <span>{orders.length} pending orders</span>
        <button onClick={onRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>
      <div className="orders-list">
        {orders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onOrderUpdate={onOrderUpdate}
            showOrderAcceptedNotification={showOrderAcceptedNotification}
            showOrderRejectedNotification={showOrderRejectedNotification}
          />
        ))}
      </div>
    </div>
  );
}

// Order Card Component
interface OrderCardProps {
  order: any;
  onOrderUpdate: () => void;
  showOrderAcceptedNotification: (orderNumber: string, preparationTime: string) => void;
  showOrderRejectedNotification: (orderNumber: string, reason: string) => void;
}

function OrderCard({ 
  order, 
  onOrderUpdate, 
  showOrderAcceptedNotification,
  showOrderRejectedNotification 
}: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptOrderResult, acceptOrder] = useMutation(AcceptRestaurantOrderDocument);
  const [rejectOrderResult, rejectOrder] = useMutation(RejectRestaurantOrderDocument);

  const handleAcceptOrder = async () => {
    setIsProcessing(true);
    try {
      const preparationTime = prompt('Estimated preparation time (e.g., "15 minutes")', '15 minutes');
      if (!preparationTime) {
        setIsProcessing(false);
        return;
      }

      const result = await acceptOrder({
        orderId: order.id,
        preparationTime
      });

      if (result.error) {
        alert(`Error accepting order: ${result.error.message}`);
      } else {
        showOrderAcceptedNotification(order.number, preparationTime);
        onOrderUpdate();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    setIsProcessing(true);
    try {
      const rejectionReason = prompt('Reason for rejection (optional)', 'Kitchen too busy');
      const confirmReject = confirm(`Are you sure you want to reject Order #${order.number}?`);
      
      if (!confirmReject) {
        setIsProcessing(false);
        return;
      }

      const result = await rejectOrder({
        orderId: order.id,
        rejectionReason: rejectionReason || 'No reason provided'
      });

      if (result.error) {
        alert(`Error rejecting order: ${result.error.message}`);
      } else {
        showOrderRejectedNotification(order.number, rejectionReason || 'No reason provided');
        onOrderUpdate();
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="order-card">
      <div className="order-header">
        <h4>Order #{order.number}</h4>
        <span className="order-total">${order.total?.gross?.amount}</span>
        <span className="order-time">
          {new Date(order.created).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="order-details">
        <p><strong>Customer:</strong> {order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
        <p><strong>Items:</strong> {order.lines?.length}</p>
        {order.customerNote && (
          <p><strong>Special Instructions:</strong> {order.customerNote}</p>
        )}
      </div>

      <div className="order-items">
        {order.lines?.map((line: any) => (
          <div key={line.id} className="order-item">
            <span className="item-quantity">{line.quantity}x</span>
            <span className="item-name">{line.productName}</span>
            {line.variantName && <span className="item-variant"> - {line.variantName}</span>}
            <span className="item-price">${line.totalPrice?.gross?.amount}</span>
          </div>
        ))}
      </div>

      <div className="order-actions">
        <button 
          onClick={handleAcceptOrder} 
          className="accept-btn"
          disabled={isProcessing}
        >
          {isProcessing ? '⏳ Processing...' : '✅ Accept Order'}
        </button>
        <button 
          onClick={handleRejectOrder} 
          className="reject-btn"
          disabled={isProcessing}
        >
          {isProcessing ? '⏳ Processing...' : '❌ Reject'}
        </button>
      </div>
    </div>
  );
}

// Restaurant Status Component
interface RestaurantStatusProps {
  channel: any;
}

function RestaurantStatus({ channel }: RestaurantStatusProps) {
  if (!channel) {
    return <div>No restaurant selected</div>;
  }

  // Extract restaurant info from metadata
  const metadata = new Map(channel.metadata?.map((m: any) => [m.key, m.value]) || []);
  const restaurantInfo = {
    restaurantType: metadata.get('restaurantType') || 'Not set',
    cuisineType: metadata.get('cuisineType') || 'Not set',
    address: metadata.get('address') || 'Not set',
    phone: metadata.get('phone') || 'Not set',
  };

  return (
    <div className="restaurant-status">
      <div className="status-item">
        <strong>Name:</strong> {channel.name}
      </div>
      <div className="status-item">
        <strong>Status:</strong> {channel.isActive ? '🟢 Active' : '🔴 Inactive'}
      </div>
      <div className="status-item">
        <strong>Currency:</strong> {channel.currencyCode}
      </div>
      <div className="status-item">
        <strong>Cuisine:</strong> {restaurantInfo.cuisineType}
      </div>
      <div className="status-item">
        <strong>Type:</strong> {restaurantInfo.restaurantType}
      </div>
      {restaurantInfo.phone !== 'Not set' && (
        <div className="status-item">
          <strong>Phone:</strong> {restaurantInfo.phone}
        </div>
      )}
    </div>
  );
}