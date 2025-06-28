import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";

import {
  AcceptRestaurantOrderDocument,
  OrderCreatedSubscriptionDocument,
  OrderCreatedWebhookPayloadFragment,
  RestaurantOrderQueueDocument,
} from "@/generated/graphql";
import { createClient } from "@/lib/create-graphq-client";
import { saleorApp } from "@/saleor-app";

/**
 * Restaurant Order Received Webhook
 * 
 * This webhook is triggered when a new order is created and needs to be
 * sent to the appropriate restaurant for preparation. It leverages the
 * successful authentication patterns from F&B_API_TEST_LOG.md.
 */
export const restaurantOrderReceivedWebhook = new SaleorAsyncWebhook<OrderCreatedWebhookPayloadFragment>({
  name: "Restaurant Order Received",
  webhookPath: "api/webhooks/restaurant-order-received",
  event: "ORDER_CREATED",
  apl: saleorApp.apl,
  query: OrderCreatedSubscriptionDocument,
});

/**
 * Restaurant notification handler
 * Sends new order notifications to restaurants using proven auth patterns
 */
export default restaurantOrderReceivedWebhook.createHandler(async (req, res, ctx) => {
  const { payload, authData } = ctx;
  
  if (!payload.order) {
    console.log("No order data in webhook payload");
    return res.status(200).end();
  }

  const order = payload.order;
  const restaurantChannelId = order.channel?.id;
  const restaurantChannelSlug = order.channel?.slug;

  console.log(`🍽️ New order received for restaurant: ${restaurantChannelSlug}`);
  console.log(`📝 Order ID: ${order.id}`);
  console.log(`💰 Order Total: ${order.total?.gross?.amount} ${order.total?.gross?.currency}`);
  console.log(`👤 Customer: ${order.userEmail || order.billingAddress?.firstName}`);

  try {
    // Create GraphQL client with proven authentication patterns
    const client = createClient(authData.saleorApiUrl, async () => ({ 
      token: authData.token 
    }));

    // Extract restaurant-specific order information
    const restaurantOrder = {
      orderId: order.id,
      orderNumber: order.number,
      customerName: order.billingAddress?.firstName + " " + order.billingAddress?.lastName,
      customerEmail: order.userEmail,
      customerPhone: order.billingAddress?.phone,
      items: order.lines?.map(line => ({
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        price: line.totalPrice?.gross?.amount,
        currency: line.totalPrice?.gross?.currency,
        thumbnail: line.thumbnail?.url,
      })) || [],
      totalAmount: order.total?.gross?.amount,
      currency: order.total?.gross?.currency,
      deliveryAddress: order.shippingAddress ? {
        street: order.shippingAddress.streetAddress1,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        phone: order.shippingAddress.phone,
      } : null,
      specialInstructions: order.customerNote,
      orderCreated: order.created,
      channelId: restaurantChannelId,
      channelSlug: restaurantChannelSlug,
    };

    // Store restaurant-specific metadata using proven patterns
    await client.mutation(AcceptRestaurantOrderDocument, {
      orderId: order.id,
      preparationTime: "30", // Default 30 minutes
    }).toPromise();

    // Log restaurant notification (in production, this would send real notifications)
    console.log(`✅ Restaurant ${restaurantChannelSlug} notified of new order:`);
    console.log(`   - Items: ${restaurantOrder.items.length}`);
    console.log(`   - Total: ${restaurantOrder.totalAmount} ${restaurantOrder.currency}`);
    console.log(`   - Delivery: ${restaurantOrder.deliveryAddress?.city || 'Pickup'}`);
    
    // Simulate restaurant notification system
    await notifyRestaurant(restaurantOrder);

    return res.status(200).json({
      success: true,
      restaurantNotified: restaurantChannelSlug,
      orderId: order.id,
      items: restaurantOrder.items.length,
      total: `${restaurantOrder.totalAmount} ${restaurantOrder.currency}`,
    });

  } catch (error) {
    console.error("❌ Error processing restaurant order:", error);
    
    // Log error but don't fail webhook (ensures Saleor doesn't retry)
    console.log(`⚠️ Restaurant notification failed for order ${order.id}:`, error);
    
    return res.status(200).json({
      success: false,
      error: "Restaurant notification failed",
      orderId: order.id,
      restaurantChannel: restaurantChannelSlug,
    });
  }
});

/**
 * Restaurant notification function
 * In production, this would integrate with restaurant POS systems,
 * kitchen display systems, or notification services
 */
async function notifyRestaurant(orderData: any) {
  // Simulate restaurant notification delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, this would:
  // 1. Send push notifications to restaurant staff
  // 2. Update kitchen display systems
  // 3. Send SMS/email alerts to restaurant managers
  // 4. Integrate with POS systems
  // 5. Update restaurant dashboard in real-time
  
  console.log(`📱 Restaurant notification sent:`, {
    restaurant: orderData.channelSlug,
    orderId: orderData.orderId,
    items: orderData.items.length,
    customer: orderData.customerName,
    timestamp: new Date().toISOString(),
  });
  
  return {
    notificationSent: true,
    timestamp: new Date().toISOString(),
    method: "kitchen_display_system", // In production: push, sms, email, pos
  };
}

/**
 * Disable body parser for webhook signature verification
 */
export const config = {
  api: {
    bodyParser: false,
  },
};