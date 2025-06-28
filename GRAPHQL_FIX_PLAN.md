# GraphQL Validation Fix Plan

## Overview
Plan to fix 23 GraphQL validation errors in F&B app implementation by leveraging successful API patterns from F&B_API_TEST_LOG.md.

## Key Learnings from Successful API Tests

### ✅ Working Patterns Identified:
1. **Channel Usage**: "default-channel" works for product operations
2. **Basic Auth**: `admin:admin` authentication successful for public operations  
3. **Products Query**: Successfully retrieved 5 products with proper channel specification
4. **Categories Query**: Retrieved 5 categories successfully
5. **Checkout Creation**: $1.99 USD checkout created successfully

### ❌ Current GraphQL Issues:
- 23 validation errors in our F&B GraphQL files
- Incorrect field names and mutation syntax
- Wrong argument types and missing required fields
- Invalid query structure for Saleor schema

---

## Fix Strategy

### Phase 1: Fix Channels Query (restaurants-revised.graphql)
**Issues to Fix:**
- `ChannelFilterInput` doesn't exist → Remove filter parameter
- `channels` doesn't support `first` and `filter` → Use simple channels query
- Missing `edges` and `pageInfo` → Channels returns direct array, not connection

**Solution:**
```graphql
# Use simple channels query that actually works
query AllChannels {
  channels {
    id
    name
    slug
    isActive
    currencyCode
    defaultCountry {
      code
      country
    }
    metadata {
      key
      value
    }
  }
}
```

### Phase 2: Fix Order Queries (orders-restaurant.graphql)
**Issues to Fix:**
- `$channel` type mismatch: `String!` vs `ID!` → Change variable type
- `Order.events` doesn't support `first` parameter → Remove pagination
- `events.edges` doesn't exist → Use direct array access
- Wrong filter syntax for order status

**Solution:**
```graphql
query RestaurantOrderQueue($channel: ID!, $status: [OrderStatusFilter!]) {
  orders(
    filter: { 
      channels: [$channel]
      status: $status
    }
    first: 100
    sortBy: { field: CREATION_DATE, direction: ASC }
  ) {
    edges {
      node {
        id
        number
        status
        # ... rest of fields
        events {  # Remove first parameter
          id
          type
          date
          message
        }
      }
    }
  }
}
```

### Phase 3: Fix Mutation Syntax (restaurant-orders.graphql)
**Issues to Fix:**
- `orderUpdatePrivateMetadata` doesn't exist → Use `updatePrivateMetadata`
- `OrderUpdateInput.status` field doesn't exist → Use separate mutation
- `orderFulfillmentCreate` doesn't exist → Use correct fulfillment mutation

**Solution:**
```graphql
mutation AcceptRestaurantOrder($orderId: ID!) {
  # Use correct order update mutation
  orderConfirm(id: $orderId) {
    order {
      id
      status
    }
    errors {
      field
      message
    }
  }
  
  # Use correct metadata update mutation  
  updatePrivateMetadata(
    id: $orderId
    input: [
      { key: "acceptedAt", value: "2024-01-01T12:00:00Z" }
      { key: "status", value: "accepted" }
    ]
  ) {
    item {
      id
      privateMetadata {
        key
        value
      }
    }
    errors {
      field
      message
    }
  }
}
```

### Phase 4: Validate Against Working Schema
**Reference Successful Patterns:**
- Products query from API test log
- Shop information query structure
- Checkout creation pattern
- Channel specification: "default-channel"

---

## Implementation Steps

### Step 1: Create Corrected Channels Query ⏳
- Remove invalid filter parameters
- Use direct channels array access
- Test against working API pattern

### Step 2: Fix Order Management Queries ⏳  
- Correct variable types (String → ID)
- Remove unsupported pagination on events
- Use proper order filter syntax

### Step 3: Rewrite Mutation Operations ⏳
- Replace non-existent mutations with working ones
- Use `updatePrivateMetadata` for custom data
- Follow successful checkout creation pattern

### Step 4: Test Type Generation ⏳
- Run `pnpm generate:app-graphql-types`
- Verify all 23 errors are resolved
- Confirm TypeScript types are generated

---

## Expected Outcomes

### ✅ After Fixes:
- All GraphQL validation errors resolved
- TypeScript types successfully generated  
- Working F&B queries based on proven API patterns
- Ready to proceed to webhook implementation (Phase 1.3)

### 🎯 Key Files to Update:
1. `/graphql/queries/restaurants-revised.graphql` 
2. `/graphql/queries/orders-restaurant.graphql`
3. `/graphql/mutations/restaurant-orders.graphql`

---

## Risk Mitigation

### Validation Strategy:
1. **Cross-reference with API test log** - Use only proven working patterns
2. **Incremental testing** - Fix one file at a time and test generation
3. **Schema verification** - Check each field exists in actual Saleor schema
4. **Fallback plan** - Keep working patterns from API tests as reference

### Success Metrics:
- ✅ Zero GraphQL validation errors
- ✅ Successful type generation
- ✅ All queries follow proven API patterns
- ✅ Ready for webhook implementation

---

## Next Phase Preview: Webhooks (1.3)

Once GraphQL fixes are complete:
1. Create restaurant order webhook handlers
2. Implement real-time order notifications  
3. Build kitchen display system integration
4. Test webhook delivery to restaurant dashboard

**Timeline**: Complete GraphQL fixes in current session, proceed to webhooks immediately after.