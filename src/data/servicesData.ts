import { Building2, FileCheck2, ShieldCheck, BellRing, Globe2, Landmark } from 'lucide-react';

export type ServiceField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'textarea';
  required?: boolean;
};

export type ServiceItem = {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  description: string;
};

export type ServiceCategory = {
  id: 'registrations' | 'insurance' | 'filings' | 'notices' | 'website' | 'bank-loans';
  title: string;
  icon: typeof Building2;
  services: string[];
  fields: ServiceField[];
};

export const contactFields: ServiceField[] = [
  { name: 'contactName', label: 'Your name', required: true },
  { name: 'phone', label: 'Mobile number', type: 'tel', required: true },
  { name: 'email', label: 'Email address', type: 'email' }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'registrations',
    title: 'Registrations',
    icon: Building2,
    services: [
      'GST Registration',
      'MSME Udyam Registration',
      'Private Limited Company Registration',
      'Limited Liability Partnership (LLP) Registration',
      'Trademark Certificate',
      'FSSAI Food License'
    ],
    fields: [
      ...contactFields,
      { name: 'businessName', label: 'Business or applicant name', required: true },
      { name: 'businessActivity', label: 'Business activity' },
      { name: 'pan', label: 'PAN / existing GSTIN' },
      { name: 'businessAddress', label: 'Business address', type: 'textarea' }
    ]
  },
  {
    id: 'insurance',
    title: 'Insurance',
    icon: ShieldCheck,
    services: [
      'Car Insurance',
      'Bike Insurance',
      'Truck Insurance',
      'Miscellaneous Vehicle Insurance',
      'Other Vehicle Insurance'
    ],
    fields: [
      ...contactFields,
      { name: 'vehicleNumber', label: 'Vehicle registration number', required: true },
      { name: 'vehicleModel', label: 'Vehicle make and model' },
      { name: 'manufactureYear', label: 'Year of manufacture' },
      { name: 'policyExpiry', label: 'Current policy expiry date', type: 'date' }
    ]
  },
  {
    id: 'filings',
    title: 'Filings',
    icon: FileCheck2,
    services: [
      'GST Filing',
      'Income Tax Return Filing',
      'Other Filing'
    ],
    fields: [
      ...contactFields,
      { name: 'applicantName', label: 'Applicant or business name', required: true },
      { name: 'financialYear', label: 'Financial year / filing period' },
      { name: 'panGstin', label: 'PAN / GSTIN' },
      { name: 'filingDetails', label: 'What filing assistance do you need?', type: 'textarea', required: true }
    ]
  },
  {
    id: 'notices',
    title: 'Notices',
    icon: BellRing,
    services: ['Income Tax Notice Handling', 'GST Notice Handling', 'Any Other Notice'],
    fields: [
      ...contactFields,
      { name: 'noticeNumber', label: 'Notice reference number' },
      { name: 'receivedDate', label: 'Date received', type: 'date' },
      { name: 'responseDate', label: 'Response due date', type: 'date' },
      { name: 'noticeIssue', label: 'Briefly describe the notice', type: 'textarea', required: true }
    ]
  },
  {
    id: 'website',
    title: 'Website',
    icon: Globe2,
    services: ['Website Development', 'Logo Making', 'Purchase Domain', 'Hosting', 'Banner Making'],
    fields: [
      ...contactFields,
      { name: 'brandName', label: 'Business or brand name', required: true },
      { name: 'domain', label: 'Domain name (if available)' },
      { name: 'requirements', label: 'Project requirements', type: 'textarea', required: true },
      { name: 'reference', label: 'Style or reference links' }
    ]
  },
  {
    id: 'bank-loans',
    title: 'Bank Loans',
    icon: Landmark,
    services: ['Current Account File Making', 'Mudra Loan File Making', 'Mudra Loan Online Request'],
    fields: [
      ...contactFields,
      { name: 'businessName', label: 'Business name', required: true },
      { name: 'businessType', label: 'Business type' },
      { name: 'loanAmount', label: 'Requested loan amount (if applicable)' },
      { name: 'requestDetails', label: 'Purpose and other details', type: 'textarea', required: true }
    ]
  }
];
