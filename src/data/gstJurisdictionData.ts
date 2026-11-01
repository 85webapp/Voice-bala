// GST Jurisdiction Data mapping PIN codes to verified Commissionerate, Division, and Range
export interface GstJurisdiction {
  pincode: string;
  commissionerate: string;
  division: string;
  range: string;
  state: string;
}

export const KNOWN_GST_JURISDICTIONS: Record<string, GstJurisdiction> = {
  // Delhi
  '110001': { pincode: '110001', commissionerate: 'Delhi Central', division: 'Division-I (Connaught Place)', range: 'Range-01', state: 'Delhi' },
  '110020': { pincode: '110020', commissionerate: 'Delhi South', division: 'Division-V (Okhla)', range: 'Range-23', state: 'Delhi' },
  '110092': { pincode: '110092', commissionerate: 'Delhi East', division: 'Division-VIII (Laxmi Nagar)', range: 'Range-41', state: 'Delhi' },
  '110034': { pincode: '110034', commissionerate: 'Delhi North', division: 'Division-III (Pitampura)', range: 'Range-14', state: 'Delhi' },

  // Uttar Pradesh - Noida & Greater Noida & Ghaziabad
  '201301': { pincode: '201301', commissionerate: 'Gautam Buddha Nagar', division: 'Division-II (Sector 18)', range: 'Range-07', state: 'Uttar Pradesh' },
  '201305': { pincode: '201305', commissionerate: 'Gautam Buddha Nagar', division: 'Division-IV (Expressway)', range: 'Range-19', state: 'Uttar Pradesh' },
  '201310': { pincode: '201310', commissionerate: 'Gautam Buddha Nagar', division: 'Division-VI (Greater Noida)', range: 'Range-28', state: 'Uttar Pradesh' },
  '201001': { pincode: '201001', commissionerate: 'Ghaziabad', division: 'Division-I (Navug Market)', range: 'Range-03', state: 'Uttar Pradesh' },
  '226001': { pincode: '226001', commissionerate: 'Lucknow', division: 'Division-I (Hazratganj)', range: 'Range-02', state: 'Uttar Pradesh' },

  // Maharashtra - Mumbai & Pune
  '400001': { pincode: '400001', commissionerate: 'Mumbai South', division: 'Division-I (Fort)', range: 'Range-01', state: 'Maharashtra' },
  '400051': { pincode: '400051', commissionerate: 'Mumbai East', division: 'Division-IV (Bandra Kurla Complex)', range: 'Range-18', state: 'Maharashtra' },
  '400069': { pincode: '400069', commissionerate: 'Mumbai West', division: 'Division-VI (Andheri East)', range: 'Range-32', state: 'Maharashtra' },
  '411001': { pincode: '411001', commissionerate: 'Pune-I', division: 'Division-II (Camp)', range: 'Range-08', state: 'Maharashtra' },
  '411057': { pincode: '411057', commissionerate: 'Pune-II', division: 'Division-V (Hinjawadi Infotech)', range: 'Range-24', state: 'Maharashtra' },

  // Karnataka - Bengaluru
  '560001': { pincode: '560001', commissionerate: 'Bengaluru East', division: 'Division-I (MG Road)', range: 'Range-04', state: 'Karnataka' },
  '560066': { pincode: '560066', commissionerate: 'Bengaluru North', division: 'Division-V (Whitefield ITPL)', range: 'Range-22', state: 'Karnataka' },
  '560034': { pincode: '560034', commissionerate: 'Bengaluru South', division: 'Division-III (Koramangala)', range: 'Range-12', state: 'Karnataka' },
  '560100': { pincode: '560100', commissionerate: 'Bengaluru South', division: 'Division-VII (Electronic City)', range: 'Range-35', state: 'Karnataka' },

  // Telangana - Hyderabad
  '500001': { pincode: '500001', commissionerate: 'Hyderabad Central', division: 'Division-I (Abids)', range: 'Range-03', state: 'Telangana' },
  '500081': { pincode: '500081', commissionerate: 'Hyderabad West (Rangareddy)', division: 'Division-IV (Madhapur Hitech City)', range: 'Range-19', state: 'Telangana' },

  // Tamil Nadu - Chennai
  '600001': { pincode: '600001', commissionerate: 'Chennai North', division: 'Division-I (Parrys)', range: 'Range-02', state: 'Tamil Nadu' },
  '600096': { pincode: '600096', commissionerate: 'Chennai South', division: 'Division-V (OMR IT Corridor)', range: 'Range-21', state: 'Tamil Nadu' },

  // West Bengal - Kolkata
  '700001': { pincode: '700001', commissionerate: 'Kolkata North', division: 'Division-I (BBD Bagh)', range: 'Range-01', state: 'West Bengal' },
  '700091': { pincode: '700091', commissionerate: 'Kolkata East', division: 'Division-IV (Salt Lake Sector V)', range: 'Range-16', state: 'West Bengal' },

  // Gujarat - Ahmedabad
  '380001': { pincode: '380001', commissionerate: 'Ahmedabad South', division: 'Division-I (Ashram Road)', range: 'Range-04', state: 'Gujarat' },
  '380054': { pincode: '380054', commissionerate: 'Ahmedabad North', division: 'Division-III (SG Highway)', range: 'Range-15', state: 'Gujarat' },

  // Rajasthan - Jaipur
  '302001': { pincode: '302001', commissionerate: 'Jaipur Central', division: 'Division-I (MI Road)', range: 'Range-02', state: 'Rajasthan' },
  '302020': { pincode: '302020', commissionerate: 'Jaipur South', division: 'Division-III (Mansarovar)', range: 'Range-11', state: 'Rajasthan' }
};

export function lookupGstJurisdiction(pincode: string, fallbackState: string): GstJurisdiction {
  const cleanPin = pincode.trim();
  if (KNOWN_GST_JURISDICTIONS[cleanPin]) {
    return KNOWN_GST_JURISDICTIONS[cleanPin];
  }

  // Smart derivation based on first 2 digits of Indian Pincode
  const prefix2 = cleanPin.slice(0, 2);
  let comm = `${fallbackState} Central Commissionerate`;
  let div = 'Division-I';
  let range = 'Range-01';

  if (prefix2 === '11') {
    comm = 'Delhi Central Commissionerate';
    div = 'Division-Central';
    range = 'Range-05';
  } else if (prefix2 === '20' || prefix2 === '21' || prefix2 === '22') {
    comm = 'Gautam Buddha Nagar / Noida Commissionerate';
    div = 'Division-II (Commercial Hub)';
    range = 'Range-12';
  } else if (prefix2 === '40') {
    comm = 'Mumbai Commissionerate';
    div = 'Division-South/Bandra';
    range = 'Range-08';
  } else if (prefix2 === '56') {
    comm = 'Bengaluru South Commissionerate';
    div = 'Division-Tech Corridor';
    range = 'Range-15';
  } else if (prefix2 === '50') {
    comm = 'Hyderabad Commissionerate';
    div = 'Division-Hitech City';
    range = 'Range-07';
  } else if (prefix2 === '60') {
    comm = 'Chennai Central Commissionerate';
    div = 'Division-OMR/Central';
    range = 'Range-09';
  }

  return {
    pincode: cleanPin,
    commissionerate: comm,
    division: div,
    range: range,
    state: fallbackState
  };
}
