import { appParams } from '@/lib/app-params';

const isNode = typeof window === 'undefined';
const storage = isNode ? new Map() : window.localStorage;
const storageKey = (key) => `longstay_${key}`;

const readStorage = (key, defaultValue = null) => {
  const raw = isNode ? storage.get(storageKey(key)) : storage.getItem(storageKey(key));
  if (!raw) {
    return defaultValue;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

const writeStorage = (key, value) => {
  const raw = JSON.stringify(value);
  if (isNode) {
    storage.set(storageKey(key), raw);
  } else {
    window.localStorage.setItem(storageKey(key), raw);
  }
};

const removeStorage = (key) => {
  if (isNode) {
    storage.delete(storageKey(key));
  } else {
    window.localStorage.removeItem(storageKey(key));
  }
};

const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();

const defaultUsers = [
  {
    id: 'user_admin',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@longstay.local',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
    full_name: 'Admin User',
    role: 'admin',
  },
  {
    id: 'user_host',
    email: 'host@longstay.local',
    password: 'host123',
    full_name: 'Host User',
    role: 'host',
  },
  {
    id: 'user_guest',
    email: 'guest@longstay.local',
    password: 'guest123',
    full_name: 'Guest User',
    role: 'renter',
  },
];

const defaultProfiles = [
  {
    id: 'profile_admin',
    user_id: 'user_admin',
    full_name: 'Admin User',
    email: 'admin@longstay.local',
    role: 'admin',
    phone: '+1 555 000 1111',
    city: 'San Francisco',
    country: 'USA',
    photo: 'https://i.pravatar.cc/150?img=3',
    preferred_currency: 'USD',
  },
  {
    id: 'profile_host',
    user_id: 'user_host',
    full_name: 'Host User',
    email: 'host@longstay.local',
    role: 'host',
    phone: '+1 555 000 2222',
    city: 'Miami',
    country: 'USA',
    photo: 'https://i.pravatar.cc/150?img=5',
    preferred_currency: 'USD',
  },
  {
    id: 'profile_guest',
    user_id: 'user_guest',
    full_name: 'Guest User',
    email: 'guest@longstay.local',
    role: 'renter',
    phone: '+1 555 000 3333',
    city: 'New York',
    country: 'USA',
    photo: 'https://i.pravatar.cc/150?img=8',
    preferred_currency: 'USD',
  },
];

const defaultProperties = [
  {
    id: 'property_1',
    title: 'Sunny Downtown Loft',
    description: 'A bright loft in the heart of the city with modern finishes and easy transit access.',
    property_type: 'loft',
    category: 'residential',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    ],
    monthly_rent: 2400,
    yearly_rent: 2400 * 12,
    currency: 'USD',
    security_deposit: 2400,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 750,
    amenities: ['WiFi', 'AC', 'Washer', 'Dryer', 'Kitchen', 'Gym'],
    address: '123 Market Street',
    city: 'San Francisco',
    country: 'USA',
    zip_code: '94103',
    latitude: 37.7749,
    longitude: -122.4194,
    host_id: 'user_host',
    host_name: 'Host User',
    host_photo: 'https://i.pravatar.cc/150?img=5',
    status: 'active',
    min_lease_months: 3,
    max_lease_months: 24,
    available_from: '2026-07-01',
    is_furnished: true,
    pets_allowed: true,
    avg_rating: 4.8,
    review_count: 1,
    views: 274,
    created_date: nowIso(),
  },
];

const defaultReviews = [
  {
    id: 'review_1',
    property_id: 'property_1',
    user_id: 'user_guest',
    rating: 5,
    comment: 'Great stay with an amazing location and comfortable space.',
    created_date: nowIso(),
  },
];

const defaultBookings = [];
const defaultMessages = [];
const defaultSavedProperties = [];

const initStore = () => {
  if (readStorage('users') === null) writeStorage('users', defaultUsers);
  if (readStorage('profiles') === null) writeStorage('profiles', defaultProfiles);
  if (readStorage('properties') === null) writeStorage('properties', defaultProperties);
  if (readStorage('reviews') === null) writeStorage('reviews', defaultReviews);
  if (readStorage('bookings') === null) writeStorage('bookings', defaultBookings);
  if (readStorage('messages') === null) writeStorage('messages', defaultMessages);
  if (readStorage('saved_properties') === null) writeStorage('saved_properties', defaultSavedProperties);
  if (readStorage('reset_tokens') === null) writeStorage('reset_tokens', {});
};

initStore();

const getStore = (key, defaultValue) => {
  const value = readStorage(key, null);
  if (value === null) {
    writeStorage(key, defaultValue);
    return defaultValue;
  }
  return value;
};

const setStore = (key, value) => writeStorage(key, value);

const normalizeValue = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
};

const matchesCriteria = (item, criteria = {}) => {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined || value === null) {
      return true;
    }
    const itemValue = item[key];
    if (Array.isArray(value)) {
      return value.includes(itemValue);
    }
    if (typeof itemValue === 'string' && typeof value === 'string') {
      return itemValue.toLowerCase() === value.toLowerCase();
    }
    return itemValue === value;
  });
};

const sortItems = (items, sort) => {
  if (!sort) {
    return items;
  }
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return descending ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    }
    if (aValue > bValue) return descending ? -1 : 1;
    if (aValue < bValue) return descending ? 1 : -1;
    return 0;
  });
};

const entityDefinitions = {
  Property: { key: 'properties', prefix: 'property' },
  UserProfile: { key: 'profiles', prefix: 'profile' },
  Booking: { key: 'bookings', prefix: 'booking' },
  Message: { key: 'messages', prefix: 'message' },
  SavedProperty: { key: 'saved_properties', prefix: 'saved' },
  Review: { key: 'reviews', prefix: 'review' },
};

const createEntity = (entityName) => {
  const config = entityDefinitions[entityName];
  const storeKey = config.key;
  const prefix = config.prefix;

  const all = () => getStore(storeKey, []);
  const saveAll = (items) => setStore(storeKey, items);

  const filter = (criteria = {}, sort, limit) => {
    const items = all().filter(item => matchesCriteria(item, criteria));
    const sorted = sortItems(items, sort);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  };

  const list = (sort, limit) => filter({}, sort, limit);

  const get = (id) => {
    if (!id) return null;
    return all().find((item) => item.id === id) || null;
  };

  const create = (data) => {
    const item = {
      id: createId(prefix),
      created_date: nowIso(),
      ...data,
    };
    const items = all();
    items.unshift(item);
    saveAll(items);
    return item;
  };

  const update = (id, changes) => {
    const items = all();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`${entityName} not found`);
    }
    items[index] = { ...items[index], ...changes };
    saveAll(items);
    return items[index];
  };

  const remove = (id) => {
    const items = all();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    const [deleted] = items.splice(index, 1);
    saveAll(items);
    return deleted;
  };

  return {
    filter,
    list,
    get,
    create,
    update,
    delete: remove,
  };
};

const getToken = () => {
  if (appParams.token) {
    return appParams.token;
  }
  if (isNode) {
    return storage.get('token') || null;
  }
  return window.localStorage.getItem('token');
};

const setToken = (token) => {
  if (isNode) {
    storage.set('token', token);
  } else {
    window.localStorage.setItem('token', token);
  }
};

const clearToken = () => {
  if (isNode) {
    storage.delete('token');
  } else {
    window.localStorage.removeItem('token');
  }
};

const getCurrentUser = () => {
  const token = getToken();
  if (!token) {
    return null;
  }
  const parts = token.split(':');
  if (parts.length !== 2) {
    return null;
  }
  const userId = parts[1];
  const users = getStore('users', []);
  return users.find((user) => user.id === userId) || null;
};

const getResetTokens = () => getStore('reset_tokens', {});
const saveResetTokens = (tokens) => setStore('reset_tokens', tokens);

export const base44 = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      const users = getStore('users', []);
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }
      const token = `user:${user.id}`;
      setToken(token);
      return { access_token: token };
    },
    register: async ({ email, password }) => {
      const users = getStore('users', []);
      const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new Error('A user with that email already exists');
      }
      const user = {
        id: createId('user'),
        email,
        password,
        full_name: email.split('@')[0],
        role: 'renter',
      };
      users.push(user);
      setStore('users', users);
      return { success: true };
    },
    verifyOtp: async ({ email, otpCode }) => {
      const users = getStore('users', []);
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }
      if (otpCode.length < 4) {
        throw new Error('Invalid verification code');
      }
      const token = `user:${user.id}`;
      setToken(token);
      return { access_token: token };
    },
    resendOtp: async (email) => {
      const users = getStore('users', []);
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }
      return { success: true };
    },
    loginWithProvider: (provider, redirectUrl) => {
      const email = `${provider}@longstay.local`;
      const users = getStore('users', []);
      let user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = {
          id: createId('user'),
          email,
          password: '',
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          role: 'renter',
        };
        users.push(user);
        setStore('users', users);
      }
      const token = `user:${user.id}`;
      setToken(token);
      if (typeof window !== 'undefined' && redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    me: async () => {
      const user = getCurrentUser();
      if (!user) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }
      return user;
    },
    logout: (redirectUrl) => {
      clearToken();
      if (typeof window !== 'undefined') {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    },
    redirectToLogin: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    setToken: (token) => {
      setToken(token);
    },
    resetPasswordRequest: async (email) => {
      const users = getStore('users', []);
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }
      const token = createId('reset');
      const tokens = getResetTokens();
      tokens[token] = user.email;
      saveResetTokens(tokens);
      return { token };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      const tokens = getResetTokens();
      const email = tokens[resetToken];
      if (!email) {
        throw new Error('Invalid reset token');
      }
      const users = getStore('users', []);
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }
      user.password = newPassword;
      setStore('users', users);
      delete tokens[resetToken];
      saveResetTokens(tokens);
      return { success: true };
    },
  },
  entities: {
    Property: createEntity('Property'),
    UserProfile: createEntity('UserProfile'),
    Booking: createEntity('Booking'),
    Message: createEntity('Message'),
    SavedProperty: createEntity('SavedProperty'),
    Review: createEntity('Review'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (typeof window !== 'undefined' && file instanceof File) {
          return { file_url: URL.createObjectURL(file) };
        }
        return { file_url: 'https://via.placeholder.com/300' };
      },
      SendEmail: async ({ to, subject, body }) => {
        if (typeof console !== 'undefined') {
          console.log('Mock email sent:', { to, subject, body });
        }
        return { success: true };
      },
    },
  },
};

