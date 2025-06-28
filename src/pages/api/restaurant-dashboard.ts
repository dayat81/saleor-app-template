import { NextApiRequest, NextApiResponse } from 'next';

import { RestaurantListsDocument, RestaurantOrderQueueDocument } from '@/generated/graphql';
import { createClient } from '@/lib/create-graphq-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channelId } = req.query;

  try {
    // Use proven authentication patterns from Phase 1
    const client = createClient(
      process.env.SALEOR_API_URL || 'https://store-4bpwsmd6.saleor.cloud/graphql/',
      async () => ({ 
        token: process.env.SALEOR_APP_TOKEN || '' 
      })
    );

    // Fetch restaurant/channel data
    const channelsResult = await client.query(RestaurantListsDocument, {}).toPromise();
    
    // If specific channel requested, get its orders
    let ordersData = null;
    if (channelId && typeof channelId === 'string') {
      const ordersResult = await client.query(RestaurantOrderQueueDocument, {
        channel: channelId,
        status: ['UNCONFIRMED', 'UNFULFILLED'],
        first: 20
      }).toPromise();
      ordersData = ordersResult.data;
    }

    // Transform data for dashboard consumption
    const dashboardData = {
      restaurants: channelsResult.data?.channels?.map(channel => ({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        isActive: channel.isActive,
        currencyCode: channel.currencyCode,
        defaultCountry: channel.defaultCountry,
        metadata: channel.metadata,
        // Extract F&B-specific data from metadata
        restaurantInfo: extractRestaurantInfo(channel.metadata || []),
        // Include warehouse information for location data
        warehouses: channel.warehouses?.map(warehouse => ({
          id: warehouse.id,
          name: warehouse.name,
          address: warehouse.address
        })) || [],
        // Include shipping methods for delivery options
        shippingMethods: channel.availableShippingMethodsPerCountry?.map(country => ({
          countryCode: country.countryCode,
          methods: country.shippingMethods?.map(method => ({
            id: method.id,
            name: method.name,
            description: method.description,
            price: method.price,
            minimumOrderPrice: method.minimumOrderPrice,
            maximumOrderPrice: method.maximumOrderPrice,
            metadata: method.metadata
          })) || []
        })) || []
      })) || [],
      
      // Include orders if specific channel requested
      orders: ordersData?.orders?.edges?.map(edge => ({
        id: edge.node.id,
        number: edge.node.number,
        status: edge.node.status,
        created: edge.node.created,
        updatedAt: edge.node.updatedAt,
        total: edge.node.total,
        customer: {
          email: edge.node.user?.email,
          firstName: edge.node.billingAddress?.firstName,
          lastName: edge.node.billingAddress?.lastName,
          phone: edge.node.billingAddress?.phone
        },
        shippingAddress: edge.node.shippingAddress,
        billingAddress: edge.node.billingAddress,
        lines: edge.node.lines?.map(line => ({
          id: line.id,
          productName: line.productName,
          variantName: line.variantName,
          quantity: line.quantity,
          totalPrice: line.totalPrice,
          unitPrice: line.unitPrice,
          thumbnail: line.thumbnail
        })) || [],
        customerNote: edge.node.customerNote,
        shippingMethod: edge.node.shippingMethod,
        paymentStatus: edge.node.paymentStatus,
        isPaid: edge.node.isPaid,
        events: edge.node.events || [],
        fulfillments: edge.node.fulfillments?.map(fulfillment => ({
          id: fulfillment.id,
          status: fulfillment.status,
          created: fulfillment.created,
          trackingNumber: fulfillment.trackingNumber
        })) || [],
        metadata: edge.node.metadata || []
      })) || null,
      
      timestamp: new Date().toISOString(),
      requestedChannel: channelId || null
    };

    // Add summary statistics if orders data is available
    if (ordersData?.orders?.edges) {
      const orders = ordersData.orders.edges.map(edge => edge.node);
      dashboardData.statistics = generateStatistics(orders);
    }

    return res.status(200).json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ 
      error: 'Failed to load dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

function extractRestaurantInfo(metadata: Array<{ key: string; value: string }>) {
  const metaMap = new Map(metadata?.map(m => [m.key, m.value]) || []);
  return {
    restaurantType: metaMap.get('restaurantType') || 'Restaurant',
    cuisineType: metaMap.get('cuisineType') || 'Multi-cuisine',
    address: metaMap.get('address') || null,
    phone: metaMap.get('phone') || null,
    operatingHours: metaMap.get('operatingHours') || null,
    description: metaMap.get('description') || null,
    rating: metaMap.get('rating') || null,
    deliveryTime: metaMap.get('deliveryTime') || null,
    minimumOrder: metaMap.get('minimumOrder') || null,
    // Additional F&B metadata
    acceptsOnlineOrders: metaMap.get('acceptsOnlineOrders') === 'true',
    hasDelivery: metaMap.get('hasDelivery') === 'true',
    hasPickup: metaMap.get('hasPickup') === 'true',
    hasDineIn: metaMap.get('hasDineIn') === 'true',
  };
}

function generateStatistics(orders: any[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => 
    sum + (order.total?.gross?.amount || 0), 0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Order status breakdown
  const statusCounts = orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Payment status breakdown
  const paidOrders = orders.filter(order => order.isPaid).length;
  const unpaidOrders = totalOrders - paidOrders;

  // Time-based analysis
  const now = new Date();
  const recentOrders = orders.filter(order => {
    const orderTime = new Date(order.created);
    const hoursSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceOrder <= 1; // Orders in last hour
  }).length;

  return {
    totalOrders,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    avgOrderValue: Number(avgOrderValue.toFixed(2)),
    statusBreakdown: statusCounts,
    paymentStatus: {
      paid: paidOrders,
      unpaid: unpaidOrders
    },
    recentActivity: {
      ordersLastHour: recentOrders
    },
    generatedAt: new Date().toISOString()
  };
}