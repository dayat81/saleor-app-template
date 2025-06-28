# F&B App Implementation Plan
## Using Saleor App Template Boilerplate

This document provides a detailed implementation strategy for building the Food & Beverage application using the existing Saleor App Template as the foundation.

## Executive Summary

The F&B app will be built by extending the Saleor App Template to create specialized webhooks, dashboard extensions, and API integrations that support multi-restaurant food ordering, delivery management, and vendor operations.

## Boilerplate Assessment & Adaptation

### Current Template Capabilities
✅ **Available in Template:**
- Saleor API integration with GraphQL Codegen
- Webhook infrastructure (order-created, order-filter-shipping-methods)
- Dashboard widget extensions (server-side and client-side)
- Authentication & APL management
- Next.js + TypeScript foundation
- Testing setup with Vitest

### Required Extensions for F&B
🔧 **Needs Implementation:**
- Multi-channel restaurant management
- Location-based filtering
- Real-time order tracking
- Delivery management system
- Restaurant dashboard interface
- Customer mobile/web apps
- Payment processing enhancements

## Implementation Strategy

### Phase 1: Foundation Extension (Weeks 1-3)

#### 1.1 Project Setup & Configuration
```bash
# Initial setup commands
pnpm install
cp .env.example .env.local
# Configure Saleor Cloud endpoint: https://store-4bpwsmd6.saleor.cloud/graphql/
```

#### 1.2 Saleor Schema Extensions
- **Action**: Extend `graphql/schema.graphql` with F&B specific queries
- **New GraphQL Files Needed**:
  ```
  graphql/
  ├── queries/
  │   ├── restaurants.graphql
  │   ├── menu-items.graphql
  │   ├── delivery-zones.graphql
  │   └── order-tracking.graphql
  ├── mutations/
  │   ├── restaurant-management.graphql
  │   ├── menu-updates.graphql
  │   └── delivery-status.graphql
  └── subscriptions/
      ├── order-updates.graphql
      └── delivery-tracking.graphql
  ```

#### 1.3 Enhanced Webhook System
**Extend existing webhooks in `src/pages/api/webhooks/`:**
- `restaurant-order-received.ts` - New order notifications to restaurants
- `delivery-assigned.ts` - Driver assignment notifications
- `order-status-update.ts` - Real-time status updates
- `payment-confirmed.ts` - Payment processing confirmations

### Phase 2: Core F&B Features (Weeks 4-8)

#### 2.1 Multi-Restaurant Channel Management
**Extend `src/pages/api/manifest.ts`:**
```typescript
// Add restaurant-specific extensions
const restaurantExtensions: AppExtension[] = [
  {
    url: apiBaseURL + "/api/restaurant-dashboard",
    permissions: ["MANAGE_PRODUCTS", "MANAGE_ORDERS"],
    mount: "NAVIGATION_CATALOG",
    label: "Restaurant Management",
    target: "APP_PAGE"
  },
  {
    url: apiBaseURL + "/api/delivery-tracking",
    permissions: ["MANAGE_ORDERS"],
    mount: "ORDER_DETAILS_WIDGETS", 
    label: "Delivery Tracker",
    target: "WIDGET"
  }
]
```

#### 2.2 Restaurant Dashboard Components
**New pages in `src/pages/`:**
- `restaurant-dashboard.tsx` - Main restaurant management interface
- `menu-management.tsx` - Product catalog management
- `order-queue.tsx` - Incoming order processing
- `analytics.tsx` - Restaurant performance metrics

#### 2.3 Enhanced GraphQL Integration
**Update `codegen.ts` configuration:**
```typescript
// Add F&B specific scalar types
scalars: {
  GeoLocation: "{ lat: number; lng: number }",
  DeliveryTime: "string", // ISO duration format
  CuisineType: "string",
  RestaurantStatus: "string"
}
```

### Phase 3: Advanced Features (Weeks 9-12)

#### 3.1 Real-time Order Tracking System
**New API endpoints in `src/pages/api/`:**
- `order-tracking.ts` - WebSocket connection for live updates
- `delivery-location.ts` - GPS tracking integration
- `eta-calculator.ts` - Dynamic delivery time estimation

#### 3.2 Location-Based Services
**Extend `src/lib/` with new utilities:**
```typescript
// src/lib/geolocation.ts
export interface DeliveryZone {
  id: string;
  restaurantId: string;
  polygon: GeoLocation[];
  deliveryFee: number;
  estimatedTime: number;
}

// src/lib/restaurant-finder.ts
export const findNearbyRestaurants = (
  userLocation: GeoLocation,
  radius: number
) => { /* implementation */ }
```

#### 3.3 Payment Integration Enhancement
**Extend existing payment webhooks:**
- Add tip processing for delivery drivers
- Implement split payments for multi-vendor orders
- Handle refund processing for cancelled orders

### Phase 4: Mobile & Customer Interface (Weeks 13-16)

#### 4.1 Customer-Facing Widgets
**New widget components in `src/pages/`:**
- `customer-order-tracker.tsx` - Public order tracking page
- `restaurant-locator.tsx` - Map-based restaurant finder
- `menu-browser.tsx` - Customer menu browsing interface

#### 4.2 Mobile App Integration Points
**API endpoints for mobile consumption:**
```typescript
// src/pages/api/mobile/
├── auth.ts          // Mobile authentication
├── restaurants.ts   // Restaurant listing with geolocation
├── menu.ts         // Mobile-optimized menu data
├── cart.ts         // Shopping cart management
└── orders.ts       // Order placement and tracking
```

### Phase 5: Testing & Quality Assurance (Weeks 17-20)

#### 5.1 Enhanced Testing Strategy
**Extend existing Vitest setup:**
```typescript
// vitest.config.ts additions
test: {
  coverage: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/pages/api/webhooks/**'], // Webhook integration tests separate
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
}
```

#### 5.2 Integration Testing
**New test suites:**
- `tests/integration/restaurant-flow.test.ts` - End-to-end restaurant operations
- `tests/integration/customer-journey.test.ts` - Complete customer ordering flow
- `tests/integration/delivery-tracking.test.ts` - Real-time tracking functionality

### Phase 6: Deployment & Production (Weeks 21-24)

#### 6.1 Production Configuration
**Environment setup:**
```bash
# Production environment variables
SALEOR_API_URL=https://store-4bpwsmd6.saleor.cloud/graphql/
APL=upstash
UPSTASH_URL=redis://...
UPSTASH_TOKEN=...
GOOGLE_MAPS_API_KEY=...
STRIPE_SECRET_KEY=...
```

#### 6.2 Monitoring & Analytics
**Extend `src/lib/` with:**
- `analytics-tracker.ts` - Custom event tracking
- `performance-monitor.ts` - App performance metrics
- `error-reporter.ts` - Centralized error handling

## Technical Implementation Details

### GraphQL Schema Extensions

#### Restaurant Management Queries
```graphql
# graphql/queries/restaurants.graphql
query RestaurantsByLocation($location: GeoLocationInput!, $radius: Float!) {
  restaurants(location: $location, radius: $radius) {
    id
    name
    cuisineType
    rating
    deliveryTime
    deliveryFee
    isOpen
    location {
      lat
      lng
    }
    menu {
      categories {
        id
        name
        products {
          id
          name
          description
          pricing {
            price {
              amount
              currency
            }
          }
          thumbnail {
            url
          }
        }
      }
    }
  }
}
```

#### Order Tracking Subscriptions
```graphql
# graphql/subscriptions/order-updates.graphql
subscription OrderStatusUpdates($orderId: ID!) {
  orderUpdates(orderId: $orderId) {
    id
    status
    deliveryEstimate
    driverLocation {
      lat
      lng
    }
    timeline {
      timestamp
      status
      message
    }
  }
}
```

### Webhook Implementation Examples

#### Restaurant Order Notification
```typescript
// src/pages/api/webhooks/restaurant-order-received.ts
import { NextWebhookApiHandler } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";

const handler: NextWebhookApiHandler<OrderCreatedPayload> = async (
  req,
  res,
  context
) => {
  const { payload } = context;
  
  // Extract restaurant information from order channel
  const restaurantChannel = payload.order.channel;
  
  // Send real-time notification to restaurant dashboard
  await notifyRestaurant(restaurantChannel.id, {
    orderId: payload.order.id,
    customerName: payload.order.billingAddress?.firstName,
    items: payload.order.lines,
    totalAmount: payload.order.total.gross.amount,
    deliveryAddress: payload.order.shippingAddress,
    specialInstructions: payload.order.customerNote
  });
  
  res.status(200).end();
};

export default saleorApp.createWebhookHandler(handler);
```

### Database Schema Extensions

While leveraging Saleor's existing models, additional data structures needed:

```sql
-- Restaurant profiles (stored as Saleor channel metadata)
-- Delivery zones (custom table or metadata)
-- Driver information (custom user attributes)
-- Real-time locations (Redis/temporary storage)
-- Customer preferences (user metadata)
```

## Development Commands & Workflow

### Essential Development Commands
```bash
# Start development with F&B specific environment
pnpm dev

# Generate types after adding F&B GraphQL operations
pnpm generate:app-graphql-types

# Run F&B specific tests
pnpm test src/pages/api/restaurants
pnpm test src/components/restaurant-dashboard

# Build for production deployment
pnpm build
pnpm start
```

### GraphQL Development Workflow
1. Add new `.graphql` files to appropriate folders
2. Run `pnpm generate` to create TypeScript types
3. Import generated operations in components
4. Test with Saleor GraphQL playground

## Integration Points

### Saleor Configuration Requirements
1. **Channels**: Set up separate channels for each restaurant
2. **Products**: Configure food items with variants (size, options)
3. **Shipping**: Set up delivery zones and methods
4. **Payments**: Configure payment gateways
5. **Webhooks**: Register F&B specific webhook endpoints

### Third-Party Integrations
- **Google Maps**: Restaurant locations and delivery tracking
- **Socket.io**: Real-time order updates
- **Firebase**: Push notifications for mobile apps
- **Stripe**: Enhanced payment processing

## Success Metrics & KPIs

### Technical Metrics
- Webhook response time < 500ms
- Real-time update latency < 2 seconds
- API query optimization (N+1 prevention)
- Mobile app loading time < 3 seconds

### Business Metrics
- Order completion rate > 95%
- Restaurant onboarding time < 24 hours
- Customer satisfaction > 4.5/5
- System uptime > 99.9%

## Risk Mitigation

### Technical Risks
- **Saleor API limitations**: Extensive API testing and documentation review
- **Real-time performance**: Load testing with simulated peak traffic
- **Mobile compatibility**: Cross-platform testing strategy

### Business Risks
- **Multi-tenancy complexity**: Gradual rollout with pilot restaurants
- **Data consistency**: Comprehensive backup and sync strategies
- **Scaling challenges**: Horizontal scaling preparation

## Next Steps

1. **Immediate Actions** (Week 1):
   - Set up development environment with Saleor Cloud connection
   - Configure first restaurant channel for testing
   - Implement basic restaurant dashboard extension

2. **Sprint 1 Goals** (Weeks 1-2):
   - Restaurant onboarding flow
   - Basic menu management
   - Order webhook processing

3. **Sprint 2 Goals** (Weeks 3-4):
   - Customer order placement
   - Real-time order tracking foundation
   - Location-based restaurant filtering

This implementation plan leverages the existing Saleor App Template architecture while extending it with F&B-specific functionality, ensuring rapid development while maintaining code quality and scalability.