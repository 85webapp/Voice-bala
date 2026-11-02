import { PolicySection } from '../types';

export const POLICIES_DATA: PolicySection[] = [
  {
    id: 'payment-policy',
    title: 'Payment & Billing Policy',
    summary: 'No payment processing is connected in this prototype.',
    content: []
  },
  {
    id: 'security-vault-policy',
    title: 'Data Security & Storage Vault Policy',
    summary: 'Account identity and saved form requests are stored in Supabase and are loaded only for the signed-in account.',
    content: []
  },
  {
    id: 'delivery-policy',
    title: 'Delivery & Express Fast-Track Policy',
    summary: 'Displayed prices and delivery timelines are estimates and should be confirmed before proceeding.',
    content: []
  },
  {
    id: 'legal-registration-policy',
    title: 'Government Registration & Statutory Compliance',
    summary: 'No government registration or legal compliance status is verified by this prototype.',
    content: []
  },
  {
    id: 'contact-policy',
    title: '24/7 Contact & Customer Support Policy',
    summary: 'No customer support channel is connected in this prototype.',
    content: []
  }
];
