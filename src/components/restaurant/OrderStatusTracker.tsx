import React from 'react';

interface OrderStatusTrackerProps {
  order: any;
  className?: string;
}

export function OrderStatusTracker({ order, className = '' }: OrderStatusTrackerProps) {
  // Extract status information from order metadata
  const metadata = new Map(order.metadata?.map((m: any) => [m.key, m.value]) || []);
  const currentStatus = metadata.get('status') || 'pending';
  
  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: '📋', time: order.created },
    { key: 'accepted', label: 'Accepted', icon: '✅', time: metadata.get('acceptedAt') },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', time: metadata.get('preparationStarted') },
    { key: 'ready', label: 'Ready', icon: '🍽️', time: metadata.get('readyForPickup') },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚗', time: metadata.get('driverAssigned') },
    { key: 'delivered', label: 'Delivered', icon: '✅', time: metadata.get('deliveredAt') }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={`order-status-tracker ${className}`}>
      <div className="status-header">
        <h4>Order Status: #{order.number}</h4>
        <span className={`status-badge status-${currentStatus}`}>
          {statusSteps[currentStepIndex]?.icon} {statusSteps[currentStepIndex]?.label}
        </span>
      </div>
      
      <div className="status-timeline">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div 
              key={step.key} 
              className={`timeline-step ${
                isCompleted ? 'completed' : 
                isCurrent ? 'current' : 
                'upcoming'
              }`}
            >
              <div className=\"step-indicator\">
                <span className=\"step-icon\">{step.icon}</span>
              </div>
              <div className=\"step-content\">
                <div className=\"step-label\">{step.label}</div>
                {step.time && (
                  <div className=\"step-time\">
                    {new Date(step.time).toLocaleString()}
                  </div>
                )}
                {step.key === 'preparing' && metadata.get('estimatedPreparationTime') && (
                  <div className=\"step-detail\">
                    Est. time: {metadata.get('estimatedPreparationTime')}
                  </div>
                )}
                {step.key === 'out_for_delivery' && metadata.get('driverName') && (
                  <div className=\"step-detail\">
                    Driver: {metadata.get('driverName')} ({metadata.get('driverPhone')})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional order details */}
      <div className=\"order-details-summary\">
        <div className=\"detail-row\">
          <span>Customer:</span>
          <span>{order.billingAddress?.firstName} {order.billingAddress?.lastName}</span>
        </div>
        <div className=\"detail-row\">
          <span>Total:</span>
          <span>${order.total?.gross?.amount}</span>
        </div>
        <div className=\"detail-row\">
          <span>Payment:</span>
          <span className={order.isPaid ? 'paid' : 'unpaid'}>
            {order.isPaid ? '✅ Paid' : '⏳ Pending'}
          </span>
        </div>
        {metadata.get('estimatedArrival') && (
          <div className=\"detail-row\">
            <span>ETA:</span>
            <span>{new Date(metadata.get('estimatedArrival')).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Order Card with Status Tracking
interface EnhancedOrderCardProps {
  order: any;
  onOrderUpdate: () => void;
  showOrderAcceptedNotification: (orderNumber: string, preparationTime: string) => void;
  showOrderRejectedNotification: (orderNumber: string, reason: string) => void;
  showFullStatus?: boolean;
}

export function EnhancedOrderCard({ 
  order, 
  onOrderUpdate,
  showOrderAcceptedNotification,
  showOrderRejectedNotification,
  showFullStatus = false
}: EnhancedOrderCardProps) {
  const metadata = new Map(order.metadata?.map((m: any) => [m.key, m.value]) || []);
  const currentStatus = metadata.get('status') || 'pending';

  // Calculate order urgency based on creation time
  const orderAge = (new Date().getTime() - new Date(order.created).getTime()) / (1000 * 60); // minutes
  const isUrgent = orderAge > 15; // Orders older than 15 minutes are urgent
  const isCritical = orderAge > 30; // Orders older than 30 minutes are critical

  return (
    <div className={`enhanced-order-card ${
      isCritical ? 'critical' : 
      isUrgent ? 'urgent' : 
      'normal'
    } status-${currentStatus}`}>
      
      {/* Order Header with Status */}
      <div className=\"order-header-enhanced\">
        <div className=\"order-title\">
          <h4>Order #{order.number}</h4>
          <span className=\"order-age\">
            {Math.floor(orderAge)}m ago
            {isCritical && ' ⚠️'}
            {isUrgent && !isCritical && ' ⏰'}
          </span>
        </div>
        <span className=\"order-total\">${order.total?.gross?.amount}</span>
      </div>

      {/* Customer Info */}
      <div className=\"customer-info\">
        <div className=\"customer-name\">
          👤 {order.billingAddress?.firstName} {order.billingAddress?.lastName}
        </div>
        {order.billingAddress?.phone && (
          <div className=\"customer-phone\">
            📞 {order.billingAddress.phone}
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className=\"order-items-enhanced\">
        {order.lines?.map((line: any) => (
          <div key={line.id} className=\"order-item-enhanced\">
            <span className=\"item-quantity\">{line.quantity}×</span>
            <div className=\"item-details\">
              <span className=\"item-name\">{line.productName}</span>
              {line.variantName && (
                <span className=\"item-variant\">({line.variantName})</span>
              )}
            </div>
            <span className=\"item-price\">${line.totalPrice?.gross?.amount}</span>
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      {order.customerNote && (
        <div className=\"special-instructions\">
          <strong>📝 Special Instructions:</strong>
          <p>{order.customerNote}</p>
        </div>
      )}

      {/* Delivery Address */}
      {order.shippingAddress && (
        <div className=\"delivery-address\">
          <strong>📍 Delivery Address:</strong>
          <p>
            {order.shippingAddress.streetAddress1}
            {order.shippingAddress.streetAddress2 && `, ${order.shippingAddress.streetAddress2}`}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.postalCode}
          </p>
        </div>
      )}

      {/* Status Tracker */}
      {showFullStatus && (
        <OrderStatusTracker order={order} />
      )}

      {/* Order Actions - only show for pending orders */}
      {currentStatus === 'pending' && (
        <div className=\"order-actions-enhanced\">
          <button 
            onClick={() => {/* Accept order logic */}} 
            className=\"accept-btn-enhanced\"
          >
            ✅ Accept Order
          </button>
          <button 
            onClick={() => {/* Reject order logic */}} 
            className=\"reject-btn-enhanced\"
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* Status Actions for accepted orders */}
      {currentStatus === 'accepted' && (
        <div className=\"status-actions\">
          <button className=\"status-btn preparing\">
            👨‍🍳 Start Preparing
          </button>
        </div>
      )}

      {currentStatus === 'preparing' && (
        <div className=\"status-actions\">
          <button className=\"status-btn ready\">
            🍽️ Mark Ready
          </button>
        </div>
      )}
    </div>
  );
}