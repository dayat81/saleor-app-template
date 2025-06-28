# App Permissions Update Instructions

## GraphQL Mutation

```graphql

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
    
```

## Variables

```json
{
  "id": "APP_ID_HERE",
  "permissions": [
    "AUTHENTICATED_APP",
    "MANAGE_PRODUCTS",
    "MANAGE_ORDERS",
    "MANAGE_CHANNELS",
    "MANAGE_USERS",
    "MANAGE_SHIPPING"
  ]
}
```

## Curl Example

```bash

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Saleor-App-Token: 889c9f68459b4adea2b28b7d18670a6e.qh4yhYByf4b1Q5Zcq5NsvkvCtEmPgycg129mDpOi8QfDjyLn" \
  -d '{"query": "mutation UpdateAppPermissions($id: ID!, $permissions: [PermissionEnum!]!) { appUpdate(id: $id, input: { permissions: $permissions }) { app { id name permissions { code name } } errors { field message code } } }", "variables": {"id": "APP_ID_HERE", "permissions": ["AUTHENTICATED_APP", "MANAGE_PRODUCTS", "MANAGE_ORDERS", "MANAGE_CHANNELS", "MANAGE_USERS", "MANAGE_SHIPPING"]}}' \
  https://store-4bpwsmd6.saleor.cloud/graphql/
        
```

**Note**: Replace 'APP_ID_HERE' with the actual app ID from the Saleor dashboard.
