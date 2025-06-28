import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";

import {
  AssignDeliveryDriverDocument,
  OrderFulfilledSubscriptionDocument,
  OrderFulfilledWebhookPayloadFragment,
  UpdateDeliveryStatusDocument,
} from "@/generated/graphql";
import { createClient } from "@/lib/create-graphq-client";
import { saleorApp } from "@/saleor-app";

/**
 * Delivery Driver Assignment Webhook
 * 
 * This webhook is triggered when an order is marked as fulfilled (ready for delivery)
 * and handles driver assignment and delivery tracking setup. Uses proven authentication
 * patterns from F&B_API_TEST_LOG.md.
 */
export const deliveryAssignedWebhook = new SaleorAsyncWebhook<OrderFulfilledWebhookPayloadFragment>({
  name: "Delivery Driver Assignment",
  webhookPath: "api/webhooks/delivery-assigned",
  event: "ORDER_FULFILLED",
  apl: saleorApp.apl,
  query: OrderFulfilledSubscriptionDocument,
});

/**
 * Delivery assignment handler
 * Assigns drivers and sets up real-time delivery tracking
 */
export default deliveryAssignedWebhook.createHandler(async (req, res, ctx) => {
  const { payload, authData } = ctx;
  
  if (!payload.order) {
    console.log("No order data in webhook payload");
    return res.status(200).end();
  }

  const order = payload.order;
  const restaurantChannel = order.channel?.slug;
  const shippingAddress = order.shippingAddress;

  // Skip if this is a pickup order (no delivery needed)
  if (!shippingAddress || order.shippingMethodName?.toLowerCase().includes('pickup')) {
    console.log(`📦 Order ${order.number} is for pickup - no delivery assignment needed`);
    return res.status(200).json({
      success: true,
      orderId: order.id,
      type: "pickup",
      message: "No delivery assignment needed for pickup orders"
    });
  }

  console.log(`🚗 Delivery assignment needed for restaurant: ${restaurantChannel}`);
  console.log(`📝 Order ID: ${order.id} (${order.number})`);
  console.log(`📍 Delivery to: ${shippingAddress.city}, ${shippingAddress.postalCode}`);
  console.log(`💰 Order Value: ${order.total?.gross?.amount} ${order.total?.gross?.currency}`);

  try {
    // Create GraphQL client with authentication
    const client = createClient(authData.saleorApiUrl, async () => ({ 
      token: authData.token 
    }));

    // Find available driver for delivery
    const assignedDriver = await findAvailableDriver(order, restaurantChannel);
    
    if (!assignedDriver) {
      console.log(`⚠️ No available drivers for order ${order.number}`);
      
      // Notify restaurant staff about driver shortage
      await notifyDriverShortage(order, restaurantChannel);
      
      return res.status(200).json({
        success: false,
        orderId: order.id,
        issue: "no_drivers_available",
        message: "No drivers available - restaurant notified"
      });
    }

    // Assign driver using GraphQL mutation
    await client.mutation(AssignDeliveryDriverDocument, {
      orderId: order.id,
      driverName: assignedDriver.name,
      driverPhone: assignedDriver.phone,
      vehicleInfo: `${assignedDriver.vehicle.type} - ${assignedDriver.vehicle.plate}`,
    }).toPromise();

    // Set initial delivery status with driver info
    await client.mutation(UpdateDeliveryStatusDocument, {
      orderId: order.id,
      status: "driver_assigned",
      location: assignedDriver.currentLocation,
      estimatedArrival: assignedDriver.estimatedArrival,
    }).toPromise();

    // Calculate delivery route and ETA
    const deliveryRoute = await calculateDeliveryRoute(
      assignedDriver.currentLocation,
      `${shippingAddress.streetAddress1}, ${shippingAddress.city}, ${shippingAddress.postalCode}`
    );

    // Notify all parties about driver assignment
    await notifyDriverAssignment(order, assignedDriver, deliveryRoute);

    console.log(`✅ Driver assigned successfully:`);
    console.log(`   - Driver: ${assignedDriver.name} (${assignedDriver.phone})`);
    console.log(`   - Vehicle: ${assignedDriver.vehicle.type} - ${assignedDriver.vehicle.plate}`);
    console.log(`   - ETA: ${assignedDriver.estimatedArrival}`);
    console.log(`   - Distance: ${deliveryRoute.distance} km`);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      driver: {
        name: assignedDriver.name,
        phone: assignedDriver.phone,
        vehicle: assignedDriver.vehicle,
        eta: assignedDriver.estimatedArrival,
      },
      delivery: {
        distance: deliveryRoute.distance,
        estimatedTime: deliveryRoute.duration,
        route: deliveryRoute.waypoints,
      },
    });

  } catch (error) {
    console.error("❌ Error assigning delivery driver:", error);
    
    return res.status(200).json({
      success: false,
      error: "Driver assignment failed",
      orderId: order.id,
      restaurantChannel: restaurantChannel,
    });
  }
});

/**
 * Find an available driver for delivery
 * In production, this would integrate with driver management systems
 */
async function findAvailableDriver(order: any, restaurantChannel: string) {
  // Simulate driver selection logic
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const mockDrivers = [
    {
      id: "driver_001",
      name: "Alex Rodriguez", 
      phone: "+1-555-0101",
      currentLocation: "123 Main St, Downtown",
      vehicle: {
        type: "Motorcycle",
        plate: "DLV-001",
        color: "Red"
      },
      rating: 4.9,
      deliveriesCompleted: 1247,
      estimatedArrival: new Date(Date.now() + 25 * 60000).toISOString(), // 25 min
      isAvailable: true,
    },
    {
      id: "driver_002", 
      name: "Sarah Chen",
      phone: "+1-555-0102",
      currentLocation: "456 Oak Ave, Midtown",
      vehicle: {
        type: "Electric Bike",
        plate: "ELV-002", 
        color: "Blue"
      },
      rating: 4.8,
      deliveriesCompleted: 892,
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min
      isAvailable: true,
    },
    {
      id: "driver_003",
      name: "Mike Johnson",
      phone: "+1-555-0103", 
      currentLocation: "789 Pine St, Uptown",
      vehicle: {
        type: "Car",
        plate: "CAR-003",
        color: "White"
      },
      rating: 4.7,
      deliveriesCompleted: 2156,
      estimatedArrival: new Date(Date.now() + 35 * 60000).toISOString(), // 35 min
      isAvailable: false, // Currently on delivery
    }
  ];

  // Find closest available driver
  const availableDrivers = mockDrivers.filter(driver => driver.isAvailable);
  
  if (availableDrivers.length === 0) {
    return null;
  }

  // In production, this would consider:
  // - Driver proximity to restaurant
  // - Driver rating and performance
  // - Vehicle type suitability for order size
  // - Traffic conditions and optimal routing
  // - Driver preferences and schedule
  
  return availableDrivers[0]; // Return best available driver
}

/**
 * Calculate delivery route and timing
 */
async function calculateDeliveryRoute(driverLocation: string, deliveryAddress: string) {
  // Simulate route calculation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, integrate with:
  // - Google Maps API
  // - OpenStreetMap
  // - Local routing services
  
  return {
    distance: 3.2, // km
    duration: 18, // minutes
    waypoints: [
      { lat: 40.7589, lng: -73.9851, name: "Driver Current Location" },
      { lat: 40.7505, lng: -73.9934, name: "Restaurant Pickup" },
      { lat: 40.7282, lng: -73.7949, name: "Customer Delivery" },
    ],
    traffic: "moderate",
    estimatedFuel: 0.8, // liters or units
  };
}

/**
 * Notify all parties about driver assignment
 */
async function notifyDriverAssignment(order: any, driver: any, route: any) {
  // Notify customer about driver assignment
  console.log(`📱 Notifying customer about driver assignment:`);
  console.log(`   Customer: ${order.userEmail}`);
  console.log(`   Driver: ${driver.name} in ${driver.vehicle.type}`);
  console.log(`   ETA: ${new Date(driver.estimatedArrival).toLocaleTimeString()}`);
  
  // Notify restaurant about pickup
  console.log(`🏪 Notifying restaurant about driver pickup:`);
  console.log(`   Restaurant: ${order.channel?.slug}`);
  console.log(`   Driver: ${driver.name} (${driver.phone})`);
  console.log(`   Pickup ETA: ${new Date(Date.now() + 10 * 60000).toLocaleTimeString()}`);
  
  // Notify driver about new delivery
  console.log(`👨‍💼 Notifying driver about new delivery:`);
  console.log(`   Driver: ${driver.name}`);
  console.log(`   Order: ${order.number}`);
  console.log(`   Distance: ${route.distance} km`);
  console.log(`   Estimated completion: ${new Date(driver.estimatedArrival).toLocaleTimeString()}`);
  
  // In production, send real notifications via:
  // - SMS/Push to customer with tracking link
  // - Restaurant dashboard/POS update
  // - Driver mobile app notification
  // - Email confirmations to all parties
  
  return {
    customerNotified: true,
    restaurantNotified: true,
    driverNotified: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle driver shortage notifications
 */
async function notifyDriverShortage(order: any, restaurantChannel: string) {
  console.log(`⚠️ Driver shortage notification:`);
  console.log(`   Restaurant: ${restaurantChannel}`);
  console.log(`   Order: ${order.number}`);
  console.log(`   Customer: ${order.userEmail}`);
  
  // In production:
  // - Alert restaurant manager
  // - Notify dispatch team
  // - Send customer delay notification
  // - Log incident for capacity planning
  
  return {
    restaurantAlerted: true,
    dispatchNotified: true,
    customerInformed: true,
    incidentLogged: true,
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