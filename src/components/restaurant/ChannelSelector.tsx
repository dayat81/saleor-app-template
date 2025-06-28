import React from 'react';

interface Channel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  metadata?: Array<{ key: string; value: string }>;
}

interface ChannelSelectorProps {
  channels: Channel[];
  currentChannelId?: string;
  onChannelChange: (channelId: string) => void;
  className?: string;
}

export function ChannelSelector({ 
  channels, 
  currentChannelId, 
  onChannelChange, 
  className = '' 
}: ChannelSelectorProps) {
  // Filter channels to show only restaurant channels (with F&B metadata)
  const restaurantChannels = channels?.filter(channel => 
    channel.metadata?.some(meta => meta.key === 'restaurantType') || 
    channel.slug !== 'default-channel'  // Include all non-default channels for now
  ) || [];

  if (!restaurantChannels || restaurantChannels.length === 0) {
    return (
      <div className={`channel-selector ${className}`}>
        <span className="no-restaurants">No restaurants available</span>
      </div>
    );
  }

  // If only one restaurant, show it as read-only
  if (restaurantChannels.length === 1) {
    const restaurant = restaurantChannels[0];
    return (
      <div className={`channel-selector single-restaurant ${className}`}>
        <span className="restaurant-name">🍽️ {restaurant.name}</span>
        <span className="restaurant-status">
          {restaurant.isActive ? '🟢' : '🔴'}
        </span>
      </div>
    );
  }

  return (
    <div className={`channel-selector ${className}`}>
      <label htmlFor="channel-select" className="channel-label">
        🍽️ Restaurant:
      </label>
      <select 
        id="channel-select"
        value={currentChannelId} 
        onChange={(e) => onChannelChange(e.target.value)}
        className="channel-select"
      >
        {restaurantChannels.map(channel => {
          // Extract restaurant info from metadata
          const metadata = new Map(channel.metadata?.map(m => [m.key, m.value]) || []);
          const cuisineType = metadata.get('cuisineType');
          const displayName = cuisineType 
            ? `${channel.name} (${cuisineType})`
            : channel.name;

          return (
            <option key={channel.id} value={channel.id}>
              {displayName} {channel.isActive ? '🟢' : '🔴'}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// Extended ChannelSelector with additional restaurant info
interface ExtendedChannelSelectorProps extends ChannelSelectorProps {
  showDetails?: boolean;
}

export function ExtendedChannelSelector({ 
  channels, 
  currentChannelId, 
  onChannelChange,
  showDetails = false,
  className = '' 
}: ExtendedChannelSelectorProps) {
  const restaurantChannels = channels?.filter(channel => 
    channel.metadata?.some(meta => meta.key === 'restaurantType') || 
    channel.slug !== 'default-channel'
  ) || [];

  const currentChannel = restaurantChannels.find(channel => channel.id === currentChannelId);

  return (
    <div className={`extended-channel-selector ${className}`}>
      <ChannelSelector 
        channels={channels}
        currentChannelId={currentChannelId}
        onChannelChange={onChannelChange}
      />
      
      {showDetails && currentChannel && (
        <div className="channel-details">
          <RestaurantDetails channel={currentChannel} />
        </div>
      )}
    </div>
  );
}

// Restaurant Details Component
interface RestaurantDetailsProps {
  channel: Channel;
}

function RestaurantDetails({ channel }: RestaurantDetailsProps) {
  // Extract restaurant info from metadata
  const metadata = new Map(channel.metadata?.map(m => [m.key, m.value]) || []);
  const restaurantInfo = {
    restaurantType: metadata.get('restaurantType') || 'Restaurant',
    cuisineType: metadata.get('cuisineType') || 'Multi-cuisine',
    address: metadata.get('address'),
    phone: metadata.get('phone'),
    operatingHours: metadata.get('operatingHours'),
  };

  return (
    <div className="restaurant-details">
      <div className="detail-row">
        <span className="detail-label">Type:</span>
        <span className="detail-value">{restaurantInfo.restaurantType}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Cuisine:</span>
        <span className="detail-value">{restaurantInfo.cuisineType}</span>
      </div>
      {restaurantInfo.address && (
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span className="detail-value">{restaurantInfo.address}</span>
        </div>
      )}
      {restaurantInfo.phone && (
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{restaurantInfo.phone}</span>
        </div>
      )}
      {restaurantInfo.operatingHours && (
        <div className="detail-row">
          <span className="detail-label">Hours:</span>
          <span className="detail-value">{restaurantInfo.operatingHours}</span>
        </div>
      )}
    </div>
  );
}

export { RestaurantDetails };