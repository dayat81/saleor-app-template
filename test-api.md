# Saleor API Test Plan

## Overview
This test plan outlines the steps to build and test core F&B application entities using the Saleor GraphQL API:
- Merchant (Shop configuration)
- Outlet (Warehouse/Channel)
- Products (Menu items)
- Customer (User accounts)
- Order (Transactions)

## Prerequisites
- Saleor instance running (cloud or self-hosted)
- Admin API token or app authentication
- GraphQL client (GraphQL Playground, Postman, or Insomnia)
- Base URL: `https://store-5xiatpsi.saleor.cloud/graphql/`

## Test Scenarios

### 1. Shop/Merchant Configuration

#### Test Case 1.1: Retrieve Shop Information
```graphql
query {
  shop {
    name
    description
    domain {
      host
    }
    defaultCountry {
      code
      country
    }
    currencies
    languages {
      code
      language
    }
  }
}
```

#### Test Case 1.2: Update Shop Settings
```graphql
mutation {
  shopSettingsUpdate(input: {
    headerText: "Fresh Local Food Marketplace"
    description: "Your neighborhood food & beverage destination"
  }) {
    shop {
      name
      description
    }
    errors {
      field
      message
    }
  }
}
```

### 2. Outlet/Warehouse Management

#### Test Case 2.1: Create Warehouse (Outlet)
```graphql
mutation {
  createWarehouse(input: {
    name: "Downtown Outlet"
    slug: "downtown-outlet"
    email: "downtown@localfood.com"
    address: {
      streetAddress1: "123 Main Street"
      city: "Downtown"
      postalCode: "12345"
      country: "US"
    }
  }) {
    warehouse {
      id
      name
      slug
      email
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 2.2: Create Sales Channel
```graphql
mutation {
  channelCreate(input: {
    name: "Downtown Channel"
    slug: "downtown"
    currencyCode: "USD"
    defaultCountry: "US"
  }) {
    channel {
      id
      name
      slug
      currencyCode
    }
    errors {
      field
      message
    }
  }
}
```

### 3. Product Management

#### Test Case 3.1: Create Product Category
```graphql
mutation {
  categoryCreate(input: {
    name: "Beverages"
    slug: "beverages"
    description: "Fresh juices, coffee, and specialty drinks"
  }) {
    category {
      id
      name
      slug
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 3.2: Create Product Type
```graphql
mutation {
  productTypeCreate(input: {
    name: "Beverage"
    slug: "beverage"
    kind: NORMAL
    hasVariants: true
    productAttributes: []
    variantAttributes: []
  }) {
    productType {
      id
      name
      hasVariants
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 3.3: Create Product
```graphql
mutation {
  productCreate(input: {
    name: "Fresh Orange Juice"
    slug: "fresh-orange-juice"
    description: "Freshly squeezed orange juice made daily"
    productType: "UHJvZHVjdFR5cGU6MQ=="
    category: "Q2F0ZWdvcnk6MQ=="
    weight: 0.5
  }) {
    product {
      id
      name
      slug
      description
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 3.4: Create Product Variant
```graphql
mutation {
  productVariantCreate(input: {
    product: "UHJvZHVjdDox"
    sku: "OJ-SMALL-001"
    name: "Small (12oz)"
    weight: 0.5
    stocks: [{
      warehouse: "V2FyZWhvdXNlOjE="
      quantity: 100
    }]
  }) {
    productVariant {
      id
      name
      sku
      product {
        name
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 3.5: Set Product Pricing
```graphql
mutation {
  productChannelListingUpdate(id: "UHJvZHVjdDox", input: {
    updateChannels: [{
      channelId: "Q2hhbm5lbDox"
      isPublished: true
      publicationDate: "2024-01-01"
      visibleInListings: true
      availableForPurchase: "2024-01-01"
    }]
  }) {
    product {
      name
      channelListings {
        channel {
          name
        }
        isPublished
      }
    }
    errors {
      field
      message
    }
  }
}
```

### 4. Customer Management

#### Test Case 4.1: Create Customer Account
```graphql
mutation {
  customerCreate(input: {
    firstName: "John"
    lastName: "Doe"
    email: "john.doe@email.com"
    defaultBillingAddress: {
      firstName: "John"
      lastName: "Doe"
      streetAddress1: "456 Oak Street"
      city: "Somewhere"
      postalCode: "67890"
      country: "US"
    }
    defaultShippingAddress: {
      firstName: "John"
      lastName: "Doe"
      streetAddress1: "456 Oak Street"
      city: "Somewhere"
      postalCode: "67890"
      country: "US"
    }
  }) {
    user {
      id
      email
      firstName
      lastName
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 4.2: Query Customer Details
```graphql
query {
  customers(first: 10) {
    edges {
      node {
        id
        email
        firstName
        lastName
        dateJoined
        orders {
          totalCount
        }
        defaultBillingAddress {
          streetAddress1
          city
        }
      }
    }
  }
}
```

### 5. Order Management

#### Test Case 5.1: Create Checkout
```graphql
mutation {
  checkoutCreate(input: {
    channel: "downtown"
    email: "john.doe@email.com"
    lines: [{
      quantity: 2
      variantId: "UHJvZHVjdFZhcmlhbnQ6MQ=="
    }]
    shippingAddress: {
      firstName: "John"
      lastName: "Doe"
      streetAddress1: "456 Oak Street"
      city: "Somewhere"
      postalCode: "67890"
      country: "US"
    }
    billingAddress: {
      firstName: "John"
      lastName: "Doe"
      streetAddress1: "456 Oak Street"
      city: "Somewhere"
      postalCode: "67890"
      country: "US"
    }
  }) {
    checkout {
      id
      email
      lines {
        quantity
        variant {
          name
          product {
            name
          }
        }
      }
      totalPrice {
        gross {
          amount
          currency
        }
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 5.2: Complete Checkout
```graphql
mutation {
  checkoutComplete(checkoutId: "Q2hlY2tvdXQ6MQ==") {
    order {
      id
      number
      status
      total {
        gross {
          amount
          currency
        }
      }
      lines {
        quantity
        variant {
          name
        }
      }
    }
    errors {
      field
      message
    }
  }
}
```

#### Test Case 5.3: Query Orders
```graphql
query {
  orders(first: 10) {
    edges {
      node {
        id
        number
        created
        status
        user {
          email
        }
        total {
          gross {
            amount
            currency
          }
        }
        lines {
          quantity
          variant {
            name
            product {
              name
            }
          }
        }
      }
    }
  }
}
```

#### Test Case 5.4: Update Order Status
```graphql
mutation {
  orderUpdate(id: "T3JkZXI6MQ==", input: {
    status: FULFILLED
  }) {
    order {
      id
      status
      fulfillments {
        status
      }
    }
    errors {
      field
      message
    }
  }
}
```

## Test Data Setup

### Sample Product Categories
- Beverages (Coffee, Tea, Juices, Smoothies)
- Food (Sandwiches, Salads, Snacks)
- Bakery (Pastries, Bread, Desserts)

### Sample Products
1. **Fresh Orange Juice**
   - Variants: Small (12oz), Medium (16oz), Large (20oz)
   - Category: Beverages
   - Stock: 100 units per variant

2. **Artisan Coffee**
   - Variants: Espresso, Americano, Latte, Cappuccino
   - Category: Beverages
   - Stock: 50 units per variant

3. **Garden Salad**
   - Variants: Small, Regular, Large
   - Category: Food
   - Stock: 30 units per variant

### Sample Customers
- John Doe (john.doe@email.com)
- Jane Smith (jane.smith@email.com)
- Mike Johnson (mike.johnson@email.com)

## Validation Checklist

### ✅ Merchant/Shop Configuration
- [ ] Shop details are properly configured
- [ ] Default currency and country are set
- [ ] Shop domain is accessible

### ✅ Outlet/Warehouse Setup
- [ ] Warehouse created with correct address
- [ ] Sales channel configured
- [ ] Warehouse linked to channel

### ✅ Product Management
- [ ] Categories created and organized
- [ ] Product types defined with proper attributes
- [ ] Products created with descriptions
- [ ] Variants created with SKUs
- [ ] Stock quantities assigned
- [ ] Pricing configured per channel
- [ ] Products published and visible

### ✅ Customer Management
- [ ] Customer accounts created
- [ ] Billing/shipping addresses saved
- [ ] Customer data properly formatted
- [ ] Email validation working

### ✅ Order Processing
- [ ] Checkout creation successful
- [ ] Line items added correctly
- [ ] Pricing calculations accurate
- [ ] Checkout completion creates order
- [ ] Order status updates work
- [ ] Inventory decrements properly

## Error Handling Tests

### Authentication Errors
- Test with invalid/expired tokens
- Test with insufficient permissions

### Validation Errors
- Test with missing required fields
- Test with invalid data formats
- Test with duplicate slugs/SKUs

### Business Logic Errors
- Test ordering out-of-stock items
- Test invalid shipping addresses
- Test currency mismatches

## Performance Tests
- Test bulk product creation
- Test pagination with large datasets
- Test concurrent order processing
- Test API rate limiting

## Notes
- Replace all placeholder IDs with actual IDs from your Saleor instance
- Ensure proper authentication headers are included in all requests
- Monitor API costs and query complexity
- Test webhook notifications if implemented
- Validate data integrity across all operations