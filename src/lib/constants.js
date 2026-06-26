export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'condo', label: 'Condo' },
  { value: 'loft', label: 'Loft' },
];

export const AMENITIES = [
  'WiFi', 'Parking', 'AC', 'Heating', 'Washer', 'Dryer', 
  'Kitchen', 'Pool', 'Gym', 'Elevator', 'Balcony', 'Garden',
  'Security', 'CCTV', 'Furnished', 'Pet Friendly', 'Doorman',
  'Storage', 'Rooftop', 'Fireplace', 'Dishwasher', 'EV Charging'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Spain', 'Italy', 'Japan', 'Singapore', 'UAE', 'India',
  'Brazil', 'Mexico', 'Netherlands', 'Sweden', 'Switzerland', 'Portugal',
  'Thailand', 'South Korea', 'New Zealand', 'Ireland', 'South Africa',
];

export function formatCurrency(amount, currency = 'USD') {
  const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  return `${curr.symbol}${Number(amount).toLocaleString()}`;
}

export function getConversationId(userId1, userId2, propertyId) {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}_${propertyId}`;
}