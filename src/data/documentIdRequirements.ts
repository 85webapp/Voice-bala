// Master Document ID Requirements (PAN & Aadhaar: Mandatory vs Optional vs N/A)
// Grounded strictly in Indian statutory compliance and user specifications

export type RequirementType = 'mandatory' | 'optional' | 'not_applicable';

export interface DocumentIdRule {
  id: string;
  title: string;
  pan: RequirementType;
  aadhaar: RequirementType;
  rationale: string;
}

export const DOCUMENT_ID_RULES: Record<string, DocumentIdRule> = {
  // 1. Founder & Co-Founder Agreement
  'founder-co-founder-agreement': {
    id: 'founder-co-founder-agreement',
    title: 'Founder & Co-Founder Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'भविष्य के कानूनी विवादों और हिस्सेदारी (Equity) के स्वामित्व को स्पष्ट करने के लिए दोनों की कानूनी पहचान जरूरी है।'
  },

  // 2. Brand Sponsorship & Promotion Agreement
  'brand-sponsorship-promo': {
    id: 'brand-sponsorship-promo',
    title: 'Brand Sponsorship & Promotion Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'टीडीएस (TDS) कटौती और जीएसटी अनुपालन के लिए ब्रांड्स और इन्फ्लुएंसर्स दोनों का पैन कार्ड आवश्यक है।'
  },

  // 3. Influencer Collaboration Agreement
  'influencer-collab-agreement': {
    id: 'influencer-collab-agreement',
    title: 'Influencer Collaboration Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'भुगतान और वित्तीय लेन-देन पर टैक्स रिपोर्टिंग के लिए पैन कार्ड जरूरी है।'
  },

  // 4. Content Right & Copyright Transfer Agreement
  'content-rights-copyright': {
    id: 'content-rights-copyright',
    title: 'Content Right & Copyright Transfer Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'बौद्धिक संपदा (Intellectual Property) के स्थायी हस्तांतरण और कानूनी स्वामित्व के लिए पहचान सत्यापित होना अनिवार्य है।'
  },

  // 5. Freelancer & Client Service Contract
  'freelancer-client-contract': {
    id: 'freelancer-client-contract',
    title: 'Freelancer & Client Service Contract',
    pan: 'optional',
    aadhaar: 'optional',
    rationale: 'सामान्य सेवाओं के लिए वैकल्पिक है, लेकिन बड़ी राशि या टीडीएस कटौती के समय पैन अनिवार्य हो जाता है।'
  },

  // 6. Non-Disclosure Agreement (NDA)
  'nda-agreement': {
    id: 'nda-agreement',
    title: 'Non-Disclosure Agreement (NDA)',
    pan: 'optional',
    aadhaar: 'optional',
    rationale: 'गोपनीयता बनाए रखने के लिए केवल नाम और हस्ताक्षर पर्याप्त होते हैं, हालांकि पहचान के लिए आईडी जोड़ना सुरक्षित है।'
  },

  // 7. Video/Audio Release Form
  'video-audio-release-form': {
    id: 'video-audio-release-form',
    title: 'Video/Audio Release Form',
    pan: 'optional',
    aadhaar: 'optional',
    rationale: 'मीडिया और शूट्स के लिए केवल कंसेंट और हस्ताक्षर की आवश्यकता होती है, आईडी वैकल्पिक है।'
  },

  // 8. Proprietorship Declaration Deed
  'proprietorship-declaration-deed': {
    id: 'proprietorship-declaration-deed',
    title: 'Proprietorship Declaration Deed',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'बैंक खाते खोलने और जीएसटी/टैक्स रजिस्ट्रेशन के लिए प्रोप्राइटर का पैन और आधार अनिवार्य है।'
  },

  // 9. Vendor & Supplier Agreement
  'vendor-supplier-agreement': {
    id: 'vendor-supplier-agreement',
    title: 'Vendor & Supplier Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'व्यावसायिक चालान (Invoicing) और टैक्स अनुपालन के लिए वेंडर का पैन जरूरी है।'
  },

  // 10. Software & IT Service Agreement
  'software-it-service-agreement': {
    id: 'software-it-service-agreement',
    title: 'Software & IT Service Agreement',
    pan: 'optional',
    aadhaar: 'optional',
    rationale: 'बी2बी या कमर्शियल कॉन्ट्रैक्ट्स में टैक्स के लिए जरूरत पड़ सकती है, अन्यथा सॉफ्टवेयर शर्तों के लिए वैकल्पिक है।'
  },

  // 11. Website & App Terms of Service and Privacy Policy
  'website-app-terms-privacy': {
    id: 'website-app-terms-privacy',
    title: 'Website & App Terms of Service and Privacy Policy',
    pan: 'not_applicable',
    aadhaar: 'not_applicable',
    rationale: 'यह वेबसाइट विजिटर्स और ऐप यूजर्स के लिए सार्वजनिक नियम पृष्ठ होता है, इसमें व्यक्तिगत आईडी लागू नहीं है।'
  },

  // 12. Name Change Affidavit
  'name-change-affidavit': {
    id: 'name-change-affidavit',
    title: 'Name Change Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    rationale: 'नाम परिवर्तन कानूनी दस्तावेज और गजट नोटिफिकेशन है, इसलिए शपथकर्ता का आधार कार्ड अनिवार्य है।'
  },

  // 13. Address Proof Correction Affidavit
  'address-proof-affidavit': {
    id: 'address-proof-affidavit',
    title: 'Address Proof Correction Affidavit',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'पते के सत्यापन के लिए आधार कार्ड और पहचान के लिए पैन दोनों जरूरी हैं।'
  },

  // 14. Date of Birth & Age Correction Affidavit
  'dob-correction-affidavit': {
    id: 'dob-correction-affidavit',
    title: 'Date of Birth & Age Correction Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    rationale: 'जन्म तिथि सुधारने के लिए आधार कार्ड प्राथमिक सरकारी पहचान प्रमाण होता है।'
  },

  // 15. Loss of Document Affidavit
  'loss-of-document-affidavit': {
    id: 'loss-of-document-affidavit',
    title: 'Loss of Document Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    rationale: 'खोए हुए कानूनी/शैक्षणिक दस्तावेजों की रिपोर्ट और शपथ के लिए पहचान प्रमाण अनिवार्य है।'
  },

  // 16. Anti-Ragging & Gap Year Affidavit
  'anti-ragging-gap-year-affidavit': {
    id: 'anti-ragging-gap-year-affidavit',
    title: 'Anti-Ragging & Gap Year Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    rationale: 'शैक्षणिक संस्थानों और विश्वविद्यालयों में जमा होने वाले एफिडेविट्स में छात्र/अभिभावक का आधार अनिवार्य होता है।'
  },

  // 17. Income & Unemployment Affidavit
  'income-unemployment-affidavit': {
    id: 'income-unemployment-affidavit',
    title: 'Income & Unemployment Affidavit',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'आय और वित्तीय स्थिति के सत्यापन के लिए पैन और आधार दोनों जरूरी हैं।'
  },

  // 18. First Child / Single Child Affidavit
  'first-child-single-child-affidavit': {
    id: 'first-child-single-child-affidavit',
    title: 'First Child / Single Child Affidavit',
    pan: 'optional',
    aadhaar: 'mandatory',
    rationale: 'सरकारी योजनाओं, छात्रवृत्ति या दाखिलों के लिए माता-पिता और बच्चे की पहचान सत्यापित करनी होती है।'
  },

  // 19. Employment Contract & Offer Letter
  'employment-contract-offer-letter': {
    id: 'employment-contract-offer-letter',
    title: 'Employment Contract & Offer Letter',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'पेरोल, ईपीएफ (PF), ईएसआईसी और टैक्स कटौती (TDS) के लिए कर्मचारी का पैन और आधार अनिवार्य है।'
  },

  // 20. General Consent & Declaration Letter
  'general-consent-declaration-letter': {
    id: 'general-consent-declaration-letter',
    title: 'General Consent & Declaration Letter',
    pan: 'optional',
    aadhaar: 'optional',
    rationale: 'सामान्य औपचारिक घोषणा पत्रों में यह वैकल्पिक हो सकता है।'
  },

  // 21. Old Vehicle Sales & Purchase Agreement
  'old-vehicle-sales-agreement': {
    id: 'old-vehicle-sales-agreement',
    title: 'Vehicle Sales & Purchase Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'आरटीओ (RTO) ट्रांसफर और कानूनी स्वामित्व बदलने के लिए खरीदार और विक्रेता दोनों के पैन और आधार अनिवार्य हैं।'
  },

  // 22. 11th Month Rent Agreement
  'rent-11-month': {
    id: 'rent-11-month',
    title: '11th Month Rent Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'किरायेदारी अनुबंध, पुलिस सत्यापन (Police Verification) और ई-स्टाम्प पंजीकरण के लिए दोनों पक्षों का पैन व आधार अनिवार्य है।'
  },

  // 23. Sublease Agreement
  'sub-lease-agreement': {
    id: 'sub-lease-agreement',
    title: 'Sublease Agreement',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'सब-टेनेंसी अनुबंध और हेड लैंडलॉर्ड रिकॉर्ड के लिए मुख्य किरायेदार और उप-किरायेदार का पैन व आधार अनिवार्य है।'
  },

  // 24. Landlord NOC for GST
  'landlord-noc-gst': {
    id: 'landlord-noc-gst',
    title: 'Landlord NOC for GST',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'जीएसटी विभाग (GST REG-01) द्वारा परिसर के मालिकाना हक की जांच के लिए मकान मालिक का पैन व आधार अनिवार्य है।'
  },

  // 25. Landlord NOC for Business
  'landlord-noc-business': {
    id: 'landlord-noc-business',
    title: 'Landlord NOC for Business',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'कंपनी निगमन (MCA), ट्रेड लाइसेंस और नगर निगम सत्यापन के लिए संपत्ति स्वामी का पैन व आधार अनिवार्य है।'
  },

  // 26. Partnership Deed
  'partnership-deed': {
    id: 'partnership-deed',
    title: 'Partnership Deed',
    pan: 'mandatory',
    aadhaar: 'mandatory',
    rationale: 'पार्टनरशिप फर्म पैन आवेदन और बैंक करंट अकाउंट खोलने के लिए सभी पार्टनर्स का पैन व आधार अनिवार्य है।'
  },

  // 27. Equipment & Machinery Lease Agreement
  'equipments-machinery-lease': {
    id: 'equipments-machinery-lease',
    title: 'Equipment & Machinery Lease Agreement',
    pan: 'mandatory',
    aadhaar: 'optional',
    rationale: 'मशीनरी पट्टा, जीएसटी बिलिंग और उपकरण स्वामित्व सत्यापन के लिए पैन अनिवार्य है।'
  },

  // 28. Job Work & Manufacturing Agreement
  'job-work-manufacturing-agreement': {
    id: 'job-work-manufacturing-agreement',
    title: 'Job Work & Manufacturing Agreement',
    pan: 'mandatory',
    aadhaar: 'optional',
    rationale: 'जीएसटी धारा 143 के तहत जॉब वर्क चालान और कच्चे माल के हस्तांतरण के लिए पैन अनिवार्य है।'
  }
};

/**
 * Returns the PAN and Aadhaar requirements for any document title or alias
 */
export function getDocumentIdRule(documentTitleOrId: string): DocumentIdRule {
  const clean = (documentTitleOrId || '').toLowerCase().trim();

  // Direct match by ID
  if (DOCUMENT_ID_RULES[clean]) {
    return DOCUMENT_ID_RULES[clean];
  }

  // Title match
  for (const rule of Object.values(DOCUMENT_ID_RULES)) {
    const ruleTitle = rule.title.toLowerCase();
    if (clean.includes(ruleTitle) || ruleTitle.includes(clean)) {
      return rule;
    }
  }

  // Keyword-based heuristics
  if (clean.includes('rent') || clean.includes('lease') || clean.includes('tenancy')) {
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
  if (clean.includes('copyright') || clean.includes('content right')) {
    return DOCUMENT_ID_RULES['content-rights-copyright'];
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
  if (clean.includes('software') || clean.includes('it service')) {
    return DOCUMENT_ID_RULES['software-it-service-agreement'];
  }
  if (clean.includes('terms') || clean.includes('privacy')) {
    return DOCUMENT_ID_RULES['website-app-terms-privacy'];
  }
  if (clean.includes('vehicle') || clean.includes('car sale')) {
    return DOCUMENT_ID_RULES['old-vehicle-sales-agreement'];
  }
  if (clean.includes('employment') || clean.includes('offer letter')) {
    return DOCUMENT_ID_RULES['employment-contract-offer-letter'];
  }
  if (clean.includes('income') || clean.includes('unemployment')) {
    return DOCUMENT_ID_RULES['income-unemployment-affidavit'];
  }
  if (clean.includes('ragging') || clean.includes('gap year')) {
    return DOCUMENT_ID_RULES['anti-ragging-gap-year-affidavit'];
  }
  if (clean.includes('child')) {
    return DOCUMENT_ID_RULES['first-child-single-child-affidavit'];
  }
  if (clean.includes('name change')) {
    return DOCUMENT_ID_RULES['name-change-affidavit'];
  }
  if (clean.includes('dob') || clean.includes('birth') || clean.includes('age')) {
    return DOCUMENT_ID_RULES['dob-correction-affidavit'];
  }
  if (clean.includes('loss')) {
    return DOCUMENT_ID_RULES['loss-of-document-affidavit'];
  }
  if (clean.includes('consent') || clean.includes('declaration')) {
    return DOCUMENT_ID_RULES['general-consent-declaration-letter'];
  }
  if (clean.includes('partnership')) {
    return DOCUMENT_ID_RULES['partnership-deed'];
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
    rationale: 'मानक भारतीय अनुबंध कानून के अनुसार दोनों पक्षों की पहचान सत्यापन अनिवार्य है।'
  };
}
