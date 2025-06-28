# Restaurant Dashboard Implementation Plan

## Overview
Create a comprehensive restaurant dashboard page at `src/pages/restaurant-dashboard.tsx` with channel selection, profile management, order queue display, and real-time notifications.

## Phase 1: Setup & Infrastructure

### 1.1 Page Structure & Layout
- [ ] Create `src/pages/restaurant-dashboard.tsx` with base layout
- [ ] Implement responsive grid layout for dashboard sections
- [ ] Add navigation and header components
- [ ] Set up Material-UI theming for consistent styling

### 1.2 Authentication & Permissions
- [ ] Implement restaurant user authentication check
- [ ] Add role-based access control for restaurant staff
- [ ] Create permission guards for dashboard access
- [ ] Handle unauthorized access redirects

## Phase 2: Channel Selection Interface

### 2.1 Channel Selector Component
- [ ] Create `ChannelSelector` component with dropdown/select UI
- [ ] Fetch available channels from Saleor API
- [ ] Store selected channel in local state/context
- [ ] Persist channel selection in localStorage

### 2.2 Channel-Specific Data Filtering
- [ ] Filter orders by selected channel
- [ ] Update all dashboard data based on channel selection
- [ ] Add channel indicator in UI components
- [ ] Handle channel switching without data loss

## Phase 3: Restaurant Profile Management

### 3.1 Profile Display Component
- [ ] Create `RestaurantProfile` component
- [ ] Display restaurant metadata (name, address, contact)
- [ ] Show operating hours and status
- [ ] Add restaurant logo/image upload capability

### 3.2 Profile Editing Interface
- [ ] Implement inline editing for profile fields
- [ ] Add form validation for profile updates
- [ ] Create GraphQL mutations for profile updates
- [ ] Handle success/error states with notifications

### 3.3 Restaurant Settings
- [ ] Add preparation time settings
- [ ] Configure order acceptance rules
- [ ] Set delivery radius/zones
- [ ] Manage payment methods accepted

## Phase 4: Order Queue Display

### 4.1 Order List Component
- [ ] Create `OrderQueue` component with table/card view
- [ ] Implement order status filters (new, preparing, ready)
- [ ] Add sorting options (time, priority, status)
- [ ] Display order details (items, customer, timing)

### 4.2 Order Management Actions
- [ ] Add order acceptance/rejection functionality
- [ ] Implement status update buttons (preparing, ready)
- [ ] Create order detail modal/drawer
- [ ] Add preparation time adjustment

### 4.3 Order Metrics Dashboard
- [ ] Display active orders count by status
- [ ] Show average preparation time
- [ ] Add daily order statistics
- [ ] Create performance indicators

## Phase 5: Real-time Notifications

### 5.1 WebSocket Integration
- [ ] Set up WebSocket connection for real-time updates
- [ ] Implement subscription to order events
- [ ] Handle connection lifecycle (connect, disconnect, reconnect)
- [ ] Add connection status indicator

### 5.2 Notification System
- [ ] Create notification toast/snackbar component
- [ ] Implement browser push notifications
- [ ] Add notification sound alerts
- [ ] Create notification preferences settings

### 5.3 Real-time Order Updates
- [ ] Auto-refresh order queue on new orders
- [ ] Update order status in real-time
- [ ] Show customer messages/updates instantly
- [ ] Highlight urgent/priority orders

## Phase 6: UI/UX Enhancements

### 6.1 Responsive Design
- [ ] Optimize for tablet use (kitchen displays)
- [ ] Create mobile-friendly layout
- [ ] Add touch-friendly interactions
- [ ] Implement swipe gestures for order actions

### 6.2 Dark Mode & Accessibility
- [ ] Add dark mode toggle
- [ ] Ensure WCAG compliance
- [ ] Add keyboard navigation
- [ ] Implement screen reader support

### 6.3 Performance Optimization
- [ ] Implement virtual scrolling for large order lists
- [ ] Add pagination for historical orders
- [ ] Optimize re-renders with React.memo
- [ ] Cache frequently accessed data

## Implementation Timeline

### Week 1: Foundation
- Days 1-2: Setup & Infrastructure (Phase 1)
- Days 3-4: Channel Selection Interface (Phase 2)
- Day 5: Testing & Bug Fixes

### Week 2: Core Features
- Days 1-2: Restaurant Profile Management (Phase 3)
- Days 3-4: Order Queue Display (Phase 4)
- Day 5: Integration Testing

### Week 3: Real-time & Polish
- Days 1-2: Real-time Notifications (Phase 5)
- Days 3-4: UI/UX Enhancements (Phase 6)
- Day 5: Final Testing & Deployment Prep

## Technical Requirements

### GraphQL Operations Needed
- `GetRestaurantProfile` query
- `UpdateRestaurantProfile` mutation
- `GetOrdersByChannel` query with filters
- `UpdateOrderStatus` mutation
- `OrderCreated` subscription
- `OrderUpdated` subscription

### Components to Create
- `RestaurantDashboard` (main page)
- `ChannelSelector`
- `RestaurantProfile`
- `OrderQueue`
- `OrderCard`
- `OrderDetailsModal`
- `NotificationCenter`
- `DashboardMetrics`

### State Management
- Use React Context for global dashboard state
- Implement channel selection context
- Create notification queue management
- Handle WebSocket connection state

### Testing Strategy
- Unit tests for all components
- Integration tests for GraphQL operations
- E2E tests for critical workflows
- Performance testing for real-time updates

## Success Criteria
- [ ] Restaurant staff can view and manage orders efficiently
- [ ] Real-time updates work reliably
- [ ] Profile management is intuitive
- [ ] Dashboard performs well with 100+ orders
- [ ] Mobile/tablet experience is optimized
- [ ] All features work across different channels