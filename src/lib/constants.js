export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateConversationId = (userId1, userId2, propertyId) => {
  return [userId1, userId2, propertyId].sort().join('_');
};

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'office', label: 'Office' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'condo', label: 'Condo' },
  { value: 'loft', label: 'Loft' },
];

export const AMENITIES = [
  'WiFi', 'AC', 'Washer', 'Dryer', 'Kitchen', 'Gym',
  'Pool', 'Parking', 'Balcony', 'Elevator', 'Security', 'Power Backup',
];
