// Shared Indian PIN code -> State & City lookup (Sync prefix fallback + Live India Post API)

export interface PincodeLookupResult {
  state: string;
  city: string;
}

const VALID_STATE_NAMES = new Set<string>([
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]);

export function normalizeIndianStateName(rawState: string): string {
  const s = (rawState || '').trim();
  if (!s) return '';
  if (VALID_STATE_NAMES.has(s)) return s;

  const lower = s.toLowerCase();
  if (lower.includes('delhi')) return 'Delhi (NCT)';
  if (lower.includes('jammu')) return 'Jammu and Kashmir';
  if (lower.includes('dadra') || lower.includes('daman')) {
    return 'Dadra and Nagar Haveli and Daman and Diu';
  }
  if (lower.includes('andaman')) return 'Andaman and Nicobar Islands';
  if (lower === 'orissa') return 'Odisha';
  if (lower === 'uttaranchal') return 'Uttarakhand';
  if (lower === 'pondicherry') return 'Puducherry';

  for (const valid of VALID_STATE_NAMES) {
    if (valid.toLowerCase() === lower) return valid;
  }
  return '';
}

const THREE_DIGIT_CITY_MAP: Record<string, PincodeLookupResult> = {
  // Delhi (NCT)
  '110': { state: 'Delhi (NCT)', city: 'New Delhi' },
  // Haryana
  '121': { state: 'Haryana', city: 'Faridabad' },
  '122': { state: 'Haryana', city: 'Gurugram' },
  '123': { state: 'Haryana', city: 'Rewari' },
  '124': { state: 'Haryana', city: 'Rohtak' },
  '125': { state: 'Haryana', city: 'Hisar' },
  '126': { state: 'Haryana', city: 'Jind' },
  '127': { state: 'Haryana', city: 'Bhiwani' },
  '131': { state: 'Haryana', city: 'Sonipat' },
  '132': { state: 'Haryana', city: 'Panipat / Karnal' },
  '133': { state: 'Haryana', city: 'Ambala' },
  '134': { state: 'Haryana', city: 'Panchkula' },
  '135': { state: 'Haryana', city: 'Yamunanagar' },
  '136': { state: 'Haryana', city: 'Kurukshetra' },
  // Punjab & Chandigarh
  '140': { state: 'Punjab', city: 'Mohali (SAS Nagar)' },
  '141': { state: 'Punjab', city: 'Ludhiana' },
  '142': { state: 'Punjab', city: 'Moga' },
  '143': { state: 'Punjab', city: 'Amritsar' },
  '144': { state: 'Punjab', city: 'Jalandhar' },
  '146': { state: 'Punjab', city: 'Hoshiarpur' },
  '147': { state: 'Punjab', city: 'Patiala' },
  '148': { state: 'Punjab', city: 'Sangrur' },
  '151': { state: 'Punjab', city: 'Bathinda' },
  '152': { state: 'Punjab', city: 'Ferozepur' },
  '160': { state: 'Chandigarh', city: 'Chandigarh' },
  // Himachal Pradesh
  '171': { state: 'Himachal Pradesh', city: 'Shimla' },
  '172': { state: 'Himachal Pradesh', city: 'Kinnaur' },
  '173': { state: 'Himachal Pradesh', city: 'Solan' },
  '174': { state: 'Himachal Pradesh', city: 'Una / Bilaspur' },
  '175': { state: 'Himachal Pradesh', city: 'Mandi / Kullu' },
  '176': { state: 'Himachal Pradesh', city: 'Dharamshala (Kangra)' },
  '177': { state: 'Himachal Pradesh', city: 'Hamirpur' },
  // J&K & Ladakh
  '180': { state: 'Jammu and Kashmir', city: 'Jammu' },
  '181': { state: 'Jammu and Kashmir', city: 'Jammu' },
  '190': { state: 'Jammu and Kashmir', city: 'Srinagar' },
  '194': { state: 'Ladakh', city: 'Leh' },
  // Uttar Pradesh
  '201': { state: 'Uttar Pradesh', city: 'Noida / Ghaziabad' },
  '202': { state: 'Uttar Pradesh', city: 'Aligarh' },
  '203': { state: 'Uttar Pradesh', city: 'Bulandshahr' },
  '204': { state: 'Uttar Pradesh', city: 'Hathras' },
  '205': { state: 'Uttar Pradesh', city: 'Mainpuri' },
  '206': { state: 'Uttar Pradesh', city: 'Etawah' },
  '207': { state: 'Uttar Pradesh', city: 'Etah' },
  '208': { state: 'Uttar Pradesh', city: 'Kanpur' },
  '209': { state: 'Uttar Pradesh', city: 'Kanpur Dehat / Unnao' },
  '210': { state: 'Uttar Pradesh', city: 'Banda / Hamirpur' },
  '211': { state: 'Uttar Pradesh', city: 'Prayagraj' },
  '212': { state: 'Uttar Pradesh', city: 'Fatehpur / Kaushambi' },
  '221': { state: 'Uttar Pradesh', city: 'Varanasi' },
  '222': { state: 'Uttar Pradesh', city: 'Jaunpur' },
  '223': { state: 'Uttar Pradesh', city: 'Azamgarh' },
  '224': { state: 'Uttar Pradesh', city: 'Ayodhya' },
  '225': { state: 'Uttar Pradesh', city: 'Barabanki' },
  '226': { state: 'Uttar Pradesh', city: 'Lucknow' },
  '227': { state: 'Uttar Pradesh', city: 'Amethi / Raebareli' },
  '228': { state: 'Uttar Pradesh', city: 'Sultanpur' },
  '229': { state: 'Uttar Pradesh', city: 'Raebareli' },
  '230': { state: 'Uttar Pradesh', city: 'Pratapgarh' },
  '231': { state: 'Uttar Pradesh', city: 'Mirzapur' },
  '232': { state: 'Uttar Pradesh', city: 'Chandauli' },
  '233': { state: 'Uttar Pradesh', city: 'Ghazipur' },
  '241': { state: 'Uttar Pradesh', city: 'Hardoi' },
  '242': { state: 'Uttar Pradesh', city: 'Shahjahanpur' },
  '243': { state: 'Uttar Pradesh', city: 'Bareilly' },
  '244': { state: 'Uttar Pradesh', city: 'Moradabad' },
  '245': { state: 'Uttar Pradesh', city: 'Hapur' },
  '246': { state: 'Uttarakhand', city: 'Pauri Garhwal' },
  '247': { state: 'Uttar Pradesh', city: 'Saharanpur' },
  '248': { state: 'Uttarakhand', city: 'Dehradun' },
  '249': { state: 'Uttarakhand', city: 'Haridwar / Rishikesh' },
  '250': { state: 'Uttar Pradesh', city: 'Meerut' },
  '251': { state: 'Uttar Pradesh', city: 'Muzaffarnagar' },
  '261': { state: 'Uttar Pradesh', city: 'Sitapur' },
  '262': { state: 'Uttarakhand', city: 'Udham Singh Nagar / Rudrapur' },
  '263': { state: 'Uttarakhand', city: 'Nainital / Haldwani' },
  '271': { state: 'Uttar Pradesh', city: 'Gonda / Bahraich' },
  '272': { state: 'Uttar Pradesh', city: 'Basti' },
  '273': { state: 'Uttar Pradesh', city: 'Gorakhpur' },
  '274': { state: 'Uttar Pradesh', city: 'Deoria / Kushinagar' },
  '275': { state: 'Uttar Pradesh', city: 'Mau' },
  '276': { state: 'Uttar Pradesh', city: 'Azamgarh' },
  '277': { state: 'Uttar Pradesh', city: 'Ballia' },
  '281': { state: 'Uttar Pradesh', city: 'Mathura' },
  '282': { state: 'Uttar Pradesh', city: 'Agra' },
  '283': { state: 'Uttar Pradesh', city: 'Firozabad' },
  '284': { state: 'Uttar Pradesh', city: 'Jhansi' },
  '285': { state: 'Uttar Pradesh', city: 'Jalaun (Orai)' },
  // Rajasthan
  '301': { state: 'Rajasthan', city: 'Alwar' },
  '302': { state: 'Rajasthan', city: 'Jaipur' },
  '303': { state: 'Rajasthan', city: 'Jaipur Rural' },
  '305': { state: 'Rajasthan', city: 'Ajmer' },
  '306': { state: 'Rajasthan', city: 'Pali' },
  '307': { state: 'Rajasthan', city: 'Sirohi' },
  '311': { state: 'Rajasthan', city: 'Bhilwara' },
  '313': { state: 'Rajasthan', city: 'Udaipur' },
  '321': { state: 'Rajasthan', city: 'Bharatpur' },
  '324': { state: 'Rajasthan', city: 'Kota' },
  '332': { state: 'Rajasthan', city: 'Sikar' },
  '334': { state: 'Rajasthan', city: 'Bikaner' },
  '335': { state: 'Rajasthan', city: 'Sri Ganganagar' },
  '342': { state: 'Rajasthan', city: 'Jodhpur' },
  // Gujarat
  '360': { state: 'Gujarat', city: 'Rajkot' },
  '361': { state: 'Gujarat', city: 'Jamnagar' },
  '363': { state: 'Gujarat', city: 'Morbi / Surendranagar' },
  '364': { state: 'Gujarat', city: 'Bhavnagar' },
  '380': { state: 'Gujarat', city: 'Ahmedabad' },
  '382': { state: 'Gujarat', city: 'Gandhinagar' },
  '388': { state: 'Gujarat', city: 'Anand' },
  '390': { state: 'Gujarat', city: 'Vadodara' },
  '392': { state: 'Gujarat', city: 'Bharuch' },
  '395': { state: 'Gujarat', city: 'Surat' },
  '396': { state: 'Gujarat', city: 'Valsad / Vapi' },
  // Maharashtra & Goa
  '400': { state: 'Maharashtra', city: 'Mumbai' },
  '401': { state: 'Maharashtra', city: 'Thane / Palghar' },
  '402': { state: 'Maharashtra', city: 'Raigad' },
  '403': { state: 'Goa', city: 'Panaji' },
  '410': { state: 'Maharashtra', city: 'Navi Mumbai / Raigad' },
  '411': { state: 'Maharashtra', city: 'Pune' },
  '413': { state: 'Maharashtra', city: 'Solapur' },
  '416': { state: 'Maharashtra', city: 'Kolhapur / Sangli' },
  '421': { state: 'Maharashtra', city: 'Thane / Kalyan' },
  '422': { state: 'Maharashtra', city: 'Nashik' },
  '425': { state: 'Maharashtra', city: 'Jalgaon' },
  '431': { state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar' },
  '440': { state: 'Maharashtra', city: 'Nagpur' },
  '444': { state: 'Maharashtra', city: 'Amravati / Akola' },
  // Madhya Pradesh & Chhattisgarh
  '452': { state: 'Madhya Pradesh', city: 'Indore' },
  '456': { state: 'Madhya Pradesh', city: 'Ujjain' },
  '462': { state: 'Madhya Pradesh', city: 'Bhopal' },
  '474': { state: 'Madhya Pradesh', city: 'Gwalior' },
  '482': { state: 'Madhya Pradesh', city: 'Jabalpur' },
  '486': { state: 'Madhya Pradesh', city: 'Rewa' },
  '492': { state: 'Chhattisgarh', city: 'Raipur' },
  '495': { state: 'Chhattisgarh', city: 'Bilaspur' },
  // Telangana & Andhra Pradesh
  '500': { state: 'Telangana', city: 'Hyderabad' },
  '506': { state: 'Telangana', city: 'Warangal' },
  '517': { state: 'Andhra Pradesh', city: 'Tirupati' },
  '520': { state: 'Andhra Pradesh', city: 'Vijayawada' },
  '522': { state: 'Andhra Pradesh', city: 'Guntur' },
  '530': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
  // Karnataka
  '560': { state: 'Karnataka', city: 'Bengaluru' },
  '570': { state: 'Karnataka', city: 'Mysuru' },
  '575': { state: 'Karnataka', city: 'Mangaluru' },
  '580': { state: 'Karnataka', city: 'Hubballi-Dharwad' },
  '590': { state: 'Karnataka', city: 'Belagavi' },
  // Tamil Nadu & Puducherry
  '600': { state: 'Tamil Nadu', city: 'Chennai' },
  '605': { state: 'Puducherry', city: 'Puducherry' },
  '620': { state: 'Tamil Nadu', city: 'Tiruchirappalli' },
  '625': { state: 'Tamil Nadu', city: 'Madurai' },
  '636': { state: 'Tamil Nadu', city: 'Salem' },
  '641': { state: 'Tamil Nadu', city: 'Coimbatore' },
  // Kerala
  '673': { state: 'Kerala', city: 'Kozhikode' },
  '682': { state: 'Kerala', city: 'Kochi' },
  '695': { state: 'Kerala', city: 'Thiruvananthapuram' },
  // West Bengal & Odisha
  '700': { state: 'West Bengal', city: 'Kolkata' },
  '711': { state: 'West Bengal', city: 'Howrah' },
  '713': { state: 'West Bengal', city: 'Durgapur / Asansol' },
  '734': { state: 'West Bengal', city: 'Siliguri' },
  '744': { state: 'Andaman and Nicobar Islands', city: 'Port Blair' },
  '751': { state: 'Odisha', city: 'Bhubaneswar' },
  '753': { state: 'Odisha', city: 'Cuttack' },
  // North East
  '781': { state: 'Assam', city: 'Guwahati' },
  '790': { state: 'Arunachal Pradesh', city: 'Itanagar' },
  '793': { state: 'Meghalaya', city: 'Shillong' },
  '795': { state: 'Manipur', city: 'Imphal' },
  '796': { state: 'Mizoram', city: 'Aizawl' },
  '797': { state: 'Nagaland', city: 'Kohima / Dimapur' },
  '799': { state: 'Tripura', city: 'Agartala' },
  // Bihar & Jharkhand
  '800': { state: 'Bihar', city: 'Patna' },
  '823': { state: 'Bihar', city: 'Gaya' },
  '834': { state: 'Jharkhand', city: 'Ranchi' },
  '831': { state: 'Jharkhand', city: 'Jamshedpur' },
  '842': { state: 'Bihar', city: 'Muzaffarpur' },
  '812': { state: 'Bihar', city: 'Bhagalpur' }
};

function getStateByTwoDigitPrefix(pin2: number): string {
  if (pin2 === 11) return 'Delhi (NCT)';
  if (pin2 >= 12 && pin2 <= 13) return 'Haryana';
  if (pin2 >= 14 && pin2 <= 15) return 'Punjab';
  if (pin2 === 16) return 'Chandigarh';
  if (pin2 === 17) return 'Himachal Pradesh';
  if (pin2 >= 18 && pin2 <= 19) return 'Jammu and Kashmir';
  if (pin2 >= 20 && pin2 <= 28) return 'Uttar Pradesh';
  if (pin2 >= 30 && pin2 <= 34) return 'Rajasthan';
  if (pin2 >= 36 && pin2 <= 39) return 'Gujarat';
  if (pin2 >= 40 && pin2 <= 44) return 'Maharashtra';
  if (pin2 >= 45 && pin2 <= 48) return 'Madhya Pradesh';
  if (pin2 === 49) return 'Chhattisgarh';
  if (pin2 === 50) return 'Telangana';
  if (pin2 >= 51 && pin2 <= 53) return 'Andhra Pradesh';
  if (pin2 >= 56 && pin2 <= 59) return 'Karnataka';
  if (pin2 >= 60 && pin2 <= 64) return 'Tamil Nadu';
  if (pin2 >= 67 && pin2 <= 69) return 'Kerala';
  if (pin2 >= 70 && pin2 <= 74) return 'West Bengal';
  if (pin2 >= 75 && pin2 <= 77) return 'Odisha';
  if (pin2 === 78) return 'Assam';
  if (pin2 >= 80 && pin2 <= 82) {
    return pin2 >= 81 ? 'Bihar' : 'Bihar';
  }
  if (pin2 >= 83 && pin2 <= 85) return 'Jharkhand';
  return '';
}

export function lookupPincodeSync(pincode: string): PincodeLookupResult | null {
  const clean = pincode.replace(/\D/g, '');
  if (clean.length !== 6) return null;

  const prefix3 = clean.slice(0, 3);
  if (THREE_DIGIT_CITY_MAP[prefix3]) {
    return THREE_DIGIT_CITY_MAP[prefix3];
  }

  // Specific sub-ranges within 20-28 (Noida/Ghaziabad exact prefixes, Agra, Lucknow, etc.)
  const pin2 = Number(clean.slice(0, 2));
  const state = getStateByTwoDigitPrefix(pin2);
  if (state) {
    return { state, city: '' };
  }
  return null;
}

const pincodeApiCache = new Map<string, PincodeLookupResult>();

export async function lookupPincodeAsync(pincode: string): Promise<PincodeLookupResult | null> {
  const clean = pincode.replace(/\D/g, '');
  if (clean.length !== 6) return null;

  const cached = pincodeApiCache.get(clean);
  if (cached) return cached;

  const syncMatch = lookupPincodeSync(clean);

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal
    });
    window.clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      const po = first?.Status === 'Success' && Array.isArray(first.PostOffice) ? first.PostOffice[0] : null;
      if (po) {
        const apiState = normalizeIndianStateName(po.State || '');
        const apiDistrict = (po.District || po.Division || po.Block || '').trim();
        const result: PincodeLookupResult = {
          state: apiState || syncMatch?.state || '',
          city: apiDistrict || syncMatch?.city || ''
        };
        if (result.state || result.city) {
          pincodeApiCache.set(clean, result);
          return result;
        }
      }
    }
  } catch {
    // Silent network fallback to synchronous postal circle lookup
  }

  return syncMatch;
}
