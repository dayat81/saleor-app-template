# Restaurant Dashboard Selenium Test Plan

## Overview

This test plan outlines comprehensive Selenium WebDriver test scenarios for the Restaurant Dashboard application. The tests verify GUI functionality, user interactions, and real-time features across different browser environments.

## Test Environment Setup

### Prerequisites
- **Selenium WebDriver** (latest version)
- **Browser Drivers**: ChromeDriver, GeckoDriver (Firefox), EdgeDriver
- **Test Framework**: pytest + selenium (Python) or Jest + selenium-webdriver (Node.js)
- **Saleor Instance**: Running Saleor backend with test data
- **App Installation**: Restaurant dashboard app installed in Saleor

### Test Data Requirements
- At least 5 test restaurant channels with metadata
- 10+ test orders in various states (UNCONFIRMED, UNFULFILLED, FULFILLED)
- Test user with restaurant management permissions
- Sample product catalog with F&B items

### Browser Support Matrix
| Browser | Version | Platform | Priority |
|---------|---------|----------|----------|
| Chrome | Latest | Windows/Mac/Linux | High |
| Firefox | Latest | Windows/Mac/Linux | High |
| Safari | Latest | Mac | Medium |
| Edge | Latest | Windows | Medium |
| Mobile Chrome | Latest | Android | Low |
| Mobile Safari | Latest | iOS | Low |

## Test Scenarios

### TS001: Initial Page Load and Authentication

**Objective**: Verify restaurant dashboard loads correctly and handles authentication

**Test Steps**:
1. Navigate to `http://localhost:3000/restaurant-dashboard`
2. Verify page loads without JavaScript errors
3. Check for proper fallback message when not in Saleor context
4. Navigate via Saleor Dashboard app installation
5. Verify AppBridge initialization
6. Confirm GraphQL client connectivity

**Expected Results**:
- Direct access shows installation message
- Saleor Dashboard access loads full interface
- No console errors
- Loading spinner appears during initialization
- Dashboard renders within 3 seconds

**Selenium Elements**:
```python
# Direct access fallback
fallback_title = driver.find_element(By.XPATH, "//text()[contains(., 'Restaurant Dashboard')]")
installation_message = driver.find_element(By.XPATH, "//text()[contains(., 'Please install this app')]")

# Loading states
spinner = driver.find_element(By.CLASS_NAME, "spinner")
dashboard_header = driver.find_element(By.XPATH, "//text()[contains(., '🍽️ Restaurant Dashboard')]")
```

---

### TS002: Channel Selection Interface

**Objective**: Test channel selection dropdown and data filtering

**Test Steps**:
1. Locate channel selector in header
2. Click to open dropdown
3. Verify available restaurant channels are listed
4. Select different channel
5. Confirm UI updates with channel-specific data
6. Verify channel persistence across page interactions

**Expected Results**:
- Dropdown opens smoothly
- Only restaurant channels (with F&B metadata) appear
- Selection updates dashboard data
- Selected channel highlighted
- Channel name appears in header

**Selenium Elements**:
```python
channel_selector = driver.find_element(By.CSS_SELECTOR, "[data-testid='channel-selector']")
channel_options = driver.find_elements(By.CSS_SELECTOR, "[data-testid='channel-option']")
selected_channel = driver.find_element(By.CSS_SELECTOR, "[data-testid='selected-channel']")
```

---

### TS003: Order Queue Display and Management

**Objective**: Verify order list display and interactive elements

**Test Steps**:
1. Navigate to Order Queue tab
2. Verify order cards display correctly
3. Check order information completeness:
   - Order number, status, timestamp
   - Customer details
   - Line items with quantities and prices
   - Total amount
4. Test order sorting/filtering (if implemented)
5. Verify empty state when no orders
6. Test refresh functionality

**Expected Results**:
- Orders display in cards format
- All order details visible and formatted
- Real-time updates occur
- Empty state shows appropriate message
- Refresh button works

**Selenium Elements**:
```python
order_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid='order-card']")
order_number = driver.find_element(By.CSS_SELECTOR, "[data-testid='order-number']")
customer_info = driver.find_element(By.CSS_SELECTOR, "[data-testid='customer-info']")
order_items = driver.find_elements(By.CSS_SELECTOR, "[data-testid='order-item']")
refresh_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='refresh-orders']")
```

---

### TS004: Order Accept Workflow

**Objective**: Test order acceptance functionality with preparation time

**Test Steps**:
1. Locate pending order in queue
2. Click "Accept Order" button
3. Verify modal dialog opens
4. Check preparation time dropdown options
5. Select preparation time (15 minutes)
6. Click "Accept Order" in modal
7. Verify success notification
8. Confirm order status updates
9. Check order removal from pending queue

**Expected Results**:
- Accept button is clickable and responsive
- Modal opens with proper form fields
- Preparation time options available (10min-1hr)
- GraphQL mutation executes successfully
- Success notification appears
- Order status reflects acceptance

**Selenium Elements**:
```python
accept_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='accept-order-btn']")
accept_modal = driver.find_element(By.CSS_SELECTOR, "[data-testid='accept-modal']")
prep_time_select = driver.find_element(By.CSS_SELECTOR, "[data-testid='prep-time-select']")
confirm_accept = driver.find_element(By.CSS_SELECTOR, "[data-testid='confirm-accept']")
success_notification = driver.find_element(By.CSS_SELECTOR, "[data-testid='success-notification']")
```

---

### TS005: Order Reject Workflow

**Objective**: Test order rejection functionality with reason input

**Test Steps**:
1. Locate pending order in queue
2. Click "Reject" button
3. Verify reject modal opens
4. Enter rejection reason in text field
5. Click "Reject Order" in modal
6. Verify confirmation dialog (if any)
7. Confirm rejection success notification
8. Check order removal from queue

**Expected Results**:
- Reject button opens modal
- Text area accepts reason input
- Rejection processes successfully
- Notification confirms action
- Order disappears from pending list

**Selenium Elements**:
```python
reject_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='reject-order-btn']")
reject_modal = driver.find_element(By.CSS_SELECTOR, "[data-testid='reject-modal']")
rejection_reason = driver.find_element(By.CSS_SELECTOR, "[data-testid='rejection-reason']")
confirm_reject = driver.find_element(By.CSS_SELECTOR, "[data-testid='confirm-reject']")
```

---

### TS006: Restaurant Profile Tab

**Objective**: Verify restaurant profile information display

**Test Steps**:
1. Click "Restaurant Profile" tab
2. Verify tab navigation works
3. Check basic information section:
   - Restaurant name
   - Status (Active/Inactive)
   - Currency
   - Channel slug
4. Check restaurant details section:
   - Restaurant type
   - Cuisine type
   - Phone number
   - Address
5. Verify metadata handling for missing values

**Expected Results**:
- Tab navigation smooth
- All profile fields display correctly
- Missing metadata shows "Not set"
- Layout responsive on different screen sizes

**Selenium Elements**:
```python
profile_tab = driver.find_element(By.CSS_SELECTOR, "[data-testid='profile-tab']")
restaurant_name = driver.find_element(By.CSS_SELECTOR, "[data-testid='restaurant-name']")
restaurant_status = driver.find_element(By.CSS_SELECTOR, "[data-testid='restaurant-status']")
cuisine_type = driver.find_element(By.CSS_SELECTOR, "[data-testid='cuisine-type']")
```

---

### TS007: Real-time Notifications

**Objective**: Test notification system and browser permissions

**Test Steps**:
1. Check notification icon in header
2. Click to request browser permissions
3. Verify permission dialog appears
4. Grant notifications permission
5. Accept an order to trigger notification
6. Verify browser notification appears
7. Test notification content accuracy
8. Check notification icon state changes

**Expected Results**:
- Permission request handled gracefully
- Browser notification appears for order actions
- Notification content matches action
- Icon updates to reflect permission status

**Selenium Elements**:
```python
notification_icon = driver.find_element(By.CSS_SELECTOR, "[data-testid='notification-icon']")
permission_button = driver.find_element(By.CSS_SELECTOR, "[data-testid='enable-notifications']")

# Note: Browser notifications require special handling in Selenium
driver.execute_script("return Notification.permission")
```

---

### TS008: Metrics Dashboard Cards

**Objective**: Verify metrics calculation and display

**Test Steps**:
1. Check metrics cards in header section
2. Verify card contents:
   - Pending Orders count
   - Total Active orders
   - Today's Revenue amount
   - Restaurant Status indicator
3. Accept/reject orders and verify metrics update
4. Test hover effects on cards
5. Verify responsive layout on mobile

**Expected Results**:
- Metrics display correct values
- Calculations update in real-time
- Hover effects work smoothly
- Cards stack properly on mobile

**Selenium Elements**:
```python
metrics_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid='metric-card']")
pending_count = driver.find_element(By.CSS_SELECTOR, "[data-testid='pending-orders-metric']")
revenue_amount = driver.find_element(By.CSS_SELECTOR, "[data-testid='revenue-metric']")
```

---

### TS009: Responsive Design Testing

**Objective**: Verify dashboard works across different screen sizes

**Test Steps**:
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)
4. Verify tab navigation on mobile
5. Check modal dialogs on small screens
6. Test touch interactions
7. Verify scrolling behavior

**Expected Results**:
- Layout adapts to screen size
- All functionality accessible on mobile
- Touch targets are appropriately sized
- No horizontal scrolling on mobile
- Modals fit screen properly

**Selenium Code**:
```python
# Responsive testing
driver.set_window_size(1920, 1080)  # Desktop
driver.set_window_size(768, 1024)   # Tablet
driver.set_window_size(375, 667)    # Mobile
```

---

### TS010: Error Handling and Edge Cases

**Objective**: Test error states and edge case handling

**Test Steps**:
1. Simulate network disconnection
2. Test with invalid channel selection
3. Try order actions with expired session
4. Test with empty order queue
5. Verify error messages display
6. Test retry functionality
7. Check loading states during slow requests

**Expected Results**:
- Error messages are user-friendly
- Retry mechanisms work
- Loading states prevent user confusion
- Graceful degradation when offline

---

### TS011: Performance and Load Testing

**Objective**: Verify dashboard performance under load

**Test Steps**:
1. Load dashboard with 50+ pending orders
2. Measure page load time
3. Test rapid order accept/reject actions
4. Monitor memory usage during extended session
5. Test polling performance over time
6. Verify no memory leaks

**Expected Results**:
- Page loads within 3 seconds
- Actions complete within 1 second
- No significant memory leaks
- Smooth scrolling with many orders

---

### TS012: Cross-browser Compatibility

**Objective**: Ensure consistent behavior across browsers

**Test Steps**:
1. Run core functionality tests in Chrome
2. Repeat tests in Firefox
3. Test in Safari (Mac only)
4. Test in Edge
5. Compare behavior and identify differences
6. Verify all JavaScript features work

**Expected Results**:
- Consistent appearance across browsers
- All functionality works in supported browsers
- No browser-specific JavaScript errors

---

## Test Data Setup Scripts

### Sample Test Data Creation
```python
def create_test_data():
    """Create sample restaurant channels and orders for testing"""
    channels = [
        {
            "name": "Pizza Palace",
            "slug": "pizza-palace",
            "metadata": {
                "restaurantType": "fast-food",
                "cuisineType": "Italian",
                "phone": "+1-555-0123"
            }
        },
        {
            "name": "Sushi Express",
            "slug": "sushi-express", 
            "metadata": {
                "restaurantType": "restaurant",
                "cuisineType": "Japanese",
                "phone": "+1-555-0456"
            }
        }
    ]
    
    orders = [
        {
            "channel": "pizza-palace",
            "status": "UNCONFIRMED",
            "total": 25.99,
            "items": [
                {"name": "Margherita Pizza", "quantity": 1, "price": 18.99},
                {"name": "Garlic Bread", "quantity": 1, "price": 7.00}
            ]
        }
    ]
```

---

## Test Execution Framework

### Python + Selenium + pytest
```python
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestRestaurantDashboard:
    @pytest.fixture
    def driver(self):
        driver = webdriver.Chrome()
        driver.implicitly_wait(10)
        yield driver
        driver.quit()
    
    def test_page_load(self, driver):
        driver.get("http://localhost:3000/restaurant-dashboard")
        title = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//text()[contains(., 'Restaurant Dashboard')]"))
        )
        assert title.is_displayed()
    
    def test_channel_selection(self, driver):
        # Test implementation
        pass
```

---

## Test Automation Pipeline

### CI/CD Integration
```yaml
# .github/workflows/selenium-tests.yml
name: Restaurant Dashboard E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '22'
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Start test server
      run: |
        pnpm dev &
        sleep 10
        
    - name: Setup Selenium
      run: |
        pip install selenium pytest
        wget -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/LATEST_RELEASE/chromedriver_linux64.zip
        unzip /tmp/chromedriver.zip -d /usr/local/bin/
        
    - name: Run Selenium tests
      run: pytest tests/selenium/
      
    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: test-results/
```

---

## Test Reporting

### Test Report Template
- **Test Execution Summary**
- **Pass/Fail Rates by Browser**
- **Performance Metrics**
- **Screenshots for Failed Tests**
- **Error Logs and Stack Traces**
- **Recommendations for Fixes**

### Success Criteria
- **Functional Tests**: 100% pass rate
- **Cross-browser**: 95% consistency
- **Performance**: <3s page load, <1s actions
- **Mobile**: All features accessible
- **Error Handling**: Graceful failure recovery

---

## Maintenance and Updates

### Test Maintenance Schedule
- **Weekly**: Run full test suite
- **Sprint End**: Update tests for new features
- **Release**: Complete regression testing
- **Monthly**: Review and optimize test performance

### Test Data Refresh
- **Daily**: Reset test database
- **Weekly**: Update test scenarios
- **Monthly**: Review test coverage

This comprehensive test plan ensures the Restaurant Dashboard GUI functions correctly across all supported environments and use cases.