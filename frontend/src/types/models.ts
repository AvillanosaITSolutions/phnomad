export interface User {
  id: string;
  email: string;
  googleId: string;
  name: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface Visa {
  id: string;
  userId: string;
  nationality: string;
  country: string;
  visaType: string;
  entryDate: string;
  expiryDate: string;
  phoneNumber: string;
  email: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderIntervals: number[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: string;
  productId: string | null;
  entitlement: string | null;
  status: string;
  active: boolean;
  smsCredits: number;
  expiresAt: string | null;
}
