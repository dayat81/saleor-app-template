import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import {
  Box,
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  Select,
  Spinner,
  Text} from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect,useState } from 'react';
import { useMutation,useQuery } from 'urql';

import { ChannelSelector } from '@/components/restaurant/ChannelSelector';
import { AcceptRestaurantOrderDocument, OrderStatusFilter,RejectRestaurantOrderDocument, RestaurantsListDocument } from '@/generated/graphql';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useOrderPolling } from '@/hooks/useOrderPolling';

// Styles using CSS-in-JS approach compatible with Macaw UI
const styles = {
  root: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  appBar: {
    backgroundColor: "#1976d2",
    color: "white",
    padding: "16px",
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    marginTop: "80px",
    padding: "24px",
  },
  paper: {
    backgroundColor: "white",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  metricCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center" as const,
    transition: "transform 0.2s",
  },
  metricValue: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: "8px",
  },
  orderCard: {
    backgroundColor: "white",
    marginBottom: "16px",
    padding: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  orderActions: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#666",
  },
  orderItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  },
  tabButton: {
    padding: "12px 24px",
    marginRight: "8px",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    backgroundColor: "white",
    cursor: "pointer",
  },
  activeTab: {
    backgroundColor: "#1976d2",
    color: "white",
  },
};

const RestaurantDashboard: NextPage = () => {
  const router = useRouter();
  const { appBridge } = useAppBridge();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('default-channel');
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [preparationTime, setPreparationTime] = useState("15");
  const [rejectionReason, setRejectionReason] = useState("");

  // Use existing GraphQL operations from Phase 1
  const [channelsResult] = useQuery({ 
    query: RestaurantsListDocument,
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
    status: [OrderStatusFilter.Unconfirmed, OrderStatusFilter.Unfulfilled],
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

  const [acceptOrderResult, acceptOrder] = useMutation(AcceptRestaurantOrderDocument);
  const [rejectOrderResult, rejectOrder] = useMutation(RejectRestaurantOrderDocument);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const saleorApiUrl = appBridge?.getState().saleorApiUrl;
        if (!saleorApiUrl) {
          router.push("/");
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [appBridge, router]);

  // Filter channels to show only restaurant channels (with F&B metadata)
  const restaurantChannels = channelsResult.data?.channels?.filter(channel => 
    channel.metadata?.some(meta => meta.key === 'restaurantType') || 
    channel.slug !== 'default-channel'
  ) as any[] || [];

  const currentChannel = restaurantChannels.find(channel => channel.id === selectedChannelId) || 
                         restaurantChannels[0];

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAcceptClick = (order: any) => {
    setSelectedOrder(order);
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (order: any) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;

    try {
      const result = await acceptOrder({
        orderId: selectedOrder.id,
        preparationTime: `${preparationTime} minutes`
      });

      if (result.error) {
        alert(`Error accepting order: ${result.error.message}`);
      } else {
        showOrderAcceptedNotification(selectedOrder.number, `${preparationTime} minutes`);
        refreshOrders();
        setAcceptDialogOpen(false);
        setSelectedOrder(null);
        setPreparationTime("15");
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

    try {
      const result = await rejectOrder({
        orderId: selectedOrder.id,
        rejectionReason: rejectionReason || 'No reason provided'
      });

      if (result.error) {
        alert(`Error rejecting order: ${result.error.message}`);
      } else {
        showOrderRejectedNotification(selectedOrder.number, rejectionReason || 'No reason provided');
        refreshOrders();
        setRejectDialogOpen(false);
        setSelectedOrder(null);
        setRejectionReason("");
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    }
  };

  if (loading || channelsResult.fetching) {
    return (
      <Box style={styles.root} display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box style={styles.root}>
      <div style={styles.appBar}>
        <Text size={8} fontWeight="bold">
          🍽️ Restaurant Dashboard
        </Text>
        <Box display="flex" alignItems="center" gap={4}>
          <ChannelSelector 
            channels={restaurantChannels}
            currentChannelId={selectedChannelId}
            onChannelChange={setSelectedChannelId}
          />
          <Button
            variant="secondary"
            onClick={requestPermission}
            size="small"
          >
            {notificationsEnabled ? "🔔" : "🔕"}
          </Button>
          <Button variant="secondary" onClick={refreshOrders} size="small">
            🔄
          </Button>
          <Text size={3}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        </Box>
      </div>

      <main style={styles.content}>
        <Box maxWidth="100%">
          {/* Metrics Section */}
          <QuickStats 
            channelId={selectedChannelId} 
            orders={orders}
            currentChannel={currentChannel}
          />

          {/* Tabs for different sections */}
          <div style={styles.paper}>
            <Box display="flex" marginBottom={4}>
              <button 
                style={{...styles.tabButton, ...(activeTab === 0 ? styles.activeTab : {})}}
                onClick={() => handleTabChange(0)}
              >
                Order Queue
              </button>
              <button 
                style={{...styles.tabButton, ...(activeTab === 1 ? styles.activeTab : {})}}
                onClick={() => handleTabChange(1)}
              >
                Restaurant Profile
              </button>
              <button 
                style={{...styles.tabButton, ...(activeTab === 2 ? styles.activeTab : {})}}
                onClick={() => handleTabChange(2)}
              >
                Analytics
              </button>
              <button 
                style={{...styles.tabButton, ...(activeTab === 3 ? styles.activeTab : {})}}
                onClick={() => handleTabChange(3)}
              >
                Settings
              </button>
            </Box>

            <Box>
              {activeTab === 0 && (
                <OrderQueue
                  orders={orders}
                  isLoading={isLoading}
                  error={error}
                  onRefresh={refreshOrders}
                  onAcceptClick={handleAcceptClick}
                  onRejectClick={handleRejectClick}
                />
              )}
              {activeTab === 1 && (
                <RestaurantProfile channel={currentChannel} />
              )}
              {activeTab === 2 && (
                <div style={styles.emptyState}>
                  <Text>Analytics dashboard coming soon...</Text>
                </div>
              )}
              {activeTab === 3 && (
                <div style={styles.emptyState}>
                  <Text>Restaurant settings coming soon...</Text>
                </div>
              )}
            </Box>
          </div>
        </Box>
      </main>

      {/* Accept Order Dialog */}
      <Modal open={acceptDialogOpen} onChange={(open) => setAcceptDialogOpen(open)}>
        <Box padding={6} borderRadius={2}>
          <Text size={7} fontWeight="bold" marginBottom={4}>
            Accept Order #{selectedOrder?.number}
          </Text>
          <Box marginBottom={4}>
            <Text marginBottom={2}>Preparation Time:</Text>
            <Select
              value={preparationTime}
              onChange={(value) => setPreparationTime(value)}
              options={[
                { value: "10", label: "10 minutes" },
                { value: "15", label: "15 minutes" },
                { value: "20", label: "20 minutes" },
                { value: "30", label: "30 minutes" },
                { value: "45", label: "45 minutes" },
                { value: "60", label: "1 hour" },
              ]}
            />
          </Box>
          <Box display="flex" gap={2}>
            <Button onClick={() => setAcceptDialogOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleAcceptOrder} variant="primary">
              Accept Order
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Reject Order Dialog */}
      <Modal open={rejectDialogOpen} onChange={(open) => setRejectDialogOpen(open)}>
        <Box padding={6} borderRadius={2}>
          <Text size={7} fontWeight="bold" marginBottom={4}>
            Reject Order #{selectedOrder?.number}
          </Text>
          <Box marginBottom={4}>
            <Text marginBottom={2}>Rejection Reason:</Text>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Kitchen too busy, Out of ingredients"
            />
          </Box>
          <Box display="flex" gap={2}>
            <Button onClick={() => setRejectDialogOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleRejectOrder} variant="primary">
              Reject Order
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

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
  const pendingOrders = orders.filter(o => o.status === 'UNCONFIRMED').length;

  return (
    <div style={styles.metricsGrid}>
      <div style={styles.metricCard}>
        <div style={styles.metricValue}>{pendingOrders}</div>
        <Text size={4}>Pending Orders</Text>
      </div>
      <div style={styles.metricCard}>
        <div style={styles.metricValue}>{totalOrders}</div>
        <Text size={4}>Total Active</Text>
      </div>
      <div style={styles.metricCard}>
        <div style={styles.metricValue}>${totalRevenue.toFixed(2)}</div>
        <Text size={4}>Today&apos;s Revenue</Text>
      </div>
      <div style={styles.metricCard}>
        <div style={styles.metricValue}>
          {currentChannel?.isActive ? '🟢' : '🔴'}
        </div>
        <Text size={4}>
          {currentChannel?.isActive ? 'Open' : 'Closed'}
        </Text>
      </div>
    </div>
  );
}

// Order Queue Component
interface OrderQueueProps {
  orders: any[];
  isLoading: boolean;
  error?: any;
  onRefresh: () => void;
  onAcceptClick: (order: any) => void;
  onRejectClick: (order: any) => void;
}

function OrderQueue({ 
  orders, 
  isLoading, 
  error, 
  onRefresh, 
  onAcceptClick,
  onRejectClick
}: OrderQueueProps) {
  if (error) {
    return (
      <Box padding={4} borderRadius={2}>
        <Text color="critical1" marginBottom={2}>
          Failed to load orders: {error.message}
        </Text>
        <Button variant="secondary" size="small" onClick={onRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={4}>
        <Spinner />
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Text size={6} fontWeight="bold" marginBottom={4}>
          No pending orders
        </Text>
        <Button variant="secondary" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </div>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Text size={6} fontWeight="bold">{orders.length} pending orders</Text>
        <Button variant="secondary" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </Box>
      
      {orders.map(order => (
        <div key={order.id} style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <Box>
              <Text size={6} fontWeight="bold">
                Order #{order.number}
                <Chip marginLeft={2}>
                  {order.status}
                </Chip>
              </Text>
              <Text size={3} color="default2">
                ⏰ {new Date(order.created).toLocaleString()}
              </Text>
            </Box>
            <Text size={6} fontWeight="bold" color="accent1">
              ${order.total?.gross?.amount}
            </Text>
          </div>
          
          <Divider marginY={3} />
          
          <Box>
            <Text size={4} fontWeight="bold" marginBottom={2}>
              Customer: {order.shippingAddress?.firstName || order.user?.firstName} {order.shippingAddress?.lastName || order.user?.lastName}
            </Text>
            {order.customerNote && (
              <Text size={3} color="default2" marginBottom={2}>
                Note: {order.customerNote}
              </Text>
            )}
            
            <Text size={4} fontWeight="bold" marginTop={2} marginBottom={1}>
              Items ({order.lines?.length}):
            </Text>
            {order.lines?.map((line: any) => (
              <div key={line.id} style={styles.orderItem}>
                <Text size={3}>
                  {line.quantity}x {line.productName}
                  {line.variantName && ` - ${line.variantName}`}
                </Text>
                <Text size={3}>
                  ${line.totalPrice?.gross?.amount}
                </Text>
              </div>
            ))}
          </Box>

          <div style={styles.orderActions}>
            <Button 
              variant="primary"
              onClick={() => onAcceptClick(order)}
              style={{ flex: 1 }}
            >
              ✓ Accept Order
            </Button>
            <Button 
              variant="secondary"
              onClick={() => onRejectClick(order)}
            >
              ✕ Reject
            </Button>
          </div>
        </div>
      ))}
    </Box>
  );
}

// Restaurant Profile Component
interface RestaurantProfileProps {
  channel: any;
}

function RestaurantProfile({ channel }: RestaurantProfileProps) {
  if (!channel) {
    return (
      <div style={styles.emptyState}>
        <Text>No restaurant channel selected</Text>
      </div>
    );
  }

  // Extract restaurant info from metadata
  const metadata = new Map(channel.metadata?.map((m: any) => [m.key, m.value]) || []);
  
  return (
    <Box>
      <Text size={8} fontWeight="bold" marginBottom={4}>
        {channel.name}
      </Text>
      
      <Box display="grid" gridTemplateColumns={2} gap={6}>
        <div style={styles.paper}>
          <Text size={6} fontWeight="bold" marginBottom={4}>
            Basic Information
          </Text>
          <Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Status: </Text>
              <Text>{channel.isActive ? '🟢 Active' : '🔴 Inactive'}</Text>
            </Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Currency: </Text>
              <Text>{channel.currencyCode}</Text>
            </Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Slug: </Text>
              <Text>{channel.slug}</Text>
            </Box>
          </Box>
        </div>
        
        <div style={styles.paper}>
          <Text size={6} fontWeight="bold" marginBottom={4}>
            Restaurant Details
          </Text>
          <Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Restaurant Type: </Text>
              <Text>{String(metadata.get('restaurantType') || 'Not set')}</Text>
            </Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Cuisine Type: </Text>
              <Text>{String(metadata.get('cuisineType') || 'Not set')}</Text>
            </Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Phone: </Text>
              <Text>{String(metadata.get('phone') || 'Not set')}</Text>
            </Box>
            <Box marginBottom={2}>
              <Text fontWeight="medium">Address: </Text>
              <Text>{String(metadata.get('address') || 'Not set')}</Text>
            </Box>
          </Box>
        </div>
      </Box>
    </Box>
  );
}

export default RestaurantDashboard;