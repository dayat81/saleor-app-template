# Restaurant Data Population Plan

## Overview

This plan outlines the strategy to populate the Saleor backend with realistic restaurant and Food & Beverage (F&B) product data to make the Restaurant Dashboard GUI functional and testable.

## Current Issue

The Restaurant Dashboard GUI currently shows no products because the Saleor backend lacks:
- Restaurant channels with proper metadata
- Food & beverage product catalog
- Test orders in various states
- Product variants with pricing

## Data Population Strategy

### Phase 1: Channel Setup
Create restaurant channels with appropriate metadata to identify them as F&B establishments.

### Phase 2: Product Catalog
Populate with realistic Italian restaurant menu items including:
- Pizza varieties
- Pasta dishes  
- Appetizers (Antipasti)
- Beverages
- Desserts

### Phase 3: Order Simulation
Create test orders in different states to populate the order queue.

## Sample Restaurant Data Structure

### Restaurant Channels

#### 1. Pizza Palace (Fast Casual)
- **Channel Name**: Pizza Palace
- **Slug**: pizza-palace
- **Currency**: USD
- **Metadata**:
  - `restaurantType`: "fast-food"
  - `cuisineType`: "Italian"
  - `phone`: "+1-555-0123"
  - `address`: "123 Main St, New York, NY 10001"

#### 2. Bella Vista Ristorante (Fine Dining)
- **Channel Name**: Bella Vista Ristorante
- **Slug**: bella-vista-ristorante
- **Currency**: USD
- **Metadata**:
  - `restaurantType`: "restaurant"
  - `cuisineType`: "Italian"
  - `phone`: "+1-555-0456"
  - `address`: "456 Fifth Ave, New York, NY 10016"

#### 3. Mama Mia Trattoria (Family Style)
- **Channel Name**: Mama Mia Trattoria
- **Slug**: mama-mia-trattoria
- **Currency**: USD
- **Metadata**:
  - `restaurantType`: "trattoria"
  - `cuisineType`: "Italian"
  - `phone`: "+1-555-0789"
  - `address`: "789 Little Italy, New York, NY 10013"

### Product Categories

1. **Pizza** - Various pizza options with sizes and toppings
2. **Pasta** - Traditional Italian pasta dishes
3. **Antipasti** - Appetizers and starters
4. **Secondi** - Main courses (meat, fish)
5. **Contorni** - Side dishes
6. **Dolci** - Desserts
7. **Bevande** - Beverages (non-alcoholic and alcoholic)

### Sample Products with Pricing

#### Pizza Category

##### Margherita Pizza
- **Base Price**: $16.99 (Small), $19.99 (Medium), $22.99 (Large)
- **Description**: "Classic pizza with tomato sauce, fresh mozzarella, fresh basil, and olive oil"
- **Ingredients**: Pizza dough, tomato sauce, fresh mozzarella cheese, fresh basil leaves, olive oil
- **Variants**: Small (10"), Medium (12"), Large (14")
- **Categories**: Pizza, Vegetarian

##### Pepperoni Pizza
- **Base Price**: $18.99 (Small), $21.99 (Medium), $24.99 (Large)
- **Description**: "Traditional pepperoni pizza with mozzarella and tomato sauce"
- **Ingredients**: Pizza dough, tomato sauce, mozzarella cheese, pepperoni
- **Variants**: Small (10"), Medium (12"), Large (14")

##### Quattro Stagioni
- **Base Price**: $21.99 (Small), $24.99 (Medium), $27.99 (Large)
- **Description**: "Four seasons pizza with artichokes, mushrooms, ham, and olives"
- **Ingredients**: Pizza dough, tomato sauce, mozzarella, artichokes, mushrooms, ham, black olives
- **Variants**: Small (10"), Medium (12"), Large (14")

#### Pasta Category

##### Spaghetti Carbonara
- **Price**: $17.99
- **Description**: "Traditional Roman pasta with eggs, pecorino cheese, pancetta, and black pepper"
- **Ingredients**: Spaghetti, eggs, pecorino romano, pancetta, black pepper
- **Variants**: Regular portion, Large portion (+$3.00)

##### Penne Arrabbiata
- **Price**: $15.99
- **Description**: "Spicy tomato sauce with garlic, red peppers, and fresh herbs"
- **Ingredients**: Penne pasta, tomatoes, garlic, red chili peppers, olive oil, parsley
- **Variants**: Regular portion, Large portion (+$3.00)
- **Categories**: Pasta, Spicy, Vegetarian

##### Fettuccine Alfredo
- **Price**: $16.99
- **Description**: "Creamy pasta with butter, parmesan cheese, and fresh herbs"
- **Ingredients**: Fettuccine, butter, parmigiano-reggiano, heavy cream, black pepper
- **Variants**: Regular portion, Large portion (+$3.00)

##### Lasagna della Casa
- **Price**: $19.99
- **Description**: "House special lasagna with meat sauce, ricotta, and mozzarella"
- **Ingredients**: Lasagna sheets, ground beef, ricotta cheese, mozzarella, tomato sauce, herbs
- **Categories**: Pasta, Baked

#### Antipasti Category

##### Bruschetta al Pomodoro
- **Price**: $8.99
- **Description**: "Toasted bread with fresh tomatoes, basil, and garlic"
- **Ingredients**: Italian bread, tomatoes, fresh basil, garlic, olive oil
- **Categories**: Antipasti, Vegetarian

##### Antipasto Misto
- **Price**: $14.99
- **Description**: "Mixed Italian appetizer platter with cured meats and cheeses"
- **Ingredients**: Prosciutto, salami, mozzarella, olives, artichokes, peppers
- **Categories**: Antipasti, Sharing

##### Calamari Fritti
- **Price**: $12.99
- **Description**: "Crispy fried squid rings with marinara sauce"
- **Ingredients**: Fresh squid, flour, olive oil, marinara sauce
- **Categories**: Antipasti, Seafood

#### Secondi Category

##### Chicken Parmigiana
- **Price**: $22.99
- **Description**: "Breaded chicken breast with tomato sauce and mozzarella"
- **Ingredients**: Chicken breast, breadcrumbs, tomato sauce, mozzarella, parmesan
- **Categories**: Secondi, Chicken

##### Grilled Salmon
- **Price**: $26.99
- **Description**: "Fresh Atlantic salmon with lemon and herbs"
- **Ingredients**: Atlantic salmon, lemon, olive oil, herbs
- **Categories**: Secondi, Seafood, Healthy

##### Osso Buco
- **Price**: $28.99
- **Description**: "Braised veal shanks with vegetables and risotto"
- **Ingredients**: Veal shanks, vegetables, white wine, risotto rice
- **Categories**: Secondi, Veal, Premium

#### Beverages Category

##### Italian Sodas
- **Price**: $3.99
- **Description**: "Authentic Italian sparkling beverages"
- **Variants**: Limonata, Aranciata, Chinotto
- **Categories**: Bevande, Non-Alcoholic

##### House Wine
- **Price**: $7.99 (Glass), $28.99 (Bottle)
- **Description**: "Selected Italian wines by the glass or bottle"
- **Variants**: Chianti (Red), Pinot Grigio (White), Prosecco (Sparkling)
- **Categories**: Bevande, Alcoholic

##### Espresso
- **Price**: $2.99
- **Description**: "Traditional Italian espresso"
- **Categories**: Bevande, Coffee

##### Cappuccino
- **Price**: $4.99
- **Description**: "Espresso with steamed milk and foam"
- **Categories**: Bevande, Coffee

#### Desserts Category

##### Tiramisu
- **Price**: $7.99
- **Description**: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone"
- **Ingredients**: Ladyfingers, espresso, mascarpone, eggs, sugar, cocoa
- **Categories**: Dolci

##### Gelato
- **Price**: $5.99
- **Description**: "Italian-style ice cream"
- **Variants**: Vanilla, Chocolate, Strawberry, Pistachio
- **Categories**: Dolci

##### Cannoli Siciliani
- **Price**: $6.99
- **Description**: "Sicilian pastry shells filled with sweet ricotta"
- **Ingredients**: Pastry shells, ricotta cheese, sugar, chocolate chips
- **Categories**: Dolci

## Product Attributes and Metadata

### Common Attributes
- **Dietary Restrictions**: Vegetarian, Vegan, Gluten-Free, Dairy-Free
- **Spice Level**: Mild, Medium, Spicy
- **Allergens**: Contains nuts, Contains dairy, Contains gluten
- **Preparation Time**: 10-15 min, 15-20 min, 20-25 min
- **Portion Size**: Individual, Sharing (2-3 people), Family (4-6 people)

### Restaurant-Specific Metadata
- **Chef's Recommendation**: Boolean flag
- **Popular Item**: Boolean flag  
- **New Item**: Boolean flag
- **Seasonal**: Boolean flag
- **Available for Delivery**: Boolean flag
- **Available for Takeout**: Boolean flag

## Sample Test Orders

### Order States to Create
1. **UNCONFIRMED** - New orders waiting for restaurant acceptance
2. **UNFULFILLED** - Accepted orders being prepared
3. **FULFILLED** - Completed orders for testing history
4. **CANCELED** - Canceled orders for edge case testing

### Test Order Scenarios

#### Order #1001 - Pizza Palace (UNCONFIRMED)
- **Customer**: John Smith
- **Phone**: +1-555-1234
- **Items**:
  - Margherita Pizza (Large) - $22.99
  - Garlic Bread - $6.99
  - Coca-Cola - $2.99
- **Total**: $32.97
- **Order Time**: 2025-06-28 19:30:00
- **Delivery Address**: 321 Oak St, New York, NY 10002

#### Order #1002 - Bella Vista (UNCONFIRMED)
- **Customer**: Maria Garcia
- **Phone**: +1-555-5678
- **Items**:
  - Spaghetti Carbonara - $17.99
  - Antipasto Misto - $14.99
  - House Wine (Chianti Glass) - $7.99
- **Total**: $40.97
- **Order Time**: 2025-06-28 19:45:00
- **Table**: Dine-in, Table 5

#### Order #1003 - Mama Mia (UNFULFILLED)
- **Customer**: Robert Johnson
- **Phone**: +1-555-9012
- **Items**:
  - Pepperoni Pizza (Medium) - $21.99
  - Caesar Salad - $9.99
  - Tiramisu - $7.99
- **Total**: $39.97
- **Order Time**: 2025-06-28 19:15:00
- **Status**: Accepted, Preparation Time: 25 minutes
- **Delivery Address**: 654 Pine Ave, New York, NY 10003

## Implementation Steps

### Step 1: Create Product Types and Attributes
```graphql
# Create product type for Food items
mutation CreateFoodProductType {
  productTypeCreate(input: {
    name: "Food Item"
    slug: "food-item"
    hasVariants: true
    productAttributes: [...]
    variantAttributes: [...]
  }) {
    productType {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```

### Step 2: Create Restaurant Channels
```graphql
# Create Pizza Palace channel
mutation CreatePizzaPalaceChannel {
  channelCreate(input: {
    name: "Pizza Palace"
    slug: "pizza-palace"
    currencyCode: "USD"
    defaultCountry: "US"
    metadata: [
      {key: "restaurantType", value: "fast-food"}
      {key: "cuisineType", value: "Italian"}
      {key: "phone", value: "+1-555-0123"}
      {key: "address", value: "123 Main St, New York, NY 10001"}
    ]
  }) {
    channel {
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

### Step 3: Create Product Categories
```graphql
# Create Pizza category
mutation CreatePizzaCategory {
  categoryCreate(input: {
    name: "Pizza"
    slug: "pizza"
    description: "Traditional Italian pizzas with various toppings"
    metadata: [
      {key: "displayOrder", value: "1"}
      {key: "icon", value: "🍕"}
    ]
  }) {
    category {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```

### Step 4: Create Products with Variants
```graphql
# Create Margherita Pizza product
mutation CreateMargheritaPizza {
  productCreate(input: {
    name: "Margherita Pizza"
    slug: "margherita-pizza"
    description: "Classic pizza with tomato sauce, fresh mozzarella, fresh basil, and olive oil"
    category: "pizza-category-id"
    productType: "food-item-type-id"
    attributes: [
      {attribute: "dietary-restrictions", values: ["vegetarian"]}
      {attribute: "preparation-time", values: ["15-20 min"]}
      {attribute: "allergens", values: ["contains-dairy", "contains-gluten"]}
    ]
    metadata: [
      {key: "chefRecommendation", value: "true"}
      {key: "popularItem", value: "true"}
      {key: "ingredients", value: "Pizza dough, tomato sauce, fresh mozzarella cheese, fresh basil leaves, olive oil"}
    ]
  }) {
    product {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```

### Step 5: Create Product Variants (Sizes)
```graphql
# Create Small Margherita Pizza variant
mutation CreateSmallMargheritaVariant {
  productVariantCreate(input: {
    product: "margherita-pizza-product-id"
    sku: "MARG-PIZZA-SM"
    name: "Small (10\")"
    attributes: [
      {attribute: "size", values: ["small"]}
    ]
    channelListings: [
      {
        channelId: "pizza-palace-channel-id"
        price: "16.99"
        costPrice: "8.50"
      }
    ]
    stocks: [
      {
        warehouse: "main-warehouse-id"
        quantity: 100
      }
    ]
  }) {
    productVariant {
      id
      name
      sku
    }
    errors {
      field
      message
    }
  }
}
```

### Step 6: Create Test Orders
```graphql
# Create test order
mutation CreateTestOrder {
  orderCreate(input: {
    channel: "pizza-palace-channel-id"
    userEmail: "john.smith@example.com"
    billingAddress: {
      firstName: "John"
      lastName: "Smith"
      streetAddress1: "321 Oak St"
      city: "New York"
      postalCode: "10002"
      country: "US"
      phone: "+1-555-1234"
    }
    shippingAddress: {
      firstName: "John"
      lastName: "Smith"
      streetAddress1: "321 Oak St"
      city: "New York"
      postalCode: "10002"
      country: "US"
      phone: "+1-555-1234"
    }
    lines: [
      {
        variantId: "margherita-large-variant-id"
        quantity: 1
      }
    ]
  }) {
    order {
      id
      number
      status
    }
    errors {
      field
      message
    }
  }
}
```

## Success Criteria

After implementation, the Restaurant Dashboard should display:
1. ✅ Multiple restaurant channels in the channel selector
2. ✅ Product categories with appropriate food items
3. ✅ Orders in different states (pending, in progress, completed)
4. ✅ Realistic pricing in USD
5. ✅ Product variants (sizes, options)
6. ✅ Restaurant metadata (cuisine type, contact info)
7. ✅ Order management functionality (accept/reject)

## Testing Verification

1. **GUI Verification**: Check that the Restaurant Dashboard displays products and orders
2. **Channel Filtering**: Verify that switching channels shows channel-specific data
3. **Order Management**: Test accepting and rejecting orders
4. **Metrics Display**: Confirm that metrics cards show correct counts and totals
5. **Real-time Updates**: Verify that order status changes are reflected immediately

## Maintenance

- **Weekly**: Add new seasonal products
- **Monthly**: Update pricing based on market conditions  
- **Quarterly**: Review and refresh test order data
- **As Needed**: Add new restaurant channels for testing different scenarios

This plan provides a comprehensive foundation for populating the Saleor backend with realistic restaurant data that will make the Restaurant Dashboard fully functional and ready for testing and demonstration.