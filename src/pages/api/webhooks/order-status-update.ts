import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";

import {
  OrderUpdatedSubscriptionDocument,
  OrderUpdatedWebhookPayloadFragment,
  UpdateDeliveryStatusDocument,
} from "@/generated/graphql";
import { createClient } from "@/lib/create-graphq-client";
import { saleorApp } from "@/saleor-app";

/**
 * Order Status Update Webhook
 * 
 * This webhook handles order status changes and provides real-time updates
 * to customers and restaurant staff. Uses proven authentication patterns
 * from F&B_API_TEST_LOG.md.
 */
export const orderStatusUpdateWebhook = new SaleorAsyncWebhook<OrderUpdatedWebhookPayloadFragment>({
  name: "Order Status Update",
  webhookPath: "api/webhooks/order-status-update",
  event: "ORDER_UPDATED",
  apl: saleorApp.apl,
  query: OrderUpdatedSubscriptionDocument,
});

/**
 * Order status update handler
 * Provides real-time tracking updates for F&B orders
 */
export default orderStatusUpdateWebhook.createHandler(async (req, res, ctx) => {
  const { payload, authData } = ctx;
  
  if (!payload.order) {
    console.log("No order data in webhook payload");
    return res.status(200).end();
  }

  const order = payload.order;
  const restaurantChannel = order.channel?.slug;
  const previousStatus = req.headers['x-previous-status'] as string; // If available

  console.log(`📊 Order status update for restaurant: ${restaurantChannel}`);
  console.log(`📝 Order ID: ${order.id} (${order.number})`);
  console.log(`🔄 Status: ${previousStatus || 'unknown'} → ${order.status}`);
  console.log(`👤 Customer: ${order.userEmail || order.billingAddress?.firstName}`);

  try {
    // Create GraphQL client with authentication
    const client = createClient(authData.saleorApiUrl, async () => ({ 
      token: authData.token 
    }));

    // Determine the F&B-specific status and actions needed
    const fbStatus = mapSaleorStatusToFBStatus(order.status);
    const notifications = await determineNotifications(order, fbStatus);

    // Update delivery tracking metadata if needed
    if (fbStatus.requiresLocationUpdate) {
      await client.mutation(UpdateDeliveryStatusDocument, {
        orderId: order.id,
        status: fbStatus.deliveryStatus,
        location: fbStatus.estimatedLocation || "Restaurant",
        estimatedArrival: fbStatus.estimatedArrival || new Date(Date.now() + 30 * 60000).toISOString(),
      }).toPromise();
    }

    // Send notifications based on status change
    await sendStatusNotifications(order, fbStatus, notifications);

    // Log the status update
    console.log(`✅ Status update processed:`);
    console.log(`   - F&B Status: ${fbStatus.displayName}`);
    console.log(`   - Customer Notified: ${notifications.customer.enabled}`);
    console.log(`   - Restaurant Notified: ${notifications.restaurant.enabled}`);
    console.log(`   - ETA: ${fbStatus.estimatedArrival || 'Not set'}`);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      saleorStatus: order.status,
      fbStatus: fbStatus.displayName,
      notifications: {
        customer: notifications.customer.enabled,
        restaurant: notifications.restaurant.enabled,
      },
      estimatedArrival: fbStatus.estimatedArrival,
    });

  } catch (error) {
    console.error("❌ Error processing order status update:", error);
    
    return res.status(200).json({
      success: false,
      error: "Status update processing failed",
      orderId: order.id,
      status: order.status,
    });
  }
});

/**
 * Map Saleor order status to F&B-specific status
 */
function mapSaleorStatusToFBStatus(saleorStatus: string) {
  const statusMap: Record<string, any> = {
    DRAFT: {
      displayName: "Order Being Prepared",
      deliveryStatus: "preparing",
      requiresLocationUpdate: false,
      estimatedArrival: null,
    },
    UNCONFIRMED: {
      displayName: "Order Received - Awaiting Confirmation", 
      deliveryStatus: "pending",
      requiresLocationUpdate: false,
      estimatedArrival: null,
    },
    UNFULFILLED: {
      displayName: "Order Confirmed - In Kitchen",
      deliveryStatus: "preparing", 
      requiresLocationUpdate: false,
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min
    },
    PARTIALLY_FULFILLED: {
      displayName: "Order Ready - Preparing for Delivery",
      deliveryStatus: "ready_for_pickup",
      requiresLocationUpdate: true,
      estimatedLocation: "Restaurant - Ready for Pickup",
      estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min
    },
    FULFILLED: {
      displayName: "Order Delivered",
      deliveryStatus: "delivered",
      requiresLocationUpdate: true,
      estimatedLocation: "Delivered to Customer",
      estimatedArrival: new Date().toISOString(), // Now
    },
    CANCELED: {
      displayName: "Order Cancelled",
      deliveryStatus: "cancelled",
      requiresLocationUpdate: false,
      estimatedArrival: null,
    },
    RETURNED: {
      displayName: "Order Returned",
      deliveryStatus: "returned",
      requiresLocationUpdate: false,
      estimatedArrival: null,
    },
  };

  return statusMap[saleorStatus] || {
    displayName: `Order Status: ${saleorStatus}`,
    deliveryStatus: "unknown",
    requiresLocationUpdate: false,
    estimatedArrival: null,
  };
}

/**
 * Determine what notifications should be sent
 */
async function determineNotifications(order: any, fbStatus: any) {
  const notifications = {
    customer: {
      enabled: false,
      method: "email", // email, sms, push
      message: "",
    },
    restaurant: {
      enabled: false,
      method: "dashboard", // dashboard, pos, printer
      message: "",
    },
  };

  // Customer notifications
  switch (fbStatus.deliveryStatus) {
    case "preparing":
      notifications.customer = {
        enabled: true,
        method: "email",
        message: `Your order #${order.number} is being prepared in the kitchen. Estimated ready time: ${fbStatus.estimatedArrival ? new Date(fbStatus.estimatedArrival).toLocaleTimeString() : '30 minutes'}`
      };
      break;
    
    case "ready_for_pickup":
      notifications.customer = {
        enabled: true,
        method: "sms", // More urgent for pickup
        message: `Your order #${order.number} is ready! Your driver will be there soon. Track your delivery in real-time.`
      };
      break;
      
    case "delivered":
      notifications.customer = {
        enabled: true,
        method: "email",
        message: `Your order #${order.number} has been delivered! Enjoy your meal and thank you for choosing us.`
      };
      break;
      
    case "cancelled":
      notifications.customer = {
        enabled: true,
        method: "email",
        message: `Your order #${order.number} has been cancelled. If you have any questions, please contact us.`
      };
      break;
  }

  // Restaurant notifications
  switch (fbStatus.deliveryStatus) {
    case "ready_for_pickup":
      notifications.restaurant = {
        enabled: true,
        method: "dashboard",
        message: `Order #${order.number} ready for pickup. Driver should be assigned.`
      };
      break;
      
    case "delivered":
      notifications.restaurant = {
        enabled: true,
        method: "dashboard", 
        message: `Order #${order.number} successfully delivered. Customer satisfaction survey sent.`
      };
      break;
  }

  return notifications;
}

/**
 * Send status notifications to customers and restaurants
 */
async function sendStatusNotifications(order: any, fbStatus: any, notifications: any) {
  const results = {
    customer: false,
    restaurant: false,
  };

  // Send customer notification
  if (notifications.customer.enabled) {
    console.log(`📧 Sending customer notification via ${notifications.customer.method}:`);
    console.log(`   To: ${order.userEmail || order.billingAddress?.firstName}`);
    console.log(`   Message: ${notifications.customer.message}`);
    
    // In production, integrate with:
    // - Email service (SendGrid, AWS SES)
    // - SMS service (Twilio, AWS SNS)  
    // - Push notifications (Firebase, OneSignal)
    
    results.customer = true;
  }

  // Send restaurant notification
  if (notifications.restaurant.enabled) {
    console.log(`🏪 Sending restaurant notification via ${notifications.restaurant.method}:`);
    console.log(`   To: ${order.channel?.slug} restaurant staff`);
    console.log(`   Message: ${notifications.restaurant.message}`);
    
    // In production, integrate with:
    // - Restaurant dashboard updates
    // - POS system notifications
    // - Kitchen printer alerts
    // - Staff mobile app notifications
    
    results.restaurant = true;
  }

  return results;
}

/**
 * Disable body parser for webhook signature verification
 */
export const config = {
  api: {
    bodyParser: false,
  },
};