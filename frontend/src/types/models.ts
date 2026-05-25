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

export interface ScheduledTask {
  id: string;
  name: string;
  handler: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditGrantSummary {
  credits: number;
  grantedByEmail: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  smsCredits: number;
  lastGrant: CreditGrantSummary | null;
}

export interface NotificationResult {
  sent: boolean;
  reason?: string;
}

export interface GrantCreditsResult {
  userId: string;
  creditsGranted: number;
  totalCredits: number;
  grantedBy: { id: string; email: string };
  notifications: {
    email: NotificationResult;
    sms: NotificationResult;
  };
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
