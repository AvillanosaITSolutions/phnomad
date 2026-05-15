export type TopUpPackage = {
  id: string;
  name: string;
  credits: number;
  pricePhp: number;
  highlight?: string;
};

export const topUpPackages: TopUpPackage[] = [
  {
    id: 'starter-100',
    name: 'Starter',
    credits: 100,
    pricePhp: 79,
    highlight: 'Light top-up for a single reminder cycle.',
  },
  {
    id: 'core-250',
    name: 'Core',
    credits: 250,
    pricePhp: 169,
    highlight: 'Good for a few months of active reminders.',
  },
  {
    id: 'plus-500',
    name: 'Plus',
    credits: 500,
    pricePhp: 319,
    highlight: 'Balanced package for regular sending.',
  },
  {
    id: 'growth-1000',
    name: 'Growth',
    credits: 1000,
    pricePhp: 549,
    highlight: 'Best value for most active accounts.',
  },
  {
    id: 'scale-2500',
    name: 'Scale',
    credits: 2500,
    pricePhp: 1199,
    highlight: 'Bulk pack for heavier reminder usage.',
  },
];
