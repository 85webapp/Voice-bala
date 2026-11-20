import React from 'react';
import { Compass } from 'lucide-react';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { WhiteSelect } from './WhiteSelect';
import { CircleIndicator } from './OptionControl';

export type BoundaryPlaceType = 'Home' | 'Road' | 'Blank Plot' | 'Others';

export interface SingleBoundaryValue {
  placeType: BoundaryPlaceType | '';
  ownerName: string;
  categoryLabel: string;
  roadSizeFeet: string;
}

export interface PropertyBoundariesState {
  east: SingleBoundaryValue;
  west: SingleBoundaryValue;
  north: SingleBoundaryValue;
  south: SingleBoundaryValue;
}

export const createEmptyBoundaryValue = (): SingleBoundaryValue => ({
  placeType: '',
  ownerName: '',
  categoryLabel: '',
  roadSizeFeet: ''
});

export const createInitialPropertyBoundaries = (): PropertyBoundariesState => ({
  east: createEmptyBoundaryValue(),
  west: createEmptyBoundaryValue(),
  north: createEmptyBoundaryValue(),
  south: createEmptyBoundaryValue()
});

export function formatSingleBoundary(b: SingleBoundaryValue): string {
  if (!b.placeType) return '';
  if (b.placeType === 'Road') {
    const size = b.roadSizeFeet.trim();
    const cat = b.categoryLabel.trim() || 'Road';
    return size ? `${size} Ft ${cat}` : cat;
  }
  const owner = b.ownerName.trim();
  const cat = b.categoryLabel.trim() || b.placeType;
  if (owner && cat) return `${cat} (${owner})`;
  return owner || cat;
}

export function isBoundarySideFilled(b: SingleBoundaryValue): boolean {
  if (!b.placeType) return false;
  if (b.placeType === 'Road') {
    return b.roadSizeFeet.trim().length > 0;
  }
  return b.ownerName.trim().length > 0;
}

export function areAllBoundariesFilled(bounds: PropertyBoundariesState): boolean {
  return (
    isBoundarySideFilled(bounds.east) &&
    isBoundarySideFilled(bounds.west) &&
    isBoundarySideFilled(bounds.north) &&
    isBoundarySideFilled(bounds.south)
  );
}

interface PropertyBoundariesSectionProps {
  title?: string;
  subtitle?: string;
  value: PropertyBoundariesState;
  onChange: (next: PropertyBoundariesState) => void;
  showOptionalToggle?: boolean;
  isOptional?: boolean;
  onToggleOptional?: (optional: boolean) => void;
  className?: string;
}

const DIRECTIONS: Array<{ key: keyof PropertyBoundariesState; label: string }> = [
  { key: 'east', label: 'East' },
  { key: 'west', label: 'West' },
  { key: 'north', label: 'North' },
  { key: 'south', label: 'South' }
];

export const PropertyBoundariesSection: React.FC<PropertyBoundariesSectionProps> = ({
  title = 'Property Boundaries',
  subtitle = 'Specify what sits on the East, West, North, and South sides of the property.',
  value,
  onChange,
  showOptionalToggle = false,
  isOptional = false,
  onToggleOptional,
  className = ''
}) => {
  const { getPlaceholder } = useExampleDetails();

  const updateDirectionType = (dir: keyof PropertyBoundariesState, placeType: BoundaryPlaceType | '') => {
    const prev = value[dir];
    const nextItem: SingleBoundaryValue = {
      placeType,
      ownerName: placeType === 'Road' ? '' : prev.ownerName,
      categoryLabel: placeType || '',
      roadSizeFeet: placeType === 'Road' ? prev.roadSizeFeet : ''
    };
    onChange({ ...value, [dir]: nextItem });
  };

  const updateDirectionField = (
    dir: keyof PropertyBoundariesState,
    field: keyof SingleBoundaryValue,
    val: string
  ) => {
    onChange({
      ...value,
      [dir]: {
        ...value[dir],
        [field]: val
      }
    });
  };

  return (
    <div className={`space-y-3 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <div className="flex items-start gap-2">
          <Compass className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
              {title}{' '}
              {!isOptional ? (
                <span className="text-red-500 font-bold">*</span>
              ) : (
                <span className="text-slate-400 font-normal lowercase">(optional)</span>
              )}
            </span>
            {subtitle && (
              <span className="text-[11px] text-slate-500 block mt-0.5">{subtitle}</span>
            )}
          </div>
        </div>

        {showOptionalToggle && onToggleOptional && (
          <label
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shrink-0 select-none transition-colors ${
              isOptional ? 'bg-blue-50/75 text-slate-900' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={isOptional}
              onChange={(e) => onToggleOptional(e.target.checked)}
              className="sr-only"
            />
            <CircleIndicator checked={isOptional} />
            <span>Change to Optional</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DIRECTIONS.map(({ key, label }) => {
          const item = value[key];
          return (
            <div
              key={key}
              className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  {label} Side {!isOptional && <span className="text-red-500">*</span>}
                </label>
                <WhiteSelect
                  variant="compact"
                  value={item.placeType}
                  onChange={(val) => updateDirectionType(key, val as BoundaryPlaceType | '')}
                  placeholder="Select Boundary Type"
                  options={[
                    { value: 'Home', label: 'Home' },
                    { value: 'Road', label: 'Road' },
                    { value: 'Blank Plot', label: 'Blank Plot' },
                    { value: 'Others', label: 'Others' }
                  ]}
                  aria-label={`${label} Side Boundary Type`}
                />
              </div>

              {item.placeType === 'Road' && (
                <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Road Size in Feet {!isOptional && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={item.roadSizeFeet}
                      onChange={(e) => updateDirectionField(key, 'roadSizeFeet', e.target.value)}
                      placeholder={getPlaceholder('e.g. 20 Ft')}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.categoryLabel || 'Road'}
                      onChange={(e) => updateDirectionField(key, 'categoryLabel', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {item.placeType && item.placeType !== 'Road' && (
                <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Name of Owner {!isOptional && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={item.ownerName}
                      onChange={(e) => updateDirectionField(key, 'ownerName', e.target.value)}
                      placeholder={getPlaceholder('Enter Owner Name')}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.categoryLabel || item.placeType}
                      onChange={(e) => updateDirectionField(key, 'categoryLabel', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
