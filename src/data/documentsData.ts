import { DocumentCategory, LegalDocument } from '../types';

export const INITIAL_FRONT_DOCUMENTS: LegalDocument[] = [
  // 1. Rent & Property (3)
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
    id: 'landlord-noc-gst',
    title: 'Landlord NOC for GST',
    category: 'Rent & Property',
    description: 'Owner consent declaration required by GST department for business address registration.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Owner Full Name', 'Proprietor/Director Name', 'Firm Name'],
    stampDutyRecommended: '₹50 / ₹100'
  },

  // 2. Creators and Freelancers (7)
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
    id: 'content-rights-agreement',
    title: 'Content Rights Agreement',
    category: 'Creators and Freelancers',
    description: 'Licensing and usage rights agreement defining digital media distribution, exclusivity, and creator attribution.',
    standardHours: 24,
    basePrice: 349,
    requiredFields: ['Creator / Licensor Name', 'Brand / Licensee Name', 'Content Scope', 'Usage Territory'],
    stampDutyRecommended: '₹100 / ₹200'
  },
  {
    id: 'copyright-transfer-agreement',
    title: 'Copyright Transfer Agreement',
    category: 'Creators and Freelancers',
    description: 'Deed permanently assigning intellectual property, video, music, code, or written work ownership with moral covenants.',
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

  // 3. Business and Partnerships (3)
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
    title: 'Founder and Co-Founder Agreement',
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

  // 4. Vendor, Supplier & IT (1)
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

  // 6. Education, Job & Government (6)
  {
    id: 'anti-ragging-affidavit',
    title: 'Anti-Ragging Affidavit',
    category: 'Education, Job & Government',
    description: 'UGC prescribed anti-ragging undertaking by student sworn before notary for college admission.',
    standardHours: 24,
    basePrice: 179,
    requiredFields: ['Student Name', 'Parent Name', 'College Name', 'Course Details'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'gap-year-affidavit',
    title: 'Gap Year Affidavit',
    category: 'Education, Job & Government',
    description: 'Sworn academic gap year justification affidavit explaining study break before college or university admission.',
    standardHours: 24,
    basePrice: 179,
    requiredFields: ['Student Name', 'Last Passed Exam', 'Gap Duration', 'Reason for Gap'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'income-affidavit',
    title: 'Income Affidavit',
    category: 'Education, Job & Government',
    description: 'Sworn statement verifying gross annual family earnings for scholarships, EWS, or government schemes.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Annual Family Income', 'Occupation', 'Purpose'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'unemployment-affidavit',
    title: 'Unemployment Affidavit',
    category: 'Education, Job & Government',
    description: 'Sworn undertaking certifying current unemployment status for government job relaxation, stipend, or loan subsidies.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Deponent Name', 'Qualification', 'Unemployed Since', 'Purpose'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'first-child-affidavit',
    title: 'First Child Affidavit',
    category: 'Education, Job & Government',
    description: 'Statutory birth order affidavit confirming first child status for school admission quota or government benefits.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Parent Name', 'Child Name', 'Date of Birth', 'Hospital / Birth Place'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },
  {
    id: 'single-girl-child-affidavit',
    title: 'Single Girl Child Affidavit',
    category: 'Education, Job & Government',
    description: 'Statutory Single Girl Child affidavit for CBSE/KVS school fee waiver, admission quota, and government scholarships.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Parent Name', 'Daughter Name', 'Date of Birth', 'School / Board'],
    stampDutyRecommended: '₹10 / ₹20 / ₹50'
  },

  // 7. Finance, HR & Vehicle (4) — Old Vehicle Sales and Purchase Agreement strictly LAST
  {
    id: 'general-consent-agreement',
    title: 'General Consent Agreement',
    category: 'Finance, HR & Vehicle',
    description: 'Bilateral written consent and authorization agreement defining permissions, limits, and validity terms.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Grantor Name', 'Receiver Name', 'Subject of Consent', 'Validity Period'],
    stampDutyRecommended: '₹50 / ₹100'
  },
  {
    id: 'declaration-letter',
    title: 'Declaration Letter',
    category: 'Finance, HR & Vehicle',
    description: 'Formal legal declaration letter affirming key facts, identity details, and counterparty acknowledgement.',
    standardHours: 24,
    basePrice: 199,
    requiredFields: ['Declarant Name', 'Recipient Name', 'Statement of Facts', 'Purpose'],
    stampDutyRecommended: '₹50 / ₹100'
  },
  {
    id: 'old-vehicle-sales-declaration',
    title: 'Old Vehicle Sales and Purchase Declaration',
    category: 'Finance, HR & Vehicle',
    description: 'Pre-owned vehicle sale & delivery declaration protecting seller and buyer on RTO handover date and time.',
    standardHours: 24,
    basePrice: 249,
    requiredFields: ['Seller Name', 'Buyer Name', 'Vehicle Reg. No.', 'Handover Date & Time'],
    stampDutyRecommended: '₹100'
  },
  {
    id: 'old-vehicle-sales-agreement',
    title: 'Old Vehicle Sales and Purchase Agreement',
    category: 'Finance, HR & Vehicle',
    description: 'Legally binding RTO Form 29/30 transfer agreement shifting road accident liability on token receipt.',
    standardHours: 24,
    basePrice: 249,
    requiredFields: ['Seller Name', 'Buyer Name', 'Vehicle Reg. No.', 'Chassis No.'],
    stampDutyRecommended: '₹100'
  }
];

// Master Featured Documents on Home (Old Vehicle Sales and Purchase Declaration included normally; Agreement kept at very end of full catalog)
export const FEATURED_11_AGREEMENTS_ORDER = [
  '11th Month Rent Agreement',
  'Landlord NOC for Business',
  'Brand Sponsorship & Promotion Agreement',
  'Founder and Co-Founder Agreement',
  'Name Change Affidavit',
  'Address Proof Correction Affidavit',
  'Date of Birth & Age Correction Affidavit',
  'Loss of Document Affidavit',
  'Old Vehicle Sales and Purchase Declaration',
  'Income Affidavit',
  'Unemployment Affidavit',
  'First Child Affidavit',
  'Single Girl Child Affidavit'
];

export const MASTER_CATEGORIES: DocumentCategory[] = [
  {
    id: 'rent-property',
    name: 'Rent & Property',
    iconName: 'Building2',
    description: 'Residential & commercial tenancy agreements and landlord consents.',
    items: [
      '11th Month Rent Agreement',
      'Landlord NOC for Business',
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
      'Content Rights Agreement',
      'Copyright Transfer Agreement',
      'Freelancer & Client Service Contract',
      'Non-Disclosure Agreement (NDA)',
      'Video/Audio Release Form'
    ]
  },
  {
    id: 'business-partnerships',
    name: 'Business and Partnerships',
    iconName: 'Briefcase',
    description: 'Founder covenants, proprietorship declarations, and machinery leases.',
    items: [
      'Proprietorship Declaration Deed',
      'Founder and Co-Founder Agreement',
      'Equipment & Machinery Lease Agreement'
    ]
  },
  {
    id: 'vendor-supplier-it',
    name: 'Vendor, Supplier & IT',
    iconName: 'Cpu',
    description: 'Commercial procurement and supply chain contracts.',
    items: [
      'Vendor & Supplier Agreement'
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
      'Anti-Ragging Affidavit',
      'Gap Year Affidavit',
      'Income Affidavit',
      'Unemployment Affidavit',
      'First Child Affidavit',
      'Single Girl Child Affidavit'
    ]
  },
  {
    id: 'finance-hr-vehicle',
    name: 'Finance, HR & Vehicle',
    iconName: 'Car',
    description: 'Consent agreements, declaration letters, and vehicle sale transfer contracts.',
    items: [
      'General Consent Agreement',
      'Declaration Letter',
      'Old Vehicle Sales and Purchase Declaration',
      'Old Vehicle Sales and Purchase Agreement'
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
