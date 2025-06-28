# Phase 2.1: Multi-Restaurant Channel Management Implementation Plan

## Overview
This document outlines the detailed implementation plan for Phase 2.1 of the F&B app, focusing on creating the multi-restaurant channel management system. This phase will provide restaurant staff with the necessary dashboard interfaces to manage their operations.

## Current Status
- ✅ **Phase 1 Complete**: GraphQL operations, webhooks, and authentication working
- ✅ **Dependencies Resolved**: All backend infrastructure ready
- ✅ **App Manifest**: Dashboard extensions defined and registered
- 🎯 **Target**: Implement frontend interfaces for restaurant management

---

## Phase 2.1 Objectives

### Primary Goals
1. **Restaurant Dashboard Interface** - Main operational dashboard for restaurant staff
2. **Channel Management** - Multi-restaurant support with channel selection
3. **Profile Management** - Restaurant settings and configuration
4. **Real-time Integration** - Connect frontend with existing webhook system

### Success Criteria
- ✅ Restaurant staff can log in and select their restaurant channel
- ✅ Dashboard displays real-time order notifications from webhooks
- ✅ Restaurant profile can be viewed and updated
- ✅ Channel switching works for multi-restaurant operators
- ✅ Integration with existing GraphQL operations confirmed

---

## Technical Implementation Plan

### Step 1: Restaurant Dashboard Foundation (Days 1-2)

#### 1.1 Create Main Dashboard Page
**File**: `src/pages/restaurant-dashboard.tsx`

```typescript
// Core dashboard structure
import { useQuery } from 'urql';
import { RestaurantListsDocument, RestaurantOrderQueueDocument } from '@/generated/graphql';

interface RestaurantDashboardProps {
  channelId?: string;
}

export default function RestaurantDashboard({ channelId }: RestaurantDashboardProps) {
  // Use existing GraphQL operations from Phase 1
  const [channelsResult] = useQuery({ query: RestaurantListsDocument });
  const [ordersResult] = useQuery({ 
    query: RestaurantOrderQueueDocument,
    variables: { channel: channelId || 'default-channel', status: ['UNFULFILLED'] }
  });

  return (
    <div className="restaurant-dashboard">
      <ChannelSelector channels={channelsResult.data?.channels} />
      <OrderNotifications orders={ordersResult.data?.orders} />
      <QuickStats channelId={channelId} />
      <RecentActivity />
    </div>
  );
}
```

#### 1.2 Channel Selection Component
**File**: `src/components/restaurant/ChannelSelector.tsx`

```typescript
interface ChannelSelectorProps {
  channels: Channel[];
  currentChannelId?: string;
  onChannelChange: (channelId: string) => void;
}

export function ChannelSelector({ channels, currentChannelId, onChannelChange }: ChannelSelectorProps) {
  // Filter channels to show only restaurant channels (with F&B metadata)
  const restaurantChannels = channels?.filter(channel => 
    channel.metadata?.some(meta => meta.key === 'restaurantType')
  );

  return (
    <select onChange={(e) => onChannelChange(e.target.value)}>
      {restaurantChannels?.map(channel => (
        <option key={channel.id} value={channel.id}>
          {channel.name} ({channel.slug})
        </option>
      ))}
    </select>
  );
}
```

#### 1.3 API Endpoint for Dashboard Data
**File**: `src/pages/api/restaurant-dashboard.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/create-graphq-client';
import { RestaurantListsDocument } from '@/generated/graphql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use proven authentication patterns from Phase 1
    const client = createClient(
      process.env.SALEOR_API_URL!,
      async () => ({ token: process.env.SALEOR_APP_TOKEN! })
    );

    const result = await client.query(RestaurantListsDocument, {}).toPromise();
    
    // Transform data for dashboard consumption
    const dashboardData = {
      restaurants: result.data?.channels?.map(channel => ({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        isActive: channel.isActive,
        metadata: channel.metadata,
        // Extract F&B-specific data from metadata
        restaurantInfo: extractRestaurantInfo(channel.metadata),
      })),
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}

function extractRestaurantInfo(metadata: any[]) {
  const metaMap = new Map(metadata?.map(m => [m.key, m.value]) || []);
  return {
    restaurantType: metaMap.get('restaurantType'),
    cuisineType: metaMap.get('cuisineType'),
    address: metaMap.get('address'),
    phone: metaMap.get('phone'),
    operatingHours: metaMap.get('operatingHours'),
  };
}
```

---

### Step 2: Real-time Order Integration (Days 2-3)

#### 2.1 Order Notifications Component
**File**: `src/components/restaurant/OrderNotifications.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useQuery } from 'urql';
import { RestaurantOrderQueueDocument } from '@/generated/graphql';

interface OrderNotificationsProps {
  channelId: string;
}

export function OrderNotifications({ channelId }: OrderNotificationsProps) {
  const [newOrders, setNewOrders] = useState<any[]>([]);
  
  // Poll for new orders (will upgrade to WebSocket in Phase 3)
  const [ordersResult, refetchOrders] = useQuery({
    query: RestaurantOrderQueueDocument,
    variables: { 
      channel: channelId, 
      status: ['UNCONFIRMED', 'UNFULFILLED'],
      first: 10 
    },
    requestPolicy: 'cache-and-network'
  });

  useEffect(() => {
    // Poll every 30 seconds for new orders
    const interval = setInterval(() => {
      refetchOrders({ requestPolicy: 'network-only' });
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchOrders]);

  // Detect new orders and show notifications
  useEffect(() => {
    if (ordersResult.data?.orders?.edges) {
      const orders = ordersResult.data.orders.edges.map(edge => edge.node);
      // Logic to detect new orders since last check
      // Show browser notifications for new orders
      showNewOrderNotifications(orders);
    }
  }, [ordersResult.data]);

  return (
    <div className="order-notifications">
      <h3>Recent Orders</h3>
      {ordersResult.data?.orders?.edges?.map(({ node: order }) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function showNewOrderNotifications(orders: any[]) {
  // Browser notification for new orders
  if ('Notification' in window && Notification.permission === 'granted') {
    orders.forEach(order => {
      new Notification(`New Order: ${order.number}`, {
        body: `${order.lines?.length} items - $${order.total?.gross?.amount}`,
        icon: '/restaurant-icon.png'
      });
    });
  }
}
```

#### 2.2 Order Action Controls
**File**: `src/components/restaurant/OrderCard.tsx`

```typescript
import { useMutation } from 'urql';
import { AcceptRestaurantOrderDocument } from '@/generated/graphql';

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  const [, acceptOrder] = useMutation(AcceptRestaurantOrderDocument);
  
  const handleAcceptOrder = async () => {
    const result = await acceptOrder({
      orderId: order.id,
      preparationTime: '30' // Default 30 minutes
    });
    
    if (result.error) {
      console.error('Failed to accept order:', result.error);
      // Show error notification
    } else {
      // Show success notification
      console.log('Order accepted successfully');
    }
  };

  return (
    <div className="order-card">
      <div className="order-header">
        <h4>Order #{order.number}</h4>
        <span className="order-total">${order.total?.gross?.amount}</span>
      </div>
      
      <div className="order-details">
        <p><strong>Customer:</strong> {order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
        <p><strong>Items:</strong> {order.lines?.length}</p>
        <p><strong>Special Instructions:</strong> {order.customerNote || 'None'}</p>
      </div>

      <div className="order-items">
        {order.lines?.map((line: any) => (
          <div key={line.id} className="order-item">
            <span>{line.quantity}x {line.productName}</span>
            {line.variantName && <span> - {line.variantName}</span>}
          </div>
        ))}
      </div>

      <div className="order-actions">
        <button onClick={handleAcceptOrder} className="accept-btn">
          Accept Order
        </button>
        <button className="reject-btn">
          Reject
        </button>
      </div>
    </div>
  );
}
```

---

### Step 3: Restaurant Profile Management (Days 3-4)

#### 3.1 Profile Management Component
**File**: `src/components/restaurant/RestaurantProfile.tsx`

```typescript
import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { RestaurantDetailsDocument } from '@/generated/graphql';

interface RestaurantProfileProps {
  channelId: string;
}

export function RestaurantProfile({ channelId }: RestaurantProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileResult] = useQuery({
    query: RestaurantDetailsDocument,
    variables: { id: channelId }
  });

  const restaurant = profileResult.data?.channel;
  const restaurantInfo = extractRestaurantInfo(restaurant?.metadata || []);

  return (
    <div className="restaurant-profile">
      <div className="profile-header">
        <h2>{restaurant?.name}</h2>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <RestaurantProfileForm 
          restaurant={restaurant}
          restaurantInfo={restaurantInfo}
          onSave={() => setIsEditing(false)}
        />
      ) : (
        <RestaurantProfileView 
          restaurant={restaurant}
          restaurantInfo={restaurantInfo}
        />
      )}
    </div>
  );
}

function RestaurantProfileView({ restaurant, restaurantInfo }: any) {
  return (
    <div className="profile-view">
      <div className="profile-section">
        <h3>Basic Information</h3>
        <p><strong>Name:</strong> {restaurant?.name}</p>
        <p><strong>Slug:</strong> {restaurant?.slug}</p>
        <p><strong>Status:</strong> {restaurant?.isActive ? 'Active' : 'Inactive'}</p>
        <p><strong>Currency:</strong> {restaurant?.currencyCode}</p>
      </div>

      <div className="profile-section">
        <h3>Restaurant Details</h3>
        <p><strong>Cuisine Type:</strong> {restaurantInfo.cuisineType || 'Not set'}</p>
        <p><strong>Address:</strong> {restaurantInfo.address || 'Not set'}</p>
        <p><strong>Phone:</strong> {restaurantInfo.phone || 'Not set'}</p>
        <p><strong>Operating Hours:</strong> {restaurantInfo.operatingHours || 'Not set'}</p>
      </div>

      <div className="profile-section">
        <h3>Delivery Settings</h3>
        {restaurant?.availableShippingMethodsPerCountry?.map((countryMethods: any) => (
          <div key={countryMethods.countryCode}>
            <h4>{countryMethods.countryCode}</h4>
            {countryMethods.shippingMethods?.map((method: any) => (
              <div key={method.id} className="shipping-method">
                <p><strong>{method.name}:</strong> ${method.price?.amount}</p>
                <p>{method.description}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Profile Update API
**File**: `src/pages/api/restaurant/profile.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/create-graphq-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.query;

  if (req.method === 'GET') {
    // Get restaurant profile
    try {
      const client = createClient(
        process.env.SALEOR_API_URL!,
        async () => ({ token: process.env.SALEOR_APP_TOKEN! })
      );

      // Use existing RestaurantDetailsDocument
      const result = await client.query(RestaurantDetailsDocument, {
        id: channelId
      }).toPromise();

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }
  }

  if (req.method === 'PUT') {
    // Update restaurant profile using metadata
    try {
      const { restaurantInfo } = req.body;
      
      // Update channel metadata with restaurant information
      const client = createClient(
        process.env.SALEOR_API_URL!,
        async () => ({ token: process.env.SALEOR_APP_TOKEN! })
      );

      // Use updatePrivateMetadata mutation from Phase 1
      const metadataUpdates = Object.entries(restaurantInfo).map(([key, value]) => ({
        key,
        value: value as string
      }));

      const result = await client.mutation(UpdatePrivateMetadataDocument, {
        id: channelId,
        input: metadataUpdates
      }).toPromise();

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

### Step 4: Navigation and Layout (Days 4-5)

#### 4.1 Restaurant Layout Component
**File**: `src/components/layout/RestaurantLayout.tsx`

```typescript
import { useState } from 'react';
import { ChannelSelector } from '@/components/restaurant/ChannelSelector';

interface RestaurantLayoutProps {
  children: React.ReactNode;
}

export function RestaurantLayout({ children }: RestaurantLayoutProps) {
  const [currentChannelId, setCurrentChannelId] = useState<string>('default-channel');

  return (
    <div className="restaurant-layout">
      <header className="restaurant-header">
        <div className="header-content">
          <h1>F&B Restaurant Management</h1>
          <ChannelSelector 
            currentChannelId={currentChannelId}
            onChannelChange={setCurrentChannelId}
          />
        </div>
      </header>

      <nav className="restaurant-nav">
        <ul>
          <li><a href="/restaurant-dashboard">Dashboard</a></li>
          <li><a href="/menu-management">Menu</a></li>
          <li><a href="/order-queue">Orders</a></li>
          <li><a href="/analytics">Analytics</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </nav>

      <main className="restaurant-main">
        {children}
      </main>

      <footer className="restaurant-footer">
        <p>&copy; 2025 F&B Restaurant Management</p>
      </footer>
    </div>
  );
}
```

#### 4.2 Dashboard Styles
**File**: `src/styles/restaurant-dashboard.css`

```css
.restaurant-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.restaurant-header {
  background: #2563eb;
  color: white;
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.restaurant-nav {
  background: #1e40af;
  padding: 0 2rem;
}

.restaurant-nav ul {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.restaurant-nav li {
  margin-right: 2rem;
}

.restaurant-nav a {
  color: white;
  text-decoration: none;
  padding: 1rem 0;
  display: block;
  border-bottom: 2px solid transparent;
}

.restaurant-nav a:hover {
  border-bottom-color: #60a5fa;
}

.restaurant-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.order-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.order-total {
  font-size: 1.25rem;
  font-weight: bold;
  color: #059669;
}

.order-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.accept-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.reject-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
```

---

### Step 5: Integration and Testing (Day 5)

#### 5.1 Integration Points Checklist
- ✅ **GraphQL Operations**: Verify all queries work with dashboard
- ✅ **Webhook Integration**: Test real-time order notifications
- ✅ **Authentication**: Confirm app permissions work
- ✅ **Channel Management**: Test multi-restaurant switching
- ✅ **Metadata Updates**: Verify profile updates save correctly

#### 5.2 Testing Plan
```typescript
// Test file: src/__tests__/restaurant-dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { RestaurantDashboard } from '@/pages/restaurant-dashboard';

describe('Restaurant Dashboard', () => {
  test('renders dashboard with channel selector', () => {
    render(<RestaurantDashboard />);
    expect(screen.getByText('F&B Restaurant Management')).toBeInTheDocument();
  });

  test('displays order notifications', () => {
    // Mock order data and test display
  });

  test('handles channel switching', () => {
    // Test channel selection functionality
  });
});
```

---

## Implementation Timeline

### Day 1: Foundation Setup
- ✅ Create restaurant-dashboard.tsx with basic structure
- ✅ Implement ChannelSelector component
- ✅ Set up restaurant layout component

### Day 2: Real-time Integration
- ✅ Implement OrderNotifications component with polling
- ✅ Create OrderCard with action buttons
- ✅ Connect to existing GraphQL operations

### Day 3: Profile Management
- ✅ Build RestaurantProfile component
- ✅ Implement profile editing functionality
- ✅ Create profile update API endpoint

### Day 4: Polish and Styling
- ✅ Add responsive CSS styling
- ✅ Implement navigation structure
- ✅ Add loading states and error handling

### Day 5: Testing and Integration
- ✅ Test all components with real data
- ✅ Verify webhook integration works
- ✅ Test multi-channel switching
- ✅ Deploy to development environment

---

## Success Metrics

### Technical Metrics
- ✅ Dashboard loads in < 2 seconds
- ✅ Order notifications appear within 30 seconds of webhook
- ✅ Channel switching works without page reload
- ✅ Profile updates save successfully

### User Experience Metrics
- ✅ Restaurant staff can complete common tasks intuitively
- ✅ Order acceptance flow is streamlined
- ✅ Multi-restaurant operators can switch contexts easily
- ✅ Real-time updates improve operational efficiency

---

## Risk Mitigation

### Potential Issues
1. **Performance**: Large number of orders could slow dashboard
   - **Solution**: Implement pagination and virtual scrolling

2. **Real-time Updates**: Polling might miss rapid order changes
   - **Solution**: Phase 3 will implement WebSocket connections

3. **Authentication**: App permissions might not work as expected
   - **Solution**: Use proven auth patterns from Phase 1

### Contingency Plans
- **Fallback UI**: Basic HTML version if React components fail
- **Manual Refresh**: Button to manually reload order data
- **Error Boundaries**: Graceful degradation for failed components

---

## Next Steps After Phase 2.1

### Immediate Next Phase (2.2)
1. **Menu Management Interface** - Allow restaurant staff to manage their products
2. **Order Queue System** - Advanced order processing with kitchen workflow
3. **Basic Analytics** - Revenue and performance metrics

### Future Phases
- **Phase 3**: Real-time WebSocket connections
- **Phase 4**: Customer-facing interfaces
- **Phase 5**: Comprehensive testing
- **Phase 6**: Production deployment

---

## Conclusion

Phase 2.1 will provide restaurant operators with a complete dashboard interface to manage their operations using the solid foundation built in Phase 1. The implementation leverages existing GraphQL operations and webhook infrastructure while providing an intuitive user interface for daily restaurant management tasks.

**Estimated Completion**: 5 days  
**Dependencies**: None (Phase 1 complete)  
**Risk Level**: Low (building on proven foundation)