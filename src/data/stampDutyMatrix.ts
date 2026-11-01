// Master Stamp Duty & State Categorization Dataset
export interface StateCategoryItem {
  name: string;
  category: 'online_download' | 'online_nodownload' | 'offline_only';
  label: string;
  icon?: string;
}

// Exactly grouped into the 3 categories specified by the user:
export const STATE_CATEGORIES: StateCategoryItem[] = [
  // 1. Online Purchase & Download Available (Plain Text - Top of List)
  { name: 'Uttar Pradesh', category: 'online_download', label: 'Uttar Pradesh' },
  { name: 'Delhi', category: 'online_download', label: 'Delhi' },
  { name: 'Karnataka', category: 'online_download', label: 'Karnataka' },
  { name: 'Punjab', category: 'online_download', label: 'Punjab' },
  { name: 'Himachal Pradesh', category: 'online_download', label: 'Himachal Pradesh' },
  { name: 'Jammu & Kashmir', category: 'online_download', label: 'Jammu & Kashmir' },
  { name: 'Ladakh', category: 'online_download', label: 'Ladakh' },
  { name: 'Chandigarh', category: 'online_download', label: 'Chandigarh' },
  { name: 'Puducherry', category: 'online_download', label: 'Puducherry' },
  { name: 'Andaman & Nicobar', category: 'online_download', label: 'Andaman & Nicobar' },
  { name: 'Assam', category: 'online_download', label: 'Assam' },
  { name: 'Uttarakhand', category: 'online_download', label: 'Uttarakhand' },
  { name: 'Meghalaya', category: 'online_download', label: 'Meghalaya' },
  { name: 'Arunachal Pradesh', category: 'online_download', label: 'Arunachal Pradesh' },
  { name: 'Haryana', category: 'online_download', label: 'Haryana' },

  // 2. Online Purchase Available, Download Not Available (🔵 Blue Dot)
  { name: 'Maharashtra', category: 'online_nodownload', label: '🔵 Maharashtra', icon: '🔵' },
  { name: 'Gujarat', category: 'online_nodownload', label: '🔵 Gujarat', icon: '🔵' },
  { name: 'Tamil Nadu', category: 'online_nodownload', label: '🔵 Tamil Nadu', icon: '🔵' },
  { name: 'Rajasthan', category: 'online_nodownload', label: '🔵 Rajasthan', icon: '🔵' },
  { name: 'Bihar', category: 'online_nodownload', label: '🔵 Bihar', icon: '🔵' },
  { name: 'West Bengal', category: 'online_nodownload', label: '🔵 West Bengal', icon: '🔵' },
  { name: 'Odisha', category: 'online_nodownload', label: '🔵 Odisha', icon: '🔵' },
  { name: 'Chhattisgarh', category: 'online_nodownload', label: '🔵 Chhattisgarh', icon: '🔵' },
  { name: 'Andhra Pradesh', category: 'online_nodownload', label: '🔵 Andhra Pradesh', icon: '🔵' },
  { name: 'Telangana', category: 'online_nodownload', label: '🔵 Telangana', icon: '🔵' },
  { name: 'Jharkhand', category: 'online_nodownload', label: '🔵 Jharkhand', icon: '🔵' },
  { name: 'Madhya Pradesh', category: 'online_nodownload', label: '🔵 Madhya Pradesh', icon: '🔵' },
  { name: 'Tripura', category: 'online_nodownload', label: '🔵 Tripura', icon: '🔵' },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', category: 'online_nodownload', label: '🔵 Dadra & Nagar Haveli and Daman & Diu', icon: '🔵' },

  // 3. Neither Online Purchase nor Download Available (⭐ Star)
  { name: 'Goa', category: 'offline_only', label: '⭐ Goa', icon: '⭐' },
  { name: 'Kerala', category: 'offline_only', label: '⭐ Kerala', icon: '⭐' },
  { name: 'Manipur', category: 'offline_only', label: '⭐ Manipur', icon: '⭐' },
  { name: 'Mizoram', category: 'offline_only', label: '⭐ Mizoram', icon: '⭐' },
  { name: 'Nagaland', category: 'offline_only', label: '⭐ Nagaland', icon: '⭐' },
  { name: 'Sikkim', category: 'offline_only', label: '⭐ Sikkim', icon: '⭐' },
  { name: 'Lakshadweep', category: 'offline_only', label: '⭐ Lakshadweep', icon: '⭐' }
];

// Document Type Mapping to check if unilateral (No Second Party, Page 3 hidden)
export const UNILATERAL_DOCUMENTS: string[] = [
  'Name Change Affidavit',
  'Address Proof Correction Affidavit',
  'Date of Birth & Age Correction Affidavit',
  'Date of Birth Correction Affidavit',
  'Loss of Documents Affidavit',
  'Loss of Document Affidavit',
  'Anti-Ragging Affidavit',
  'Anti-ragging and Gap Year Affidavit',
  'Gap Year Affidavit',
  'Income Affidavit',
  'Income and Unemployment Affidavit',
  'Unemployment Affidavit',
  'First Child Affidavit',
  'First Child / Single Child / Single Girl Child Affidavit',
  'Single Girl Child Affidavit',
  'Proprietorship Declaration Deed',
  'Website Terms of Service & Privacy Policy Agreement',
  'Website and App Terms of Service & Privacy Policy Agreement',
  'Declaration Letter'
];

export function isUnilateralDocument(docTitle: string): boolean {
  return UNILATERAL_DOCUMENTS.some(
    (u) => docTitle.toLowerCase().includes(u.toLowerCase()) || u.toLowerCase().includes(docTitle.toLowerCase())
  );
}

// Calculate Safe Minimum Stamp Duty based on state and document type from the master matrix
export function getSafeStampDuty(docTitle: string, stateName: string): number {
  const cleanState = stateName.replace(/[🔵⭐]/g, '').trim();
  const cleanDoc = docTitle.toLowerCase();

  // 1. Maharashtra rules: ₹500 for commercial contracts, ₹100 for affidavits
  if (cleanState.includes('Maharashtra')) {
    if (
      cleanDoc.includes('affidavit') ||
      cleanDoc.includes('release form') ||
      cleanDoc.includes('proprietorship') ||
      cleanDoc.includes('website terms') ||
      cleanDoc.includes('offer letter') ||
      cleanDoc.includes('declaration letter')
    ) {
      return 100;
    }
    return 500;
  }

  // 2. Gujarat rules: ₹300 for commercial contracts, ₹50 for affidavits
  if (cleanState.includes('Gujarat')) {
    if (
      cleanDoc.includes('affidavit') ||
      cleanDoc.includes('release form') ||
      cleanDoc.includes('proprietorship') ||
      cleanDoc.includes('website terms') ||
      cleanDoc.includes('offer letter') ||
      cleanDoc.includes('declaration letter')
    ) {
      return 50;
    }
    return 300;
  }

  // 3. Karnataka rules: ₹200 for commercial contracts, ₹100 for affidavits
  if (cleanState.includes('Karnataka')) {
    if (
      cleanDoc.includes('affidavit') ||
      cleanDoc.includes('release form') ||
      cleanDoc.includes('proprietorship') ||
      cleanDoc.includes('website terms') ||
      cleanDoc.includes('offer letter') ||
      cleanDoc.includes('declaration letter')
    ) {
      return 100;
    }
    return 200;
  }

  // 4. Delhi rules: ₹100 for commercial contracts, ₹50 for affidavits & release
  if (cleanState.includes('Delhi')) {
    if (
      cleanDoc.includes('affidavit') ||
      cleanDoc.includes('release form') ||
      cleanDoc.includes('proprietorship') ||
      cleanDoc.includes('website terms') ||
      cleanDoc.includes('offer letter') ||
      cleanDoc.includes('declaration letter')
    ) {
      return 50;
    }
    return 100;
  }

  // 5. Uttar Pradesh & Uttarakhand & Bihar & Jharkhand & MP: ₹100 for contracts, ₹100 for affidavits
  if (
    cleanState.includes('Uttar Pradesh') ||
    cleanState.includes('Uttarakhand') ||
    cleanState.includes('Bihar') ||
    cleanState.includes('Jharkhand') ||
    cleanState.includes('Madhya Pradesh')
  ) {
    if (
      cleanDoc.includes('video') ||
      cleanDoc.includes('audio') ||
      cleanDoc.includes('offer letter')
    ) {
      return cleanState.includes('Uttar Pradesh') ? 50 : 20;
    }
    return 100;
  }

  // 6. Haryana, Rajasthan, Andhra, Telangana, Punjab, West Bengal, Odisha, Chhattisgarh:
  if (
    cleanState.includes('Haryana') ||
    cleanState.includes('Rajasthan') ||
    cleanState.includes('Andhra') ||
    cleanState.includes('Telangana') ||
    cleanState.includes('Punjab') ||
    cleanState.includes('West Bengal') ||
    cleanState.includes('Odisha') ||
    cleanState.includes('Chhattisgarh')
  ) {
    if (
      cleanDoc.includes('affidavit') ||
      cleanDoc.includes('proprietorship') ||
      cleanDoc.includes('declaration letter')
    ) {
      return 50;
    }
    if (cleanDoc.includes('video') || cleanDoc.includes('audio') || cleanDoc.includes('website') || cleanDoc.includes('offer')) {
      return 20;
    }
    return 100;
  }

  // 7. General States / UTs default (Assam, Goa, Kerala, Northeast, UTs):
  // Commercial: ₹100, Affidavits: ₹20
  if (
    cleanDoc.includes('affidavit') ||
    cleanDoc.includes('release form') ||
    cleanDoc.includes('proprietorship') ||
    cleanDoc.includes('website terms') ||
    cleanDoc.includes('offer letter') ||
    cleanDoc.includes('declaration letter')
  ) {
    return 20;
  }

  return 100;
}
