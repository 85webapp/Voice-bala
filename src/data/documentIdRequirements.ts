// Master Document ID Requirements (PAN & Aadhaar per Party + Witness Mandate)
// Grounded strictly in Indian statutory compliance and user specifications

export type RequirementType = 'mandatory' | 'optional' | 'not_applicable';

export interface DocumentIdRule {
  id: string;
  title: string;
  pan: RequirementType;
  aadhaar: RequirementType;
  secondPartyPan?: RequirementType;
  secondPartyAadhaar?: RequirementType;
  requireWitnesses: boolean;
  panMandatoryMinAge?: number;
  rationale: string;
}

export const DOCUMENT_ID_RULES: Record<string, DocumentIdRule> = {
  // 1. Founder and Co-Founder Agreement
  'founder-co-founder-agreement': {
    id: 'founder-co-founder-agreement',
    title: 'Founder and Co-Founder Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'भविष्य के कानूनी विवादों और हिस्सेदारी (Equity) के स्वामित्व को स्पष्ट करने के लिए दोनों की कानूनी पहचान व गवाह अनिवार्य हैं।'
  },

  // 2. Brand Sponsorship & Promotion Agreement
  'brand-sponsorship-promo': {
    id: 'brand-sponsorship-promo',
    title: 'Brand Sponsorship & Promotion Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'टीडीएस (TDS) कटौती और जीएसटी अनुपालन के लिए दोनों पक्षों का पैन, आधार व गवाह आवश्यक हैं।'
  },

  // 3. Influencer Collaboration Agreement
  'influencer-collab-agreement': {
    id: 'influencer-collab-agreement',
    title: 'Influencer Collaboration Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'भुगतान और वित्तीय लेन-देन पर टैक्स रिपोर्टिंग के लिए दोनों पक्षों का पैन, आधार व गवाह अनिवार्य हैं।'
  },

  // 4. Content Rights Agreement
  'content-rights-agreement': {
    id: 'content-rights-agreement',
    title: 'Content Rights Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'कंटेंट लाइसेंसिंग और बौद्धिक संपदा अधिकारों के लिए दोनों पक्षों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 5. Copyright Transfer Agreement
  'copyright-transfer-agreement': {
    id: 'copyright-transfer-agreement',
    title: 'Copyright Transfer Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'कॉपीराइट के स्थायी हस्तांतरण और स्वामित्व सत्यापन के लिए दोनों पक्षों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 6. Freelancer & Client Service Contract
  'freelancer-client-contract': {
    id: 'freelancer-client-contract',
    title: 'Freelancer & Client Service Contract',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'फ्रीलांस अनुबंध और भुगतान सुरक्षा के लिए दोनों पक्षों का पैन, आधार व गवाह अनिवार्य हैं।'
  },

  // 7. Non-Disclosure Agreement (NDA)
  'nda-agreement': {
    id: 'nda-agreement',
    title: 'Non-Disclosure Agreement (NDA)',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'गोपनीयता अनुबंध की कानूनी वैधता के लिए दोनों पक्षों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 8. Video/Audio Release Form (Aadhaar Mandatory, PAN Optional, Witnesses Mandatory)
  'video-audio-release-form': {
    id: 'video-audio-release-form',
    title: 'Video/Audio Release Form',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'optional',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'वीडियो/ऑडियो रिलीज फॉर्म में दोनों पक्षों का आधार कार्ड और गवाह अनिवार्य हैं; पैन कार्ड वैकल्पिक है।'
  },

  // 9. Proprietorship Declaration Deed (Unilateral, No 2nd Party, No Witnesses)
  'proprietorship-declaration-deed': {
    id: 'proprietorship-declaration-deed',
    title: 'Proprietorship Declaration Deed',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'बैंक खाते खोलने और जीएसटी/टैक्स रजिस्ट्रेशन के लिए प्रोप्राइटर का पैन और आधार अनिवार्य है (द्वितीय पक्ष या गवाह की आवश्यकता नहीं)।'
  },

  // 10. Vendor & Supplier Agreement
  'vendor-supplier-agreement': {
    id: 'vendor-supplier-agreement',
    title: 'Vendor & Supplier Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'व्यावसायिक चालान और सप्लाई अनुपालन के लिए दोनों पक्षों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 12. Name Change Affidavit (Aadhaar Mandatory, PAN Mandatory if Age >= 18, No 2nd Party, No Witnesses)
  'name-change-affidavit': {
    id: 'name-change-affidavit',
    title: 'Name Change Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    panMandatoryMinAge: 18,
    rationale: 'नाम परिवर्तन शपथ पत्र में आधार अनिवार्य है और 18 वर्ष या उससे अधिक आयु होने पर पैन कार्ड भी अनिवार्य है।'
  },

  // 13. Address Proof Correction Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'address-proof-affidavit': {
    id: 'address-proof-affidavit',
    title: 'Address Proof Correction Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'पते के सत्यापन के लिए आधार कार्ड अनिवार्य है; पैन कार्ड वैकल्पिक है।'
  },

  // 14. Date of Birth & Age Correction Affidavit (Aadhaar Mandatory, PAN Mandatory, No 2nd Party, No Witnesses)
  'dob-correction-affidavit': {
    id: 'dob-correction-affidavit',
    title: 'Date of Birth & Age Correction Affidavit',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'जन्म तिथि और आयु सुधार शपथ पत्र के लिए आधार कार्ड और पैन कार्ड दोनों अनिवार्य हैं।'
  },

  // 15. Loss of Document Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'loss-of-document-affidavit': {
    id: 'loss-of-document-affidavit',
    title: 'Loss of Document Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'खोए हुए दस्तावेजों की रिपोर्ट के लिए आधार कार्ड अनिवार्य है; पैन कार्ड वैकल्पिक है।'
  },

  // 16. Anti-Ragging Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'anti-ragging-affidavit': {
    id: 'anti-ragging-affidavit',
    title: 'Anti-Ragging Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'एंटी-रैगिंग शपथ पत्र में छात्र/अभिभावक का आधार अनिवार्य है; पैन वैकल्पिक है।'
  },

  // 17. Gap Year Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'gap-year-affidavit': {
    id: 'gap-year-affidavit',
    title: 'Gap Year Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'गैप ईयर शपथ पत्र में आधार कार्ड अनिवार्य है; पैन कार्ड वैकल्पिक है।'
  },

  // 18. Income Affidavit (Aadhaar Mandatory, PAN Mandatory, No 2nd Party, No Witnesses)
  'income-affidavit': {
    id: 'income-affidavit',
    title: 'Income Affidavit',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'आय सत्यापन शपथ पत्र के लिए आधार कार्ड और पैन कार्ड दोनों अनिवार्य हैं।'
  },

  // 19. Unemployment Affidavit (Both Aadhaar & PAN Optional, No 2nd Party, No Witnesses)
  'unemployment-affidavit': {
    id: 'unemployment-affidavit',
    title: 'Unemployment Affidavit',
    pan: 'optional',
    aadhaar: 'optional',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'बेरोजगारी शपथ पत्र में आधार कार्ड और पैन कार्ड दोनों वैकल्पिक हैं।'
  },

  // 20. First Child Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'first-child-affidavit': {
    id: 'first-child-affidavit',
    title: 'First Child Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'फर्स्ट चाइल्ड शपथ पत्र में आधार कार्ड अनिवार्य है; पैन कार्ड वैकल्पिक है।'
  },

  // 21. Single Girl Child Affidavit (Aadhaar Mandatory, PAN Optional, No 2nd Party, No Witnesses)
  'single-girl-child-affidavit': {
    id: 'single-girl-child-affidavit',
    title: 'Single Girl Child Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    secondPartyPan: 'not_applicable',
    secondPartyAadhaar: 'not_applicable',
    requireWitnesses: false,
    rationale: 'सिंगल गर्ल चाइल्ड शपथ पत्र में आधार कार्ड अनिवार्य है; पैन कार्ड वैकल्पिक है।'
  },

  // 23. General Consent Agreement
  'general-consent-agreement': {
    id: 'general-consent-agreement',
    title: 'General Consent Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'सहमति अनुबंध के लिए दोनों पक्षों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 24. Declaration Letter (P1 Aadhaar & PAN Mandatory; P2 Aadhaar Mandatory & PAN Optional; Witnesses Mandatory)
  'declaration-letter': {
    id: 'declaration-letter',
    title: 'Declaration Letter',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'optional',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'घोषणा पत्र में प्रथम पक्ष के लिए आधार व पैन दोनों अनिवार्य हैं, द्वितीय पक्ष के लिए आधार अनिवार्य व पैन वैकल्पिक है, तथा गवाह अनिवार्य हैं।'
  },

  // 25. Old Vehicle Sales and Purchase Declaration
  'old-vehicle-sales-declaration': {
    id: 'old-vehicle-sales-declaration',
    title: 'Old Vehicle Sales and Purchase Declaration',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'वाहन बिक्री घोषणा पत्र के लिए क्रेता व विक्रेता दोनों का आधार, पैन व गवाह अनिवार्य हैं।'
  },

  // 26. Old Vehicle Sales and Purchase Agreement
  'old-vehicle-sales-agreement': {
    id: 'old-vehicle-sales-agreement',
    title: 'Old Vehicle Sales and Purchase Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'आरटीओ ट्रांसफर और स्वामित्व हस्तांतरण के लिए क्रेता व विक्रेता दोनों के पैन, आधार व गवाह अनिवार्य हैं।'
  },

  // 27. 11th Month Rent Agreement
  'rent-11-month': {
    id: 'rent-11-month',
    title: '11th Month Rent Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'किरायेदारी अनुबंध और ई-स्टाम्प पंजीकरण के लिए दोनों पक्षों का आधार व पैन तथा दोनों गवाह अनिवार्य हैं।'
  },

  // 28. Landlord NOC for GST
  'landlord-noc-gst': {
    id: 'landlord-noc-gst',
    title: 'Landlord NOC for GST',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'optional',
    requireWitnesses: false,
    rationale: 'जीएसटी विभाग द्वारा परिसर के मालिकाना हक की जांच के लिए मकान मालिक का पैन व आधार अनिवार्य है।'
  },

  // 29. Landlord NOC for Business
  'landlord-noc-business': {
    id: 'landlord-noc-business',
    title: 'Landlord NOC for Business',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'व्यावसायिक एनओसी के लिए प्रथम व द्वितीय पक्ष दोनों का आधार व पैन तथा दोनों गवाह अनिवार्य हैं।'
  },

  // 31. Equipment & Machinery Lease Agreement
  'equipments-machinery-lease': {
    id: 'equipments-machinery-lease',
    title: 'Equipment & Machinery Lease Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'मशीनरी लीज अनुबंध के लिए दोनों पक्षों का पैन, आधार व गवाह अनिवार्य हैं।'
  }
};

/**
 * Returns the PAN, Aadhaar, and Witness requirements for any document title or alias
 */
export function getDocumentIdRule(documentTitleOrId: string): DocumentIdRule {
  const clean = (documentTitleOrId || '').toLowerCase().trim();

  // Direct match by ID
  if (DOCUMENT_ID_RULES[clean]) {
    return DOCUMENT_ID_RULES[clean];
  }

  // Exact title match first to avoid substring collisions
  for (const rule of Object.values(DOCUMENT_ID_RULES)) {
    if (rule.title.toLowerCase() === clean) {
      return rule;
    }
  }

  // Keyword-based heuristics (specific splits ordered carefully)
  if (clean.includes('rent') || clean.includes('lease') || clean.includes('tenancy')) {
    if (clean.includes('machinery') || clean.includes('equipment')) {
      return DOCUMENT_ID_RULES['equipments-machinery-lease'];
    }
    return DOCUMENT_ID_RULES['rent-11-month'];
  }
  if (clean.includes('gst') && clean.includes('noc')) {
    return DOCUMENT_ID_RULES['landlord-noc-gst'];
  }
  if (clean.includes('noc')) {
    return DOCUMENT_ID_RULES['landlord-noc-business'];
  }
  if (clean.includes('founder') || clean.includes('co-founder')) {
    return DOCUMENT_ID_RULES['founder-co-founder-agreement'];
  }
  if (clean.includes('sponsorship') || clean.includes('sponsor')) {
    return DOCUMENT_ID_RULES['brand-sponsorship-promo'];
  }
  if (clean.includes('influencer') || clean.includes('collab')) {
    return DOCUMENT_ID_RULES['influencer-collab-agreement'];
  }
  if (clean.includes('copyright')) {
    return DOCUMENT_ID_RULES['copyright-transfer-agreement'];
  }
  if (clean.includes('content right')) {
    return DOCUMENT_ID_RULES['content-rights-agreement'];
  }
  if (clean.includes('freelancer')) {
    return DOCUMENT_ID_RULES['freelancer-client-contract'];
  }
  if (clean.includes('nda') || clean.includes('disclosure')) {
    return DOCUMENT_ID_RULES['nda-agreement'];
  }
  if (clean.includes('video') || clean.includes('release')) {
    return DOCUMENT_ID_RULES['video-audio-release-form'];
  }
  if (clean.includes('proprietor')) {
    return DOCUMENT_ID_RULES['proprietorship-declaration-deed'];
  }
  if (clean.includes('vendor') || clean.includes('supplier')) {
    return DOCUMENT_ID_RULES['vendor-supplier-agreement'];
  }
  if (clean.includes('vehicle') && clean.includes('declaration')) {
    return DOCUMENT_ID_RULES['old-vehicle-sales-declaration'];
  }
  if (clean.includes('vehicle') || clean.includes('car sale')) {
    return DOCUMENT_ID_RULES['old-vehicle-sales-agreement'];
  }
  if (clean.includes('unemployment')) {
    return DOCUMENT_ID_RULES['unemployment-affidavit'];
  }
  if (clean.includes('income')) {
    return DOCUMENT_ID_RULES['income-affidavit'];
  }
  if (clean.includes('gap year')) {
    return DOCUMENT_ID_RULES['gap-year-affidavit'];
  }
  if (clean.includes('ragging')) {
    return DOCUMENT_ID_RULES['anti-ragging-affidavit'];
  }
  if (clean.includes('single girl child') || clean.includes('single child')) {
    return DOCUMENT_ID_RULES['single-girl-child-affidavit'];
  }
  if (clean.includes('first child')) {
    return DOCUMENT_ID_RULES['first-child-affidavit'];
  }
  if (clean.includes('name change')) {
    return DOCUMENT_ID_RULES['name-change-affidavit'];
  }
  if (clean.includes('address proof')) {
    return DOCUMENT_ID_RULES['address-proof-affidavit'];
  }
  if (clean.includes('dob') || clean.includes('birth') || clean.includes('age')) {
    return DOCUMENT_ID_RULES['dob-correction-affidavit'];
  }
  if (clean.includes('loss')) {
    return DOCUMENT_ID_RULES['loss-of-document-affidavit'];
  }
  if (clean.includes('declaration letter')) {
    return DOCUMENT_ID_RULES['declaration-letter'];
  }
  if (clean.includes('consent')) {
    return DOCUMENT_ID_RULES['general-consent-agreement'];
  }
  if (clean.includes('affidavit')) {
    return DOCUMENT_ID_RULES['name-change-affidavit'];
  }

  // Default fallback
  return {
    id: 'generic',
    title: documentTitleOrId,
    pan: 'mandatory',
    aadhaar: 'mandatory',
    secondPartyPan: 'mandatory',
    secondPartyAadhaar: 'mandatory',
    requireWitnesses: true,
    rationale: 'मानक भारतीय अनुबंध कानून के अनुसार दोनों पक्षों की पहचान सत्यापन और गवाह अनिवार्य हैं।'
  };
}
