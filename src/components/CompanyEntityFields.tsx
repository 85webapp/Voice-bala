import React from 'react';
import { WhiteSelect } from './WhiteSelect';
import { AddressFieldGroup } from './AddressFieldGroup';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { CircleIndicator, optionCardClass } from './OptionControl';

export const COMPANY_SUBTYPE_OPTIONS = [
  'Private Limited Company (Pvt Ltd)',
  'Public Limited Company (Ltd)',
  'Limited Liability Partnership (LLP)',
  'Partnership Firm',
  'Joint Owners / Co-Owners',
  'Hindu Undivided Family (HUF)',
  'Trust / Society / AOP',
  'Sole Proprietorship Firm'
];

export const COMPANY_DESIGNATION_OPTIONS = [
  'Authorized Signatory',
  'Managing Director',
  'Director',
  'Designated Partner',
  'Managing Partner',
  'Partner',
  'Proprietor',
  'Karta',
  'Authorized Trustee',
  'President / Secretary',
  'POA Holder',
  'Other'
];

export interface CompanyEntityDetails {
  subType: string;
  regNumber: string; // CIN / LLPIN / Trust Reg / Karta / Joint Owners / Udyam
  gstin: string;
  authLetterDate: string;
  authLetterRef: string;
}

export const DEFAULT_COMPANY_ENTITY_DETAILS: CompanyEntityDetails = {
  subType: 'Private Limited Company (Pvt Ltd)',
  regNumber: '',
  gstin: '',
  authLetterDate: '',
  authLetterRef: ''
};

export function isGstinRequiredForSubType(subType: string): boolean {
  return (
    subType === 'Private Limited Company (Pvt Ltd)' ||
    subType === 'Public Limited Company (Ltd)'
  );
}

export function getCompanyRegFieldMeta(subType: string): {
  label: string;
  placeholder: string;
  required: boolean;
} {
  switch (subType) {
    case 'Limited Liability Partnership (LLP)':
      return {
        label: 'LLPIN (LLP Identification Number)',
        placeholder: 'e.g. AAA-1234',
        required: true
      };
    case 'Private Limited Company (Pvt Ltd)':
    case 'Public Limited Company (Ltd)':
      return {
        label: 'CIN (Company Identification Number)',
        placeholder: 'e.g. U72200DL2020PTC123456',
        required: true
      };
    case 'Trust / Society / AOP':
      return {
        label: 'Trust / Society / AOP Registration Number',
        placeholder: 'e.g. REG/2021/1045',
        required: true
      };
    case 'Joint Owners / Co-Owners':
      return {
        label: 'Joint Owners / Co-Owners Full Names',
        placeholder: 'e.g. Amit Kumar & Priya Kumar',
        required: true
      };
    case 'Hindu Undivided Family (HUF)':
      return {
        label: 'Karta Full Name (HUF Head)',
        placeholder: 'e.g. Shri Suresh Kumar Gupta (Karta)',
        required: true
      };
    case 'Partnership Firm':
      return {
        label: 'Firm Registration / Partnership Deed Number',
        placeholder: 'e.g. ROF/2022/889 (Optional if unregistered)',
        required: false
      };
    default:
      return {
        label: 'Udyam / Business Registration Number',
        placeholder: 'e.g. UDYAM-DL-00-1234567 (Optional)',
        required: false
      };
  }
}

export function isAuthDateRequired(subType: string): boolean {
  return (
    subType === 'Private Limited Company (Pvt Ltd)' ||
    subType === 'Public Limited Company (Ltd)' ||
    subType === 'Limited Liability Partnership (LLP)' ||
    subType === 'Trust / Society / AOP'
  );
}

export function getCompanyFieldLabels(subType: string) {
  switch (subType) {
    case 'Sole Proprietorship Firm':
      return {
        entityNameLabel: 'Business / Firm Name',
        entityNamePlaceholder: 'e.g. Sharma Digital Enterprises',
        signatoryLabel: 'Proprietor Full Legal Name',
        signatoryPlaceholder: 'e.g. Ramesh Kumar Sharma',
        panLabel: 'Proprietor Personal / Business PAN Card',
        addressLabel: 'Business Address',
        incDateLabel: 'Date of Commencement / Registration'
      };
    case 'Partnership Firm':
      return {
        entityNameLabel: 'Partnership Firm Name',
        entityNamePlaceholder: 'e.g. Verma & Associates',
        signatoryLabel: 'Authorized Partner / Signatory Name',
        signatoryPlaceholder: 'e.g. Rajesh Verma',
        panLabel: 'Firm PAN Card',
        addressLabel: 'Principal Place of Business Address',
        incDateLabel: 'Date of Partnership / Incorporation'
      };
    case 'Limited Liability Partnership (LLP)':
      return {
        entityNameLabel: 'Registered LLP Name',
        entityNamePlaceholder: 'e.g. Nexus Legal LLP',
        signatoryLabel: 'Designated Partner / Authorized Signatory Name',
        signatoryPlaceholder: 'e.g. Ananya Mehta',
        panLabel: 'LLP PAN Card',
        addressLabel: 'Registered Office Address of LLP',
        incDateLabel: 'Date of Incorporation'
      };
    case 'Hindu Undivided Family (HUF)':
      return {
        entityNameLabel: 'HUF Name',
        entityNamePlaceholder: 'e.g. Suresh Kumar Gupta HUF',
        signatoryLabel: 'Karta / Authorized Signatory Name',
        signatoryPlaceholder: 'e.g. Suresh Kumar Gupta',
        panLabel: 'HUF PAN Card',
        addressLabel: 'HUF Registered Address',
        incDateLabel: 'Date of HUF Formation'
      };
    case 'Trust / Society / AOP':
      return {
        entityNameLabel: 'Trust / Society / AOP Name',
        entityNamePlaceholder: 'e.g. Navjeevan Welfare Trust',
        signatoryLabel: 'Authorized Trustee / Office Bearer Name',
        signatoryPlaceholder: 'e.g. Dr. Arvind Nair',
        panLabel: 'Trust / Society / AOP PAN Card',
        addressLabel: 'Registered Office Address',
        incDateLabel: 'Date of Registration / Trust Deed'
      };
    case 'Joint Owners / Co-Owners':
      return {
        entityNameLabel: 'Joint Ownership / Group Name',
        entityNamePlaceholder: 'e.g. Amit Kumar & Priya Kumar Joint Holding',
        signatoryLabel: 'Signing Co-Owner / Authorized Representative Name',
        signatoryPlaceholder: 'e.g. Amit Kumar',
        panLabel: 'Primary / Joint PAN Card',
        addressLabel: 'Registered / Communication Address',
        incDateLabel: 'Date of Joint Agreement'
      };
    default:
      return {
        entityNameLabel: 'Registered Company Name',
        entityNamePlaceholder: 'e.g. Acme Media Private Limited',
        signatoryLabel: 'Authorized Signatory Name',
        signatoryPlaceholder: 'e.g. Vikram Malhotra',
        panLabel: 'Company PAN Card',
        addressLabel: 'Registered Office Address of Company',
        incDateLabel: 'Date of Incorporation'
      };
  }
}

export const ENTITY_AUTH_CONFIRM_LABEL =
  'I confirmed I am authorized to sign on behalf of this entity.';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCompanyEntityFields(params: {
  partyLabel: string;
  entityName: string;
  signatoryName: string;
  designation: string;
  customDesignation: string;
  registeredAddress: string;
  email: string;
  mobile: string;
  companyPan: string;
  companyDetails: CompanyEntityDetails;
  entityAuthConfirmed: boolean;
}): string | null {
  const {
    partyLabel,
    entityName,
    signatoryName,
    designation,
    customDesignation,
    registeredAddress,
    email,
    mobile,
    companyPan,
    companyDetails,
    entityAuthConfirmed
  } = params;

  const labels = getCompanyFieldLabels(companyDetails.subType);

  if (!entityName.trim()) {
    return `Please enter ${labels.entityNameLabel} for ${partyLabel}.`;
  }
  const isSoleProp = companyDetails.subType === 'Sole Proprietorship Firm';
  if (isSoleProp && !signatoryName.trim()) {
    return `Please enter Proprietor Full Legal Name for ${partyLabel}.`;
  }
  const regMeta = getCompanyRegFieldMeta(companyDetails.subType);
  if (regMeta.required && !companyDetails.regNumber.trim()) {
    return `Please enter ${regMeta.label} for ${partyLabel}.`;
  }
  const cleanGstin = companyDetails.gstin.trim().toUpperCase();
  const gstinRequired = isGstinRequiredForSubType(companyDetails.subType);
  if (gstinRequired && cleanGstin.length !== 15) {
    return `Please enter a valid 15-character GSTIN Number for ${partyLabel}.`;
  }
  if (!gstinRequired && cleanGstin.length > 0 && cleanGstin.length !== 15) {
    return `If entering GSTIN for ${partyLabel}, please enter all 15 characters.`;
  }
  if (companyPan.trim().length !== 10) {
    return `Please enter a valid 10-character ${labels.panLabel} for ${partyLabel}.`;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return `Please enter a valid Email Address for ${partyLabel}.`;
  }
  if (!registeredAddress.trim()) {
    return `Please enter ${labels.addressLabel} for ${partyLabel}.`;
  }
  if (!signatoryName.trim()) {
    return `Please enter ${labels.signatoryLabel} for ${partyLabel}.`;
  }
  if (!isSoleProp && designation === 'Other' && !customDesignation.trim()) {
    return `Please specify Signatory Designation for ${partyLabel}.`;
  }
  if (mobile.replace(/\D/g, '').length !== 10) {
    return `Please enter a valid 10-digit Mobile Number for ${partyLabel}.`;
  }
  if (isAuthDateRequired(companyDetails.subType) && !companyDetails.authLetterDate.trim()) {
    return `Please select Board Resolution / Authorization Letter Date for ${partyLabel}.`;
  }
  if (!entityAuthConfirmed) {
    return `Please tick "${ENTITY_AUTH_CONFIRM_LABEL}" for ${partyLabel}.`;
  }
  return null;
}

interface CompanyEntityFieldsProps {
  partyLabel: string;
  companyDetails: CompanyEntityDetails;
  onChangeCompanyDetails: (next: CompanyEntityDetails) => void;
  entityName: string;
  onEntityNameChange: (val: string) => void;
  signatoryName: string;
  onSignatoryNameChange: (val: string) => void;
  designation: string;
  onDesignationChange: (val: string) => void;
  customDesignation: string;
  onCustomDesignationChange: (val: string) => void;
  incorporationDate: string;
  onIncorporationDateChange: (val: string) => void;
  registeredAddress: string;
  onRegisteredAddressChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  mobile: string;
  onMobileChange: (val: string) => void;
  companyPan: string;
  onCompanyPanChange: (val: string) => void;
  entityAuthConfirmed: boolean;
  onEntityAuthConfirmedChange: (val: boolean) => void;
  showEntityAuthError?: boolean;
}

export const CompanyEntityFields: React.FC<CompanyEntityFieldsProps> = ({
  partyLabel,
  companyDetails,
  onChangeCompanyDetails,
  entityName,
  onEntityNameChange,
  signatoryName,
  onSignatoryNameChange,
  designation,
  onDesignationChange,
  customDesignation,
  onCustomDesignationChange,
  incorporationDate,
  onIncorporationDateChange,
  registeredAddress,
  onRegisteredAddressChange,
  email,
  onEmailChange,
  mobile,
  onMobileChange,
  companyPan,
  onCompanyPanChange,
  entityAuthConfirmed,
  onEntityAuthConfirmedChange,
  showEntityAuthError = false
}) => {
  const { showExampleDetails, getPlaceholder } = useExampleDetails();
  const regMeta = getCompanyRegFieldMeta(companyDetails.subType);
  const authDateMandatory = isAuthDateRequired(companyDetails.subType);
  const gstinRequired = isGstinRequiredForSubType(companyDetails.subType);
  const isSoleProp = companyDetails.subType === 'Sole Proprietorship Firm';
  const labels = getCompanyFieldLabels(companyDetails.subType);

  const updateDetail = <K extends keyof CompanyEntityDetails>(
    key: K,
    val: CompanyEntityDetails[K]
  ) => {
    onChangeCompanyDetails({ ...companyDetails, [key]: val });
  };

  return (
    <div className="space-y-4">
      {/* Company / Firm Subtype Dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Company / Firm Type <span className="text-red-500 font-bold">*</span>
        </label>
        <WhiteSelect
          value={companyDetails.subType}
          onChange={(val) => updateDetail('subType', val)}
          options={COMPANY_SUBTYPE_OPTIONS}
          aria-label={`${partyLabel} Company or Firm Type`}
        />
      </div>

      {isSoleProp ? (
        <>
          {/* Sole Proprietorship: Proprietor Name & Business/Firm Name separately */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {labels.signatoryLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => onSignatoryNameChange(e.target.value)}
                placeholder={getPlaceholder(labels.signatoryPlaceholder)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {labels.entityNameLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={entityName}
                onChange={(e) => onEntityNameChange(e.target.value)}
                placeholder={getPlaceholder(labels.entityNamePlaceholder)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Proprietor Personal/Business PAN (Single PAN) & Optional GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {labels.panLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={companyPan}
                onChange={(e) =>
                  onCompanyPanChange(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                  )
                }
                placeholder={getPlaceholder('ABCDE1234F')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                maxLength={15}
                value={companyDetails.gstin}
                onChange={(e) =>
                  updateDetail(
                    'gstin',
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
                  )
                }
                placeholder={getPlaceholder('27AABCU9603R1ZM (Optional)')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Udyam / Registration & Commencement Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {regMeta.label} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={companyDetails.regNumber}
                onChange={(e) => updateDetail('regNumber', e.target.value.toUpperCase())}
                placeholder={getPlaceholder(regMeta.placeholder)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <DateOfBirthPicker
                label={labels.incDateLabel}
                value={incorporationDate}
                onChange={onIncorporationDateChange}
                required={false}
                placeholder="DD/MM/YYYY"
                helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
              />
            </div>
          </div>

          {/* Contact Mobile & Mandatory Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={getPlaceholder('proprietor@example.com')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={getPlaceholder('9811122334')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Business Address */}
          <AddressFieldGroup
            label={labels.addressLabel}
            value={registeredAddress}
            onChangeAddress={onRegisteredAddressChange}
            required
          />
        </>
      ) : (
        <>
          {/* Entity Legal Name & Registration / CIN / LLPIN / Karta / Joint Owners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {labels.entityNameLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={entityName}
                onChange={(e) => onEntityNameChange(e.target.value)}
                placeholder={getPlaceholder(labels.entityNamePlaceholder)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {regMeta.label}{' '}
                {regMeta.required ? (
                  <span className="text-red-500 font-bold">*</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Optional)</span>
                )}
              </label>
              <input
                type="text"
                required={regMeta.required}
                value={companyDetails.regNumber}
                onChange={(e) =>
                  updateDetail(
                    'regNumber',
                    companyDetails.subType === 'Joint Owners / Co-Owners' ||
                      companyDetails.subType === 'Hindu Undivided Family (HUF)'
                      ? e.target.value
                      : e.target.value.toUpperCase()
                  )
                }
                placeholder={getPlaceholder(regMeta.placeholder)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Company GSTIN & PAN Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Firm GSTIN Number{' '}
                {gstinRequired ? (
                  <span className="text-red-500 font-bold">*</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Optional)</span>
                )}
              </label>
              <input
                type="text"
                required={gstinRequired}
                maxLength={15}
                value={companyDetails.gstin}
                onChange={(e) =>
                  updateDetail(
                    'gstin',
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
                  )
                }
                placeholder={getPlaceholder('27AABCU9603R1ZM')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {labels.panLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={companyPan}
                onChange={(e) =>
                  onCompanyPanChange(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                  )
                }
                placeholder={getPlaceholder('AABCA1234D')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Date of Incorporation (In Company Details, NOT inside Signatory Box) & Official Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <DateOfBirthPicker
                label={labels.incDateLabel}
                value={incorporationDate}
                onChange={onIncorporationDateChange}
                required={false}
                placeholder="DD/MM/YYYY"
                helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Company / Entity Email <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={getPlaceholder('legal@company.com')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Registered Office Address of Company */}
          <AddressFieldGroup
            label={labels.addressLabel}
            value={registeredAddress}
            onChangeAddress={onRegisteredAddressChange}
            required
          />

          {/* Authorized Signatory Section (No Aadhaar, No Date of Incorporation) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Authorized Signatory &amp; Authorization Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {labels.signatoryLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signatoryName}
                  onChange={(e) => onSignatoryNameChange(e.target.value)}
                  placeholder={getPlaceholder(labels.signatoryPlaceholder)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Signatory Designation <span className="text-red-500">*</span>
                </label>
                <WhiteSelect
                  variant="compact"
                  value={designation}
                  onChange={onDesignationChange}
                  options={COMPANY_DESIGNATION_OPTIONS}
                  aria-label={`${partyLabel} Signatory Designation`}
                />
                {designation === 'Other' && (
                  <input
                    type="text"
                    value={customDesignation}
                    onChange={(e) => onCustomDesignationChange(e.target.value)}
                    placeholder={getPlaceholder('Specify Designation')}
                    className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Mobile Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={mobile}
                  onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={getPlaceholder('9811122334')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Board Resolution / Auth Letter Date{' '}
                  {authDateMandatory ? (
                    <span className="text-red-500 font-bold">*</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  )}
                </label>
                <input
                  type="date"
                  required={authDateMandatory}
                  value={companyDetails.authLetterDate}
                  onChange={(e) => updateDetail('authLetterDate', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorization Ref No. <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={companyDetails.authLetterRef}
                  onChange={(e) => updateDetail('authLetterRef', e.target.value)}
                  placeholder={getPlaceholder('e.g. BR/2026/04')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mandatory Bottom Entity Authorization Confirmation Checkbox */}
      <div className="pt-1 space-y-1.5">
        <label
          className={optionCardClass(
            entityAuthConfirmed,
            showEntityAuthError && !entityAuthConfirmed ? 'border-rose-400 bg-rose-50/40' : ''
          )}
        >
          <input
            type="checkbox"
            checked={entityAuthConfirmed}
            onChange={(e) => onEntityAuthConfirmedChange(e.target.checked)}
            className="sr-only"
          />
          <CircleIndicator checked={entityAuthConfirmed} />
          <span>
            {ENTITY_AUTH_CONFIRM_LABEL} <span className="text-red-500 font-bold">*</span>
          </span>
        </label>
        {showEntityAuthError && !entityAuthConfirmed && (
          <p className="text-xs font-bold text-rose-600">
            Please tick &ldquo;{ENTITY_AUTH_CONFIRM_LABEL}&rdquo; before continuing.
          </p>
        )}
      </div>
    </div>
  );
};
