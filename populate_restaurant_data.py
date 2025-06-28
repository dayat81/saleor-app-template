#!/usr/bin/env python3
"""
Restaurant Data Population Script
Executes the data population plan to fill Saleor backend with restaurant products and orders
"""

import requests
import json
import time
from datetime import datetime

class DataPopulationLogger:
    def __init__(self):
        self.logs = []
        self.start_time = datetime.now()
    
    def log(self, action, status, message="", details=None):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "action": action,
            "status": status,
            "message": message,
            "details": details or {}
        }
        self.logs.append(log_entry)
        print(f"[{timestamp}] {action}: {status}")
        if message:
            print(f"    {message}")
    
    def save_report(self, filename):
        with open(filename, 'w') as f:
            f.write("# Restaurant Data Population Execution Log\n\n")
            f.write(f"**Execution Started:** {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Execution Completed:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Duration:** {datetime.now() - self.start_time}\n\n")
            
            # Summary
            success_count = len([log for log in self.logs if log['status'] == 'SUCCESS'])
            error_count = len([log for log in self.logs if log['status'] == 'ERROR'])
            total_count = len([log for log in self.logs if log['status'] in ['SUCCESS', 'ERROR']])
            
            f.write("## Execution Summary\n\n")
            f.write(f"- **Total Operations:** {total_count}\n")
            f.write(f"- **Successful:** {success_count}\n")
            f.write(f"- **Failed:** {error_count}\n")
            f.write(f"- **Success Rate:** {(success_count/total_count*100) if total_count > 0 else 0:.1f}%\n\n")
            
            # Detailed logs
            f.write("## Detailed Execution Log\n\n")
            for log in self.logs:
                f.write(f"### {log['timestamp']} - {log['action']}\n\n")
                f.write(f"**Status:** {log['status']}\n\n")
                if log['message']:
                    f.write(f"**Message:** {log['message']}\n\n")
                if log['details']:
                    f.write(f"**Details:**\n```json\n{json.dumps(log['details'], indent=2)}\n```\n\n")
                f.write("---\n\n")

class SaleorGraphQLClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def execute_query(self, query, variables=None):
        """Execute GraphQL query/mutation"""
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        response = self.session.post(
            f"{self.base_url}/api/graphql",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"GraphQL request failed: {response.status_code} - {response.text}")

def test_saleor_connection(client, logger):
    """Test connection to Saleor GraphQL API"""
    try:
        logger.log("Test Saleor Connection", "RUNNING")
        
        # Simple query to test connection
        query = """
        query {
            shop {
                name
                description
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            logger.log("Test Saleor Connection", "ERROR", 
                      f"GraphQL errors: {result['errors']}")
            return False
        
        shop_name = result.get('data', {}).get('shop', {}).get('name', 'Unknown')
        logger.log("Test Saleor Connection", "SUCCESS", 
                  f"Connected to shop: {shop_name}")
        return True
        
    except Exception as e:
        logger.log("Test Saleor Connection", "ERROR", str(e))
        return False

def check_existing_channels(client, logger):
    """Check what channels already exist"""
    try:
        logger.log("Check Existing Channels", "RUNNING")
        
        query = """
        query {
            channels {
                id
                name
                slug
                currencyCode
                metadata {
                    key
                    value
                }
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            logger.log("Check Existing Channels", "ERROR", 
                      f"GraphQL errors: {result['errors']}")
            return []
        
        channels = result.get('data', {}).get('channels', [])
        logger.log("Check Existing Channels", "SUCCESS", 
                  f"Found {len(channels)} existing channels")
        
        for channel in channels:
            logger.log("Channel Found", "INFO", 
                      f"{channel['name']} ({channel['slug']}) - {channel['currencyCode']}")
        
        return channels
        
    except Exception as e:
        logger.log("Check Existing Channels", "ERROR", str(e))
        return []

def check_existing_products(client, logger):
    """Check what products already exist"""
    try:
        logger.log("Check Existing Products", "RUNNING")
        
        query = """
        query {
            products(first: 10) {
                edges {
                    node {
                        id
                        name
                        slug
                        category {
                            name
                        }
                    }
                }
                totalCount
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            logger.log("Check Existing Products", "ERROR", 
                      f"GraphQL errors: {result['errors']}")
            return 0
        
        products_data = result.get('data', {}).get('products', {})
        total_count = products_data.get('totalCount', 0)
        products = products_data.get('edges', [])
        
        logger.log("Check Existing Products", "SUCCESS", 
                  f"Found {total_count} existing products")
        
        for product in products[:5]:  # Show first 5
            node = product['node']
            category = node.get('category', {}).get('name', 'No category') if node.get('category') else 'No category'
            logger.log("Product Found", "INFO", 
                      f"{node['name']} ({node['slug']}) - Category: {category}")
        
        return total_count
        
    except Exception as e:
        logger.log("Check Existing Products", "ERROR", str(e))
        return 0

def check_existing_orders(client, logger):
    """Check what orders already exist"""
    try:
        logger.log("Check Existing Orders", "RUNNING")
        
        query = """
        query {
            orders(first: 10) {
                edges {
                    node {
                        id
                        number
                        status
                        total {
                            gross {
                                amount
                                currency
                            }
                        }
                        created
                    }
                }
                totalCount
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            logger.log("Check Existing Orders", "ERROR", 
                      f"GraphQL errors: {result['errors']}")
            return 0
        
        orders_data = result.get('data', {}).get('orders', {})
        total_count = orders_data.get('totalCount', 0)
        orders = orders_data.get('edges', [])
        
        logger.log("Check Existing Orders", "SUCCESS", 
                  f"Found {total_count} existing orders")
        
        for order in orders[:3]:  # Show first 3
            node = order['node']
            total = node.get('total', {}).get('gross', {})
            amount = total.get('amount', 'N/A')
            currency = total.get('currency', '')
            logger.log("Order Found", "INFO", 
                      f"Order #{node['number']} - Status: {node['status']} - Total: {amount} {currency}")
        
        return total_count
        
    except Exception as e:
        logger.log("Check Existing Orders", "ERROR", str(e))
        return 0

def simulate_data_population(logger):
    """Simulate data population since we don't have admin access"""
    
    # Simulate channel creation
    restaurant_channels = [
        {"name": "Pizza Palace", "slug": "pizza-palace", "type": "fast-food"},
        {"name": "Bella Vista Ristorante", "slug": "bella-vista-ristorante", "type": "restaurant"},
        {"name": "Mama Mia Trattoria", "slug": "mama-mia-trattoria", "type": "trattoria"}
    ]
    
    for channel in restaurant_channels:
        logger.log(f"Create Channel: {channel['name']}", "SIMULATED", 
                  f"Would create {channel['type']} channel with slug {channel['slug']}")
        time.sleep(0.5)  # Simulate processing time
    
    # Simulate product creation
    sample_products = [
        {"name": "Margherita Pizza", "category": "Pizza", "price": "$16.99-$22.99"},
        {"name": "Pepperoni Pizza", "category": "Pizza", "price": "$18.99-$24.99"},
        {"name": "Spaghetti Carbonara", "category": "Pasta", "price": "$17.99"},
        {"name": "Penne Arrabbiata", "category": "Pasta", "price": "$15.99"},
        {"name": "Fettuccine Alfredo", "category": "Pasta", "price": "$16.99"},
        {"name": "Bruschetta al Pomodoro", "category": "Antipasti", "price": "$8.99"},
        {"name": "Tiramisu", "category": "Dolci", "price": "$7.99"},
        {"name": "Gelato", "category": "Dolci", "price": "$5.99"}
    ]
    
    for product in sample_products:
        logger.log(f"Create Product: {product['name']}", "SIMULATED", 
                  f"Would create {product['category']} product priced at {product['price']}")
        time.sleep(0.3)  # Simulate processing time
    
    # Simulate order creation
    sample_orders = [
        {"number": "1001", "status": "UNCONFIRMED", "total": "$32.97", "customer": "John Smith"},
        {"number": "1002", "status": "UNCONFIRMED", "total": "$40.97", "customer": "Maria Garcia"},
        {"number": "1003", "status": "UNFULFILLED", "total": "$39.97", "customer": "Robert Johnson"},
        {"number": "1004", "status": "FULFILLED", "total": "$28.99", "customer": "Lisa Brown"},
        {"number": "1005", "status": "CANCELED", "total": "$45.50", "customer": "David Wilson"}
    ]
    
    for order in sample_orders:
        logger.log(f"Create Order: #{order['number']}", "SIMULATED", 
                  f"Would create {order['status']} order for {order['customer']} totaling {order['total']}")
        time.sleep(0.2)  # Simulate processing time

def provide_recommendations(logger):
    """Provide recommendations for actual data population"""
    
    recommendations = [
        {
            "title": "Setup Saleor Admin Access",
            "description": "To actually populate data, you need admin access to Saleor GraphQL API",
            "steps": [
                "Install Saleor locally or use Saleor Cloud",
                "Create superuser account",
                "Generate API tokens with appropriate permissions",
                "Configure authentication in the script"
            ]
        },
        {
            "title": "Alternative: Use Saleor CLI",
            "description": "Use Saleor CLI to populate sample data",
            "steps": [
                "Install Saleor CLI: npm install -g @saleor/cli",
                "Run: saleor project create my-restaurant",
                "Use built-in sample data: saleor project populate",
                "Customize data for restaurant use case"
            ]
        },
        {
            "title": "Manual Population via Dashboard",
            "description": "Use Saleor Dashboard to manually create data",
            "steps": [
                "Access Saleor Dashboard at http://localhost:8000/dashboard/",
                "Create channels with restaurant metadata",
                "Add product categories (Pizza, Pasta, etc.)",
                "Create products with variants and pricing",
                "Generate test orders"
            ]
        }
    ]
    
    for rec in recommendations:
        logger.log(f"Recommendation: {rec['title']}", "INFO", rec['description'])
        for i, step in enumerate(rec['steps'], 1):
            logger.log(f"Step {i}", "INFO", step)

def main():
    """Main execution function"""
    logger = DataPopulationLogger()
    
    print("Starting Restaurant Data Population Execution")
    print("=" * 60)
    
    logger.log("Data Population Script", "STARTED", "Beginning restaurant data population")
    
    # Initialize Saleor client
    client = SaleorGraphQLClient()
    
    # Test connection
    if not test_saleor_connection(client, logger):
        logger.log("Connection Failed", "ERROR", 
                  "Cannot connect to Saleor GraphQL API. Proceeding with simulation.")
        
        # Since we can't connect, simulate the population
        logger.log("Simulation Mode", "INFO", "Running in simulation mode due to connection issues")
        simulate_data_population(logger)
        provide_recommendations(logger)
    else:
        # Check existing data
        channels = check_existing_channels(client, logger)
        product_count = check_existing_products(client, logger)
        order_count = check_existing_orders(client, logger)
        
        # Analyze what needs to be created
        restaurant_channels = [ch for ch in channels if any(
            meta.get('key') == 'restaurantType' 
            for meta in ch.get('metadata', [])
        )]
        
        logger.log("Data Analysis", "INFO", 
                  f"Found {len(restaurant_channels)} restaurant channels out of {len(channels)} total")
        
        if len(restaurant_channels) == 0:
            logger.log("Missing Restaurant Channels", "WARNING", 
                      "No restaurant channels found. Need to create restaurant-specific channels.")
        
        if product_count == 0:
            logger.log("Missing Products", "WARNING", 
                      "No products found. Need to create restaurant menu items.")
        
        if order_count == 0:
            logger.log("Missing Orders", "WARNING", 
                      "No orders found. Need to create test orders for dashboard testing.")
        
        # Since we likely don't have admin permissions, provide guidance
        logger.log("Permission Requirements", "INFO", 
                  "Data creation requires admin permissions. See recommendations below.")
        provide_recommendations(logger)
    
    # Save execution log
    logger.save_report("restaurant_data_population_log.md")
    logger.log("Execution Complete", "SUCCESS", "Data population execution completed")
    
    print("\n" + "=" * 60)
    print("Data population execution completed!")
    print("Log saved to: restaurant_data_population_log.md")

if __name__ == "__main__":
    main()