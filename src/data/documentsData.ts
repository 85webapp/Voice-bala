import { DocumentCategory, LegalDocument } from '../types';

export const INITIAL_FRONT_DOCUMENTS: LegalDocument[] = [
  // 1. Rent & Property (4)
  {
    id: 'rent-11-month',
    title: '11th Month Rent Agreement',
    category: 'Rent & Property',
    description: 'Standard 11-month residential or commercial tenancy agreement validated with state e-stamp.',
    standardHours: 24,
    basePrice: 299,
    requiredFields: ['Tenant Full Name', 'Owner Full Name', 'Rented Property Address', 'Monthly Rent & Security Deposit'],
    stampDutyRecommended: '₹100 / ₹500'
  },
  {
    id: 'landlord-noc-business',
    title: 'Landlord NOC for Business',
    category: 'Rent & Property',
    description: 'No Objection Certificate from property owner for company registration and trade licensing.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Landlord Name', 'Business Entity Name', 'Premises Address'],
    stampDutyRecommended: '₹50 / ₹100'
  },
  {
    id: 'sub-lease-agreement',
    title: 'Sublease Agreement',
    category: 'Rent & Property',
    description: 'Secondary tenant contract permitting sub-tenancy with head landlord covenants.',
    standardHours: 24,
    basePrice: 349,
    requiredFields: ['Head Tenant Name', 'Sub-Tenant Name', 'Primary Landlord Details'],
    stampDutyRecommended: '₹100 / ₹500'
  },
  {
    id: 'landlord-noc-gst',
    title: 'Landlord NOC for GST',
    category: 'Rent & Property',
    description: 'Owner consent declaration required by GST department for business address registration.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Owner Full Name', 'Proprietor/Director Name', 'Firm Name'],
    stampDutyRecommended: '₹50 / ₹100'
  },

  // 2. Creators and Freelancers (6)
  {
    id: 'brand-sponsorship-promo',
    title: 'Brand Sponsorship & Promotion Agreement',
    category: 'Creators and Freelancers',
    description: 'Deliverables contract defining compensation, deliverables, media rights, and exclusivity.',
    standardHours: 24,
    basePrice: 399,
    requiredFields: ['Brand / Agency Name', 'Creator Legal Name', 'Deliverables List'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'influencer-collab-agreement',
    title: 'Influencer Collaboration Agreement',
    category: 'Creators and Freelancers',
    description: 'Social media influencer contract protecting copyright, timelines, and compliance.',
    standardHours: 24,
    basePrice: 349,
    requiredFields: ['Handle & Platform', 'Brand Representative', 'Deliverables'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'content-rights-copyright',
    title: 'Content Right & Copyright Transfer Agreement',
    category: 'Creators and Freelancers',
    description: 'Deed transferring intellectual property, video, music or written work rights with moral covenants.',
    standardHours: 24,
    basePrice: 399,
    requiredFields: ['Assignor / Creator Name', 'Assignee / Purchaser Name', 'Work Description', 'Royalty Terms'],
    stampDutyRecommended: '₹100 / ₹200'
  },
  {
    id: 'freelancer-client-contract',
    title: 'Freelancer & Client Service Contract',
    category: 'Creators and Freelancers',
    description: 'Work-for-hire agreement securing milestone payouts, revision limits, and IP ownership.',
    standardHours: 24,
    basePrice: 299,
    requiredFields: ['Freelancer Name', 'Client Name', 'Scope of Work', 'Milestones'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'nda-agreement',
    title: 'Non-Disclosure Agreement (NDA)',
    category: 'Creators and Freelancers',
    description: 'Confidentiality deed protecting proprietary trade secrets, codes, ideas, and customer records.',
    standardHours: 24,
    basePrice: 299,
    requiredFields: ['Disclosing Party', 'Receiving Party', 'Confidential Information Definition', 'Tenure'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'video-audio-release-form',
    title: 'Video/Audio Release Form',
    category: 'Creators and Freelancers',
    description: 'Model and artist likeness release granting commercial distribution rights.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Artist Name', 'Production Company', 'Shooting Date'],
    stampDutyRecommended: '₹50 / ₹100'
  },

  // 3. Business and Partnerships (4)
  {
    id: 'partnership-deed',
    title: 'Partnership Deed',
    category: 'Business and Partnerships',
    description: 'Indian Partnership Act compliant deed fixing capital, profit/loss ratio, and banking powers.',
    standardHours: 24,
    basePrice: 499,
    requiredFields: ['Partner 1 Details', 'Partner 2 Details', 'Firm Name', 'Profit Ratio'],
    stampDutyRecommended: '₹500 / ₹1000'
  },
  {
    id: 'proprietorship-declaration-deed',
    title: 'Proprietorship Declaration Deed',
    category: 'Business and Partnerships',
    description: 'Sole proprietorship declaration needed for bank current account and statutory licenses.',
    standardHours: 24,
    basePrice: 249,
    requiredFields: ['Sole Proprietor Name', 'Trade Name', 'Business Address'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'founder-co-founder-agreement',
    title: 'Founder & Co-Founder Agreement',
    category: 'Business and Partnerships',
    description: 'Vesting schedule, equity split, IP assignment, roles, and exit covenants for startup founders.',
    standardHours: 24,
    basePrice: 599,
    requiredFields: ['Founders Names', 'Startup Name', 'Equity Split', 'Vesting Cliff'],
    stampDutyRecommended: '₹200 / ₹500'
  },
  {
    id: 'equipments-machinery-lease',
    title: 'Equipment & Machinery Lease Agreement',
    category: 'Business and Partnerships',
    description: 'Industrial machinery rental contract stating maintenance, operating hours, and insurance.',
    standardHours: 24,
    basePrice: 399,
    requiredFields: ['Lessor Name', 'Lessee Name', 'Machine Make & Serial No.'],
    stampDutyRecommended: '₹100 / ₹500'
  },

  // 4. Vendor, Supplier & IT (4)
  {
    id: 'vendor-supplier-agreement',
    title: 'Vendor & Supplier Agreement',
    category: 'Vendor, Supplier & IT',
    description: 'Commercial supply agreement defining goods specifications, SLAs, credit cycle, and returns.',
    standardHours: 24,
    basePrice: 399,
    requiredFields: ['Buyer Company', 'Supplier Firm', 'Goods Specifications'],
    stampDutyRecommended: '₹100 / ₹200'
  },
  {
    id: 'software-it-service-agreement',
    title: 'Software & IT Service Agreement',
    category: 'Vendor, Supplier & IT',
    description: 'IT development and SaaS maintenance master agreement covering bug fixes, uptime SLA, and code delivery.',
    standardHours: 24,
    basePrice: 449,
    requiredFields: ['Client Name', 'Developer / IT Vendor', 'Scope of Modules', 'Warranty Period'],
    stampDutyRecommended: '₹100 / ₹200'
  },
  {
    id: 'job-work-manufacturing-agreement',
    title: 'Job Work & Manufacturing Agreement',
    category: 'Vendor, Supplier & IT',
    description: 'Subcontracting contract under Section 143 of GST Act for raw material conversion and toll manufacturing.',
    standardHours: 24,
    basePrice: 399,
    requiredFields: ['Principal Manufacturer', 'Job Worker', 'Material Scrap Ratio', 'Delivery Timelines'],
    stampDutyRecommended: '₹100 / ₹200'
  },
  {
    id: 'website-app-terms-privacy',
    title: 'Website & App Terms of Service and Privacy Policy',
    category: 'Vendor, Supplier & IT',
    description: 'IT Act 2000 and DPDP Act 2023 compliant terms of service, cookies disclosure, and digital privacy policy.',
    standardHours: 24,
    basePrice: 299,
    requiredFields: ['Platform Name', 'Company Legal Name', 'Grievance Officer Details', 'User Age Limit'],
    stampDutyRecommended: '₹100'
  },

  // 5. Personal Affidavits (4)
  {
    id: 'name-change-affidavit',
    title: 'Name Change Affidavit',
    category: 'Personal Affidavits',
    description: 'Sworn affidavit for official gazette notification, passport correction, and bank record changes.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Old Name', 'New Name', 'Father/Husband Name', 'Address'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'address-proof-affidavit',
    title: 'Address Proof Correction Affidavit',
    category: 'Personal Affidavits',
    description: 'Notarized undertaking certifying correct local residence for bank accounts, passport, or utility meters.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Current Residing Address', 'Previous Address', 'Proof Document'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'dob-correction-affidavit',
    title: 'Date of Birth & Age Correction Affidavit',
    category: 'Personal Affidavits',
    description: 'Affidavit for resolving birth date discrepancies across educational marksheet, Aadhaar, and PAN.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Recorded DOB', 'Correct Actual DOB'],
    stampDutyRecommended: '₹10 / ₹50'
  },
  {
    id: 'loss-of-document-affidavit',
    title: 'Loss of Document Affidavit',
    category: 'Personal Affidavits',
    description: 'Affidavit for lost marksheet, registry deeds, RC book, or passport with Police NCR reference.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Lost Document Name', 'Police NCR / GD No.'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },

  // 6. Education, Job & Government (3)
  {
    id: 'anti-ragging-gap-year-affidavit',
    title: 'Anti-Ragging & Gap Year Affidavit',
    category: 'Education, Job & Government',
    description: 'Prescribed anti-ragging undertaking and education gap year declaration sworn before notary.',
    standardHours: 24,
    basePrice: 179,
    requiredFields: ['Student Name', 'Parent Name', 'College Name', 'Gap Duration'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'income-unemployment-affidavit',
    title: 'Income & Unemployment Affidavit',
    category: 'Education, Job & Government',
    description: 'Sworn statement verifying gross family earnings or current unemployment status for scholarships/govt schemes.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Annual Family Income', 'Employment Status', 'Purpose'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'first-child-single-child-affidavit',
    title: 'First Child / Single Child Affidavit',
    category: 'Education, Job & Government',
    description: 'Statutory affidavit for school admission quota, government maternity subsidies, and Single Girl Child benefits.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Parent Name', 'Child Name', 'Date of Birth', 'Declaration Type'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },

  // 7. Finance, HR & Vehicle (3)
  {
    id: 'employment-contract-offer-letter',
    title: 'Employment Contract & Offer Letter',
    category: 'Finance, HR & Vehicle',
    description: 'Comprehensive hiring contract covering compensation, notice period, non-compete, and confidentiality.',
    standardHours: 24,
    basePrice: 299,
    requiredFields: ['Employer Name', 'Employee Name', 'Designation', 'Annual CTC', 'Notice Period'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'general-consent-declaration-letter',
    title: 'General Consent & Declaration Letter',
    category: 'Finance, HR & Vehicle',
    description: 'Unilateral or bilateral written declaration granting explicit consent, authorization, or factual affirmations.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Declarant Name', 'Subject of Consent', 'Authorized Entity', 'Validity Period'],
    stampDutyRecommended: '₹50 / ₹100'
  },
  {
    id: 'old-vehicle-sales-agreement',
    title: 'Vehicle Sales & Purchase Agreement',
    category: 'Finance, HR & Vehicle',
    description: 'Legally binding RTO Form 29/30 transfer agreement shifting road accident liability on token receipt.',
    standardHours: 24,
    basePrice: 249,
    requiredFields: ['Seller Name', 'Buyer Name', 'Vehicle Reg. No.', 'Chassis No.'],
    stampDutyRecommended: '₹100'
  }
];

export const MASTER_CATEGORIES: DocumentCategory[] = [
  {
    id: 'rent-property',
    name: 'Rent & Property',
    iconName: 'Building2',
    description: 'Residential & commercial tenancy agreements, landlord consents, and sublease deeds.',
    items: [
      '11th Month Rent Agreement',
      'Landlord NOC for Business',
      'Sublease Agreement',
      'Landlord NOC for GST'
    ]
  },
  {
    id: 'creators-freelancers',
    name: 'Creators and Freelancers',
    iconName: 'Sparkles',
    description: 'Digital creator contracts, influencer marketing, copyright transfer, and service contracts.',
    items: [
      'Brand Sponsorship & Promotion Agreement',
      'Influencer Collaboration Agreement',
      'Content Right & Copyright Transfer Agreement',
      'Freelancer & Client Service Contract',
      'Non-Disclosure Agreement (NDA)',
      'Video/Audio Release Form'
    ]
  },
  {
    id: 'business-partnerships',
    name: 'Business and Partnerships',
    iconName: 'Briefcase',
    description: 'Partnership deeds, founder covenants, proprietorship declarations, and machinery leases.',
    items: [
      'Partnership Deed',
      'Proprietorship Declaration Deed',
      'Founder & Co-Founder Agreement',
      'Equipment & Machinery Lease Agreement'
    ]
  },
  {
    id: 'vendor-supplier-it',
    name: 'Vendor, Supplier & IT',
    iconName: 'Cpu',
    description: 'Procurement contracts, software development agreements, and website terms.',
    items: [
      'Vendor & Supplier Agreement',
      'Software & IT Service Agreement',
      'Job Work & Manufacturing Agreement',
      'Website & App Terms of Service and Privacy Policy'
    ]
  },
  {
    id: 'personal-affidavits',
    name: 'Personal Affidavits',
    iconName: 'FileCheck2',
    description: 'Notarized sworn declarations for gazette notifications and identity corrections.',
    items: [
      'Name Change Affidavit',
      'Address Proof Correction Affidavit',
      'Date of Birth & Age Correction Affidavit',
      'Loss of Document Affidavit'
    ]
  },
  {
    id: 'education-job-gov',
    name: 'Education, Job & Government',
    iconName: 'GraduationCap',
    description: 'Academic undertakings, career gap justifications, and statutory undertakings.',
    items: [
      'Anti-Ragging & Gap Year Affidavit',
      'Income & Unemployment Affidavit',
      'First Child / Single Child Affidavit'
    ]
  },
  {
    id: 'finance-hr-vehicle',
    name: 'Finance, HR & Vehicle',
    iconName: 'Car',
    description: 'Employment contracts, declaration letters, and vehicle sale transfer contracts.',
    items: [
      'Employment Contract & Offer Letter',
      'General Consent & Declaration Letter',
      'Vehicle Sales & Purchase Agreement'
    ]
  }
];

export const STAMP_PAPER_VALUES = [
  { value: '₹10', label: '₹10 e-Stamp (Basic Affidavit / Undertaking)' },
  { value: '₹20', label: '₹20 e-Stamp (Standard Affidavit)' },
  { value: '₹50', label: '₹50 e-Stamp (State-mandated Affidavit)' },
  { value: '₹100', label: '₹100 e-Stamp (Rent, NOC, Vendor, Freelance standard)' },
  { value: '₹500', label: '₹500 e-Stamp (Partnership, High Value Commercial)' }
];
