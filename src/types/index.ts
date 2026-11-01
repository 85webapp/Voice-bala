export interface LegalDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  standardHours: number;
  basePrice: number;
  requiredFields: string[];
  stampDutyRecommended: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  items: string[];
}

export interface PolicySection {
  id: string;
  title: string;
  summary: string;
  content: {
    heading: string;
    points: string[];
    legalNote?: string;
  }[];
}

export interface OrderItem {
  orderId: string;
  docTitle: string;
  createdAt: string;
  date: string; // ISO date 'YYYY-MM-DD'
  deliveryHours: number;
  deliveryFee: number;
  baseFee: number;
  totalFee: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Cancelled';
  status: 'Completed' | 'Processing' | 'Delivered' | 'In Review' | 'Declined' | 'Pending Process';
  pendingHours: number;
  applicantName: string;
  applicantPhone: string;
  state: string;
  stampDenomination: string;
  isPhysicalCourier?: boolean;
  shippingAddress?: string;
  pincode?: string;
  shippingPhone?: string;
  shippingStatus?: 'Pending Dispatch' | 'Dispatched via Speed Post' | 'Delivered' | 'Not Ordered';
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gstin?: string;
  avatarUrl?: string;
  isLoggedIn?: boolean;
}
