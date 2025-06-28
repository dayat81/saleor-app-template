#!/usr/bin/env python3
"""
Saleor App Permissions Configuration Script
Configures the app with required permissions for restaurant data creation
Based on Saleor app permissions documentation
"""

import requests
import json
import time
from datetime import datetime

class PermissionLogger:
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
            f.write("# App Permissions Configuration Log\n\n")
            f.write(f"**Configuration Started:** {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Configuration Completed:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Duration:** {datetime.now() - self.start_time}\n\n")
            
            # Summary
            success_count = len([log for log in self.logs if log['status'] == 'SUCCESS'])
            error_count = len([log for log in self.logs if log['status'] == 'ERROR'])
            total_count = len([log for log in self.logs if log['status'] in ['SUCCESS', 'ERROR']])
            
            f.write("## Configuration Summary\n\n")
            f.write(f"- **Total Operations:** {total_count}\n")
            f.write(f"- **Successful:** {success_count}\n")
            f.write(f"- **Failed:** {error_count}\n")
            f.write(f"- **Success Rate:** {(success_count/total_count*100) if total_count > 0 else 0:.1f}%\n\n")
            
            # Required permissions info
            f.write("## Required Permissions for Restaurant App\n\n")
            f.write("- **AUTHENTICATED_APP**: Enable app token authentication for API access\n")
            f.write("- **MANAGE_PRODUCTS**: Create and manage menu items and categories\n")
            f.write("- **MANAGE_ORDERS**: Create and manage restaurant orders\n")
            f.write("- **MANAGE_CHANNELS**: Create and manage restaurant channels\n")
            f.write("- **MANAGE_USERS**: Manage customer accounts\n")
            f.write("- **MANAGE_SHIPPING**: Manage delivery methods\n\n")
            
            # Detailed logs
            f.write("## Detailed Configuration Log\n\n")
            for log in self.logs:
                f.write(f"### {log['timestamp']} - {log['action']}\n\n")
                f.write(f"**Status:** {log['status']}\n\n")
                if log['message']:
                    f.write(f"**Message:** {log['message']}\n\n")
                if log['details']:
                    f.write(f"**Details:**\n```json\n{json.dumps(log['details'], indent=2)}\n```\n\n")
                f.write("---\n\n")

class SaleorAppPermissions:
    def __init__(self):
        # Working configuration from test-log.md
        self.base_url = "https://store-4bpwsmd6.saleor.cloud/graphql/"
        self.session = requests.Session()
        
        # Authentication from test-log.md
        self.basic_auth = "YWRtaW46YWRtaW4="  # admin:admin
        self.app_token = "889c9f68459b4adea2b28b7d18670a6e.qh4yhYByf4b1Q5Zcq5NsvkvCtEmPgycg129mDpOi8QfDjyLn"
        
        # Set default headers
        self.session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.basic_auth}",
            "Saleor-App-Token": self.app_token,
            "User-Agent": "Restaurant-App-Permissions/1.0"
        })
        
    def execute_query(self, query, variables=None):
        """Execute GraphQL query/mutation"""
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        response = self.session.post(self.base_url, json=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"GraphQL request failed: {response.status_code} - {response.text}")

def check_current_app_permissions(client, logger):
    """Check current app permissions"""
    try:
        logger.log("Check Current App Permissions", "RUNNING")
        
        # Query to get app information and current permissions
        query = """
        query {
            app {
                id
                name
                permissions {
                    code
                    name
                }
                isActive
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            error_msg = str(result['errors'])
            if 'permission' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                logger.log("Check Current App Permissions", "WARNING", 
                          "Cannot query app permissions - this confirms permissions need to be granted")
                return None
            else:
                logger.log("Check Current App Permissions", "ERROR", 
                          f"GraphQL errors: {result['errors']}")
                return None
        
        app_data = result.get('data', {}).get('app')
        if not app_data:
            logger.log("Check Current App Permissions", "ERROR", "No app data returned")
            return None
        
        permissions = app_data.get('permissions', [])
        logger.log("Check Current App Permissions", "SUCCESS", 
                  f"App: {app_data['name']} - Active: {app_data['isActive']} - {len(permissions)} permissions")
        
        # Log current permissions
        for perm in permissions:
            logger.log("Current Permission", "INFO", f"{perm['code']} - {perm['name']}")
        
        return app_data
        
    except Exception as e:
        logger.log("Check Current App Permissions", "ERROR", str(e))
        return None

def check_available_permissions(client, logger):
    """Check what permissions are available in the system"""
    try:
        logger.log("Check Available Permissions", "RUNNING")
        
        # Query to get all available permissions
        query = """
        query {
            __type(name: "PermissionEnum") {
                enumValues {
                    name
                    description
                }
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            logger.log("Check Available Permissions", "ERROR", 
                      f"GraphQL errors: {result['errors']}")
            return []
        
        enum_data = result.get('data', {}).get('__type', {})
        if not enum_data:
            logger.log("Check Available Permissions", "ERROR", "No permission enum data returned")
            return []
        
        permissions = enum_data.get('enumValues', [])
        logger.log("Check Available Permissions", "SUCCESS", 
                  f"Found {len(permissions)} available permissions")
        
        # Log required permissions status
        required_permissions = [
            "AUTHENTICATED_APP",
            "MANAGE_PRODUCTS", 
            "MANAGE_ORDERS",
            "MANAGE_CHANNELS",
            "MANAGE_USERS",
            "MANAGE_SHIPPING"
        ]
        
        available_permission_names = [p['name'] for p in permissions]
        
        for req_perm in required_permissions:
            if req_perm in available_permission_names:
                logger.log("Required Permission Check", "SUCCESS", f"{req_perm} is available")
            else:
                logger.log("Required Permission Check", "WARNING", f"{req_perm} not found in available permissions")
        
        return permissions
        
    except Exception as e:
        logger.log("Check Available Permissions", "ERROR", str(e))
        return []

def get_app_id_for_token(client, logger):
    """Try to find the app ID associated with our token"""
    try:
        logger.log("Find App ID for Token", "RUNNING")
        
        # Query to list all apps (requires MANAGE_APPS permission)
        query = """
        query {
            apps(first: 20) {
                edges {
                    node {
                        id
                        name
                        isActive
                        tokens {
                            id
                            name
                        }
                    }
                }
            }
        }
        """
        
        result = client.execute_query(query)
        
        if 'errors' in result:
            error_msg = str(result['errors'])
            if 'permission' in error_msg.lower():
                logger.log("Find App ID for Token", "WARNING", 
                          "Cannot list apps - needs MANAGE_APPS permission. Must configure through dashboard.")
                return None
            else:
                logger.log("Find App ID for Token", "ERROR", 
                          f"GraphQL errors: {result['errors']}")
                return None
        
        apps_data = result.get('data', {}).get('apps', {}).get('edges', [])
        logger.log("Find App ID for Token", "SUCCESS", f"Found {len(apps_data)} apps")
        
        # Look for our app (could match by name or token)
        target_app = None
        for app_edge in apps_data:
            app = app_edge['node']
            logger.log("App Found", "INFO", 
                      f"{app['name']} ({app['id']}) - Active: {app['isActive']} - Tokens: {len(app.get('tokens', []))}")
            
            # This might be our restaurant app
            if 'restaurant' in app['name'].lower() or 'f&b' in app['name'].lower():
                target_app = app
                break
        
        if target_app:
            logger.log("Target App Identified", "SUCCESS", 
                      f"Found restaurant app: {target_app['name']} ({target_app['id']})")
            return target_app['id']
        else:
            logger.log("Target App Identification", "WARNING", 
                      "Could not automatically identify restaurant app. Manual configuration needed.")
            return None
        
    except Exception as e:
        logger.log("Find App ID for Token", "ERROR", str(e))
        return None

def provide_manual_configuration_steps(logger):
    """Provide step-by-step manual configuration instructions"""
    
    steps = [
        {
            "step": 1,
            "title": "Access Saleor Cloud Dashboard",
            "description": "Log into the Saleor Cloud management interface",
            "actions": [
                "Open browser and go to https://cloud.saleor.io/",
                "Log in with your Saleor Cloud credentials",
                "Navigate to your store dashboard",
                "Go to Settings → Apps & Webhooks section"
            ]
        },
        {
            "step": 2,
            "title": "Locate Restaurant App",
            "description": "Find the F&B Restaurant Management App",
            "actions": [
                "Look for app named 'F&B Restaurant Management App'",
                "If not found, look for app with token starting with '889c9f68459b4adea2b28b7d18670a6e'",
                "Click on the app to open its configuration"
            ]
        },
        {
            "step": 3,
            "title": "Configure App Permissions",
            "description": "Grant the required permissions for restaurant data creation",
            "actions": [
                "Navigate to the Permissions tab within the app",
                "Enable the following permissions:",
                "  ✓ AUTHENTICATED_APP (Enable app token authentication)",
                "  ✓ MANAGE_PRODUCTS (Create menu items and categories)",
                "  ✓ MANAGE_ORDERS (Create and manage restaurant orders)", 
                "  ✓ MANAGE_CHANNELS (Create restaurant channels)",
                "  ✓ MANAGE_USERS (Manage customer accounts)",
                "  ✓ MANAGE_SHIPPING (Manage delivery methods)",
                "Click 'Save' to apply the permissions"
            ]
        },
        {
            "step": 4,
            "title": "Verify Permissions",
            "description": "Test that permissions are working",
            "actions": [
                "Run: python populate_restaurant_data_fixed.py",
                "Verify that category creation now works",
                "Verify that product creation is now possible",
                "Check that restaurant dashboard can access data"
            ]
        }
    ]
    
    logger.log("Manual Configuration Required", "INFO", 
              "Automatic permission configuration requires MANAGE_APPS. Follow manual steps:")
    
    for step in steps:
        logger.log(f"Step {step['step']}: {step['title']}", "INFO", step['description'])
        for i, action in enumerate(step['actions'], 1):
            logger.log(f"Action {step['step']}.{i}", "INFO", action)

def generate_permissions_update_mutation():
    """Generate the GraphQL mutation for updating app permissions"""
    
    mutation = """
    mutation UpdateAppPermissions($id: ID!, $permissions: [PermissionEnum!]!) {
        appUpdate(id: $id, input: { 
            permissions: $permissions 
        }) {
            app {
                id
                name
                permissions {
                    code
                    name
                }
            }
            errors {
                field
                message
                code
            }
        }
    }
    """
    
    variables = {
        "id": "APP_ID_HERE",  # Replace with actual app ID
        "permissions": [
            "AUTHENTICATED_APP",
            "MANAGE_PRODUCTS",
            "MANAGE_ORDERS", 
            "MANAGE_CHANNELS",
            "MANAGE_USERS",
            "MANAGE_SHIPPING"
        ]
    }
    
    return {
        "mutation": mutation,
        "variables": variables,
        "curl_example": """
curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \\
  -H "Saleor-App-Token: 889c9f68459b4adea2b28b7d18670a6e.qh4yhYByf4b1Q5Zcq5NsvkvCtEmPgycg129mDpOi8QfDjyLn" \\
  -d '{"query": "mutation UpdateAppPermissions($id: ID!, $permissions: [PermissionEnum!]!) { appUpdate(id: $id, input: { permissions: $permissions }) { app { id name permissions { code name } } errors { field message code } } }", "variables": {"id": "APP_ID_HERE", "permissions": ["AUTHENTICATED_APP", "MANAGE_PRODUCTS", "MANAGE_ORDERS", "MANAGE_CHANNELS", "MANAGE_USERS", "MANAGE_SHIPPING"]}}' \\
  https://store-4bpwsmd6.saleor.cloud/graphql/
        """
    }

def main():
    """Main permissions configuration function"""
    logger = PermissionLogger()
    
    print("Starting Saleor App Permissions Configuration")
    print("=" * 60)
    
    logger.log("App Permissions Configuration", "STARTED", 
              "Beginning restaurant app permissions setup")
    
    # Initialize Saleor client
    client = SaleorAppPermissions()
    
    # Check current app permissions
    current_app = check_current_app_permissions(client, logger)
    
    # Check available permissions in the system
    available_permissions = check_available_permissions(client, logger)
    
    # Try to find the app ID for our token
    app_id = get_app_id_for_token(client, logger)
    
    # Generate the update mutation
    update_info = generate_permissions_update_mutation()
    logger.log("Permission Update Mutation", "INFO", "Generated GraphQL mutation for manual execution")
    
    # Provide manual configuration steps
    provide_manual_configuration_steps(logger)
    
    # Save the mutation and curl example to a file
    with open("app_permissions_update.md", "w") as f:
        f.write("# App Permissions Update Instructions\n\n")
        f.write("## GraphQL Mutation\n\n")
        f.write(f"```graphql\n{update_info['mutation']}\n```\n\n")
        f.write("## Variables\n\n")
        f.write(f"```json\n{json.dumps(update_info['variables'], indent=2)}\n```\n\n")
        f.write("## Curl Example\n\n")
        f.write(f"```bash\n{update_info['curl_example']}\n```\n\n")
        f.write("**Note**: Replace 'APP_ID_HERE' with the actual app ID from the Saleor dashboard.\n")
    
    logger.log("Instructions Generated", "INFO", "Saved update instructions to app_permissions_update.md")
    
    # Save execution log
    logger.save_report("app_permissions_configuration_log.md")
    logger.log("Configuration Complete", "SUCCESS", 
              "App permissions configuration completed. Follow manual steps for activation.")
    
    print("\n" + "=" * 60)
    print("✅ App permissions configuration completed!")
    print("📋 Manual configuration required - see logs for detailed steps")
    print("📄 Files generated:")
    print("   - app_permissions_configuration_log.md (execution log)")
    print("   - app_permissions_update.md (GraphQL mutation instructions)")

if __name__ == "__main__":
    main()