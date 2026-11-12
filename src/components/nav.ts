import { NavItem } from './dash';

export const TALENT_NAV: NavItem[] = [
  { href: '/talent', label: 'Clients', icon: 'briefcase-outline' },
  { href: '/talent/profile', label: 'Profile', icon: 'person-circle-outline' },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'grid-outline' },
  { href: '/admin/talent', label: 'Talent', icon: 'people-outline' },
  { href: '/admin/leads', label: 'Leads', icon: 'mail-unread-outline' },
  { href: '/admin/invoices', label: 'Invoices', icon: 'receipt-outline' },
  { href: '/admin/contracts', label: 'Contracts', icon: 'document-text-outline' },
];
