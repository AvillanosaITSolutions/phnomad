export function daysUntil(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((expiry.getTime() - now.getTime()) / msPerDay);
}

export function visaStatus(daysLeft: number): 'Safe' | 'Upcoming' | 'Urgent' | 'Expired' {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 3) return 'Urgent';
  if (daysLeft <= 14) return 'Upcoming';
  return 'Safe';
}
