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
