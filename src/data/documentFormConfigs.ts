export interface CustomKeyValueTerm {
  id: string;
  title: string;
  description: string;
}

export interface DocumentFormConfig {
  id: string;
  title: string;
  isUnilateral: boolean;
  firstPartyRole: string; // e.g. "Brand / Agency / Client"
  secondPartyRole: string; // e.g. "Influencer / Content Creator"
  coreSectionTitle: string;
  defaultCustomTermTitle?: string;
  defaultCustomTermDesc?: string;
}

export const DOCUMENT_CONFIGS: Record<string, DocumentFormConfig> = {
  'brand-promotion': {
    id: 'brand-promotion',
    title: 'Brand Promotion Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Brand / Sponsor / Advertiser',
    secondPartyRole: 'The Influencer / Content Creator / Promoter',
    coreSectionTitle: 'Core Brand Promotion Details',
    defaultCustomTermTitle: 'No-Deletion Timeline',
    defaultCustomTermDesc: 'The promoter cannot delete or archive the promotional reel for at least 365 days from the live date.'
  },
  'influencer-collab': {
    id: 'influencer-collab',
    title: 'Influencer Collaboration Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Brand / Agency / Client',
    secondPartyRole: 'The Influencer / Content Creator',
    coreSectionTitle: 'Core Influencer Collaboration Details',
    defaultCustomTermTitle: 'Reshoot Clause',
    defaultCustomTermDesc: 'If the content does not meet the clear guidelines provided in the brief, the influencer must execute one reshoot at no extra cost.'
  },
  'brand-sponsorship': {
    id: 'brand-sponsorship',
    title: 'Brand Sponsorship and Promotion Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Brand / Sponsor',
    secondPartyRole: 'The Creator / Influencer',
    coreSectionTitle: 'Core Sponsorship Deliverables & Rights',
    defaultCustomTermTitle: 'No-Delete Policy',
    defaultCustomTermDesc: 'Creator will not delete or archive the sponsored post for at least 1 year from the publish date.'
  },
  'freelancer-contract': {
    id: 'freelancer-contract',
    title: 'Freelancer and Client Service Contract',
    isUnilateral: false,
    firstPartyRole: 'The Client / Service Receiver / Employer',
    secondPartyRole: 'The Freelancer / Service Provider / Consultant',
    coreSectionTitle: 'Core Freelance & Service Deliverables',
    defaultCustomTermTitle: 'Late Payment Interest',
    defaultCustomTermDesc: 'Any invoice outstanding beyond 14 days will attract a late fee of 1.5% interest per month.'
  },
  'copyright-transfer': {
    id: 'copyright-transfer',
    title: 'Copyright Transfer Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Assignee / Buyer / Transferee',
    secondPartyRole: 'The Assignor / Original Creator / Author / Seller',
    coreSectionTitle: 'Core Copyright Transfer & IP Details',
    defaultCustomTermTitle: 'Credits Waiver',
    defaultCustomTermDesc: 'The Assignor waives all rights of attribution and agrees that the Assignee can publish the work anonymously or without historical credit.'
  },
  'content-rights': {
    id: 'content-rights',
    title: 'Content Rights Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Buyer / Licensee / Brand / Publisher',
    secondPartyRole: 'The Creator / Licensor / Owner of Content',
    coreSectionTitle: 'Core Content Rights & Licensing Terms',
    defaultCustomTermTitle: 'Exclusivity Period',
    defaultCustomTermDesc: 'The creator agrees not to license the same content to any direct competitor in the fintech space for a period of 24 months.'
  },
  'video-audio-release': {
    id: 'video-audio-release',
    title: 'Video/Audio Release Form',
    isUnilateral: false,
    firstPartyRole: 'The Producer / Production House / Media Company',
    secondPartyRole: 'The Participant / Actor / Model / Voiceover Artist',
    coreSectionTitle: 'Core Video / Audio Likeness Release Details',
    defaultCustomTermTitle: 'Screen Credit Designation',
    defaultCustomTermDesc: 'The Producer agrees to include the participant legal name in the end credits scrolling roll of the final video edit.'
  },
  'nda': {
    id: 'nda',
    title: 'Non-disclosure Agreement (NDA)',
    isUnilateral: false,
    firstPartyRole: 'The Disclosing Party',
    secondPartyRole: 'The Receiving Party',
    coreSectionTitle: 'Core Non-Disclosure & Confidentiality Terms',
    defaultCustomTermTitle: 'Non-Solicitation',
    defaultCustomTermDesc: 'The receiving party agrees not to hire, solicit, or poach any employees of the disclosing party for a period of 12 months.'
  },
  'founder-agreement': {
    id: 'founder-agreement',
    title: 'Founder and Co-founder Agreement',
    isUnilateral: false,
    firstPartyRole: 'Founder 1',
    secondPartyRole: 'Co-Founder 2',
    coreSectionTitle: 'Core Startup Equity Split & Vesting Terms',
    defaultCustomTermTitle: 'Non-Compete Term',
    defaultCustomTermDesc: 'If a founder exits the business, they cannot start a direct competing venture within the same industry sector for a period of 24 months.'
  },
  'proprietorship-deed': {
    id: 'proprietorship-deed',
    title: 'Proprietorship Declaration Deed',
    isUnilateral: true,
    firstPartyRole: 'The Proprietor / Declarant',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Proprietorship Business Declaration',
    defaultCustomTermTitle: 'Trade Name Disclaimer',
    defaultCustomTermDesc: 'The declarant states that the chosen trade name does not knowingly infringe upon any registered trademark operating in the same locality.'
  },
  'website-terms': {
    id: 'website-terms',
    title: 'Website & App Terms of Service & Privacy Policy',
    isUnilateral: true,
    firstPartyRole: 'The Platform Operator / Website Owner',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Website Terms & Privacy Framework (DPDP Act)',
    defaultCustomTermTitle: 'Subscription Auto-Renewal',
    defaultCustomTermDesc: 'All premium memberships auto-renew on the 1st of every calendar month unless canceled 48 hours prior.'
  },
  'software-it-agreement': {
    id: 'software-it-agreement',
    title: 'Software & IT Service Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Client / Customer / Service Receiver',
    secondPartyRole: 'The IT Service Provider / Software Developer / Agency',
    coreSectionTitle: 'Core Software Development & SLA Specifications',
    defaultCustomTermTitle: 'Post-Launch Support',
    defaultCustomTermDesc: 'The provider will deliver 30 days of complimentary bug-fixing and technical support post-production launch, after which standard AMC rates apply.'
  },
  'vendor-supplier': {
    id: 'vendor-supplier',
    title: 'Vendor and Supplier Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Buyer / Procurement Company',
    secondPartyRole: 'The Vendor / Supplier / Distributor',
    coreSectionTitle: 'Core Procurement & Supply Terms',
    defaultCustomTermTitle: 'Minimum Order Quantity',
    defaultCustomTermDesc: 'The buyer agrees to maintain a minimum order quantity (MOQ) of 500 units per quarter to sustain the discounted unit pricing.'
  },
  'name-change-affidavit': {
    id: 'name-change-affidavit',
    title: 'Name Change Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Person Changing Name',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Name Change & Gazette Notification Details',
    defaultCustomTermTitle: 'Alias Inclusion',
    defaultCustomTermDesc: 'The deponent further declares that they were also known by their alias name during their academic tenure.'
  },
  'address-proof-affidavit': {
    id: 'address-proof-affidavit',
    title: 'Address Proof Correction Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Applicant',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Address Correction Details',
    defaultCustomTermTitle: 'Locality Clarification',
    defaultCustomTermDesc: 'The deponent clarifies that the municipal sector number and local block number refer to the exact same residential property.'
  },
  'dob-correction-affidavit': {
    id: 'dob-correction-affidavit',
    title: 'Date of Birth & Age Correction Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Applicant',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Date of Birth Correction Details',
    defaultCustomTermTitle: 'Minority Horizon Check',
    defaultCustomTermDesc: 'The deponent states that all actions executed by them prior to this correction were performed in good faith.'
  },
  'loss-of-document-affidavit': {
    id: 'loss-of-document-affidavit',
    title: 'Loss of Documents Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Document Owner',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Lost Document & Police Report Details',
    defaultCustomTermTitle: 'Public Notice Reference',
    defaultCustomTermDesc: 'The deponent states that a public missing notice was published in the local newspaper.'
  },
  'anti-ragging-affidavit': {
    id: 'anti-ragging-affidavit',
    title: 'Anti-Ragging Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Student / Deponent',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core UGC Anti-Ragging Undertaking',
    defaultCustomTermTitle: 'Hostel Undertaking',
    defaultCustomTermDesc: 'The student further agrees to abide by the specific curfew timelines and emergency code protocols designated by campus administration.'
  },
  'gap-year-affidavit': {
    id: 'gap-year-affidavit',
    title: 'Gap Year Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Student',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Academic Gap Year Declaration',
    defaultCustomTermTitle: 'Competitive Preparation Notice',
    defaultCustomTermDesc: 'The deponent dedicated full-time hours to competitive exam preparations without participating in active corporate ventures.'
  },
  'old-vehicle-sale': {
    id: 'old-vehicle-sale',
    title: 'Old Vehicle Sales and Purchase Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Seller / Current Registered Owner',
    secondPartyRole: 'The Buyer / Intended New Owner',
    coreSectionTitle: 'Core Vehicle Sale & Liability Transfer Details',
    defaultCustomTermTitle: 'Accessories Included',
    defaultCustomTermDesc: 'The sale package includes an aftermarket touchscreen infotainment system and dashcam installed by the seller.'
  },
  'first-child-affidavit': {
    id: 'first-child-affidavit',
    title: 'First Child Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent (Parent / Legal Guardian)',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core First Child Declaration & Birth Order',
    defaultCustomTermTitle: 'Twin Case Clarification',
    defaultCustomTermDesc: 'The deponent clarifies that the first child was born 4 minutes earlier than the twin sibling.'
  },
  'single-girl-child-affidavit': {
    id: 'single-girl-child-affidavit',
    title: 'Single Girl Child Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent (Parent / Legal Guardian)',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Single Girl Child Declaration (CBSE / KVS Scheme)',
    defaultCustomTermTitle: 'Affiliated School Code',
    defaultCustomTermDesc: 'The deponent states that the applicant daughter is currently applying under the CBSE board registration framework.'
  },
  'income-affidavit': {
    id: 'income-affidavit',
    title: 'Income Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Income Declarant',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Gross Income & Land Ownership Verification',
    defaultCustomTermTitle: 'Pension Inflow Split',
    defaultCustomTermDesc: 'The deponent receives an additional family pension payout of ₹8,500 monthly from local defense service allocations.'
  },
  'unemployment-affidavit': {
    id: 'unemployment-affidavit',
    title: 'Unemployment Affidavit',
    isUnilateral: true,
    firstPartyRole: 'The Deponent / Unemployed Applicant',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Unemployment Verification & Undertaking',
    defaultCustomTermTitle: 'Competitive Phase',
    defaultCustomTermDesc: 'The deponent clarifies that they are presently dedicating full-time hours to civil service exam preparations.'
  },
  'employment-contract': {
    id: 'employment-contract',
    title: 'Employment Contract',
    isUnilateral: false,
    firstPartyRole: 'The Employer / Company / Organization',
    secondPartyRole: 'The Employee',
    coreSectionTitle: 'Core Employment Terms, CTC & Working Conditions',
    defaultCustomTermTitle: 'Training Bond',
    defaultCustomTermDesc: 'The employee agrees to serve a minimum duration of 12 months post specialized software training, failing which a recovery cost applies.'
  },
  'offer-letter': {
    id: 'offer-letter',
    title: 'Offer Letter',
    isUnilateral: false,
    firstPartyRole: 'The Issuing Company / Employer',
    secondPartyRole: 'The Candidate / Selected Applicant',
    coreSectionTitle: 'Core Offer Details, Joining Date & CTC',
    defaultCustomTermTitle: 'Signing Bonus Condition',
    defaultCustomTermDesc: 'A single lump-sum joining bonus of ₹25,000 will be paid, which must be fully returned if the candidate exits within 6 months.'
  },
  'general-consent': {
    id: 'general-consent',
    title: 'General Consent Agreement',
    isUnilateral: false,
    firstPartyRole: 'The Grantor Giving Consent',
    secondPartyRole: 'The Receiver Seeking Consent',
    coreSectionTitle: 'Core Consent Scope & Validity Terms',
    defaultCustomTermTitle: 'Geo-Fencing Limit',
    defaultCustomTermDesc: 'The consent to inspect physical logistical samples is restricted strictly to the regional warehouse terminal in Noida.'
  },
  'declaration-letter': {
    id: 'declaration-letter',
    title: 'Declaration Letter',
    isUnilateral: true,
    firstPartyRole: 'The Declarant / Entity Making Statement',
    secondPartyRole: 'Not Applicable',
    coreSectionTitle: 'Core Factual Narrative & Affirmation',
    defaultCustomTermTitle: 'Subsidiary Clarification',
    defaultCustomTermDesc: 'The declarant clarifies that the statements made here extend structurally to their wholly-owned branch office.'
  }
};

export function getDocumentConfig(title: string): DocumentFormConfig {
  const clean = title.toLowerCase();
  for (const key of Object.keys(DOCUMENT_CONFIGS)) {
    const config = DOCUMENT_CONFIGS[key];
    if (clean.includes(config.title.toLowerCase()) || config.title.toLowerCase().includes(clean)) {
      return config;
    }
  }

  // Fallback generic
  const isUnilateral = clean.includes('affidavit') || clean.includes('declaration');
  return {
    id: 'generic-doc',
    title: title,
    isUnilateral,
    firstPartyRole: isUnilateral ? 'The Deponent / Declarant' : 'First Party (Licensor / Client / Seller)',
    secondPartyRole: isUnilateral ? 'Not Applicable' : 'Second Party (Licensee / Freelancer / Buyer)',
    coreSectionTitle: 'Core Agreement Terms & Conditions',
    defaultCustomTermTitle: 'Additional Clause',
    defaultCustomTermDesc: 'Both parties agree to comply with all standard state legal requirements.'
  };
}
