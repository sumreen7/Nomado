import { useState } from 'react';
import { TravelPreferences } from '@/types';
import { useTravelStore } from '@/store/useTravelStore';
import { AgentCoordinator } from '@/lib/services/AgentCoordinator';
import { logger } from '@/lib/utils/logger';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { searchLocations } from '@/lib/services/AmadeusLocationService';
import debounce from 'lodash.debounce';

const countryList = [
  'United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Singapore', 'UAE', 'South Africa', 'Brazil', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Russia', 'Mexico', 'Turkey', 'Saudi Arabia', 'New Zealand', 'Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam', 'South Korea', 'Argentina', 'Chile', 'Colombia', 'Egypt', 'Nigeria', 'Kenya', 'Greece', 'Portugal', 'Poland', 'Czech Republic', 'Hungary', 'Ireland', 'Belgium', 'Austria', 'Israel', 'Qatar', 'Kuwait', 'Oman', 'Morocco', 'Peru', 'Romania', 'Ukraine', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Iceland', 'Luxembourg', 'Monaco', 'Liechtenstein', 'Estonia', 'Latvia', 'Lithuania', 'Slovakia', 'Slovenia', 'Croatia', 'Bulgaria', 'Serbia', 'Montenegro', 'Albania', 'Georgia', 'Armenia', 'Azerbaijan', 'Jordan', 'Lebanon', 'Cyprus', 'Tunisia', 'Algeria', 'Ethiopia', 'Tanzania', 'Uganda', 'Zimbabwe', 'Botswana', 'Namibia', 'Zambia', 'Mozambique', 'Paraguay', 'Uruguay', 'Bolivia', 'Ecuador', 'Venezuela', 'Panama', 'Costa Rica', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Jamaica', 'Trinidad and Tobago', 'Barbados', 'Bahamas', 'Cuba', 'Dominican Republic', 'Haiti', 'Puerto Rico', 'Greenland', 'Fiji', 'Samoa', 'Tonga', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu', 'Palau', 'Micronesia', 'Marshall Islands', 'Kiribati', 'Tuvalu', 'Timor-Leste', 'Brunei', 'Cambodia', 'Laos', 'Mongolia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Iraq', 'Iran', 'Syria', 'Yemen', 'Palestine', 'Sudan', 'Libya', 'Somalia', 'Chad', 'Mali', 'Niger', 'Burkina Faso', 'Benin', 'Togo', 'Ghana', 'Ivory Coast', 'Senegal', 'Cameroon', 'Congo', 'Gabon', 'Angola', 'Guinea', 'Sierra Leone', 'Liberia', 'Central African Republic', 'Equatorial Guinea', 'Eritrea', 'Djibouti', 'Mauritania', 'Gambia', 'Guinea-Bissau', 'Sao Tome and Principe', 'Comoros', 'Seychelles', 'Cape Verde', 'Lesotho', 'Eswatini', 'South Sudan'];

const currencyList = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' }
];

const cityOptions = [
  { value: 'New York, USA', label: 'New York, USA' },
  { value: 'London, UK', label: 'London, UK' },
  { value: 'Paris, France', label: 'Paris, France' },
  { value: 'Tokyo, Japan', label: 'Tokyo, Japan' },
  { value: 'Sydney, Australia', label: 'Sydney, Australia' },
  { value: 'Toronto, Canada', label: 'Toronto, Canada' },
  { value: 'Dubai, UAE', label: 'Dubai, UAE' },
  { value: 'Singapore, Singapore', label: 'Singapore, Singapore' },
  { value: 'Hong Kong, China', label: 'Hong Kong, China' },
  { value: 'Los Angeles, USA', label: 'Los Angeles, USA' },
  { value: 'San Francisco, USA', label: 'San Francisco, USA' },
  { value: 'Berlin, Germany', label: 'Berlin, Germany' },
  { value: 'Rome, Italy', label: 'Rome, Italy' },
  { value: 'Barcelona, Spain', label: 'Barcelona, Spain' },
  { value: 'Bangkok, Thailand', label: 'Bangkok, Thailand' },
  { value: 'Mumbai, India', label: 'Mumbai, India' },
  { value: 'Cape Town, South Africa', label: 'Cape Town, South Africa' },
  { value: 'Istanbul, Turkey', label: 'Istanbul, Turkey' },
  { value: 'Moscow, Russia', label: 'Moscow, Russia' },
  { value: 'Rio de Janeiro, Brazil', label: 'Rio de Janeiro, Brazil' },
  // ...add more as needed
];

// Debounced fetchLocations for react-select AsyncSelect (Promise-based)
const fetchLocations = debounce(
  async (inputValue: string): Promise<any[]> => {
    if (!inputValue) return [];
    const res = await fetch(`/api/amadeus-locations?q=${encodeURIComponent(inputValue)}`);
    if (!res.ok) return [];
    return await res.json();
  },
  600
);

// Add this helper function at the top level
const getCurrencySymbol = (code: string) => {
  const currency = currencyList.find(c => c.code === code);
  return currency?.symbol || code;
};

// Add a flag map for currency codes
const currencyFlags: Record<string, string> = {
  USD: '🇺🇸',
  INR: '🇮🇳',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CNY: '🇨🇳',
  SGD: '🇸🇬',
  ZAR: '🇿��',
};

export const TravelPreferencesForm = () => {
  const initializePlan = useTravelStore(state => state.initializePlan);
  const [coordinator] = useState(() => new AgentCoordinator(useTravelStore));
  
  const [formData, setFormData] = useState<TravelPreferences>({
    budget: {
      min: 1000,
      max: 5000,
      currency: '',
    },
    dates: {
      start: '',
      end: '',
      isFlexible: false,
    },
    origin: '',
    destinations: [],
    travelStyle: [],
    activities: [],
    accommodation: {
      type: [],
      preferences: [],
      stayType: 'private',
      minRating: 4,
    },
    travelers: {
      adults: 1,
      children: 0,
      nationality: '',
      residenceCountry: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.destinations.length) {
      logger.error('Form validation failed: No destinations provided');
      alert('Please enter at least one destination');
      return;
    }
    if (!formData.dates.start || !formData.dates.end) {
      logger.error('Form validation failed: No travel dates provided');
      alert('Please select travel dates');
      return;
    }
    if (!formData.travelStyle.length) {
      logger.error('Form validation failed: No travel style selected');
      alert('Please select at least one travel style');
      return;
    }
    if (!formData.activities.length) {
      logger.error('Form validation failed: No activities selected');
      alert('Please select at least one activity type');
      return;
    }
    if (!formData.travelers.nationality) {
      logger.error('Form validation failed: No nationality provided');
      alert('Please enter your nationality');
      return;
    }
    if (!formData.travelers.residenceCountry) {
      logger.error('Form validation failed: No country of residence provided');
      alert('Please enter your country of residence');
      return;
    }
    if (!formData.budget.currency) {
      logger.error('Form validation failed: No currency selected');
      alert('Please select a currency');
      return;
    }

    try {
      logger.log('Starting travel planning with preferences:', formData);
      initializePlan(formData);
      const plan = useTravelStore.getState().currentPlan;
      if (plan) {
        await coordinator.startPlanning(plan);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      logger.error('Error during travel planning:', error);
      alert('An error occurred while planning your trip. Please try again.');
    }
  };

  const handleInputChange = (
    field: keyof TravelPreferences,
    value: any,
    nestedField?: string
  ) => {
    setFormData(prev => {
      if (nestedField) {
        return {
          ...prev,
          [field]: {
            ...(prev[field] as Record<string, any>),
            [nestedField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 bg-gradient-radial from-primary-100 via-white to-secondary-100 min-h-[90vh] rounded-3xl shadow-2xl flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-8 w-full animate-fade-in">
        <div className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold font-sans bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent tracking-tight drop-shadow-lg">
              Plan Your Dream Trip
            </h2>
            <p className="mt-2 text-gray-600 text-lg">
              Tell us about your travel preferences and let our AI plan the perfect itinerary
            </p>
          </div>

          {/* Budget Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  💰
                </span>
                Budget
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.budget.currency}
                    onChange={(e) => handleInputChange('budget', e.target.value, 'currency')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select currency...</option>
                    {currencyList.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currencyFlags[currency.code] || ''} {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Budget
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      {getCurrencySymbol(formData.budget.currency)}
                    </span>
                    <input
                      type="number"
                      value={formData.budget.min}
                      onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0, 'min')}
                      className="pl-7 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Budget
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      {getCurrencySymbol(formData.budget.currency)}
                    </span>
                    <input
                      type="number"
                      value={formData.budget.max}
                      onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0, 'max')}
                      className="pl-7 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  📅
                </span>
                Travel Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.dates.start}
                    onChange={(e) => handleInputChange('dates', e.target.value, 'start')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.dates.end}
                    onChange={(e) => handleInputChange('dates', e.target.value, 'end')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dates.isFlexible}
                    onChange={(e) => handleInputChange('dates', e.target.checked, 'isFlexible')}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    I'm flexible with these dates
                  </span>
                </label>
              </div>
            </div>

            {/* Locations Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  🌍
                </span>
                Locations
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Where are you traveling from?
                  </label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={fetchLocations}
                    defaultOptions
                    value={formData.origin ? { value: formData.origin, label: formData.origin } : null}
                    onChange={opt => handleInputChange('origin', opt ? opt.value : '')}
                    placeholder="Select your city or airport of departure..."
                    isClearable
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Where would you like to go?
                  </label>
                  <AsyncSelect
                    isMulti
                    cacheOptions
                    loadOptions={fetchLocations}
                    defaultOptions
                    value={formData.destinations.map(dest => ({ value: dest, label: dest }))}
                    onChange={opts => handleInputChange('destinations', opts ? opts.map(opt => opt.value) : [])}
                    placeholder="Select your destination cities or airports..."
                    classNamePrefix="react-select"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Separate multiple destinations with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Style Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  ✈️
                </span>
                Travel Style
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What kind of traveler are you?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Adventure', 'Culture', 'Relaxation', 'Food', 'Nature', 'Shopping'].map((style) => (
                      <label
                        key={style}
                        className={`
                          relative flex items-center justify-center p-4 rounded-lg border cursor-pointer
                          ${formData.travelStyle.includes(style)
                            ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500'
                            : 'bg-white border-gray-200 hover:bg-gray-50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.travelStyle.includes(style)}
                          onChange={(e) => {
                            const newStyles = e.target.checked
                              ? [...formData.travelStyle, style]
                              : formData.travelStyle.filter(s => s !== style);
                            handleInputChange('travelStyle', newStyles);
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {style}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activities Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  🎯
                </span>
                Preferred Activities
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What activities interest you?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Sightseeing', 'Museum', 'Food Tour', 'Adventure', 'Cultural', 'Shopping', 'Beach', 'Hiking', 'Nightlife'].map((activity) => (
                      <label
                        key={activity}
                        className={`
                          relative flex items-center justify-center p-4 rounded-lg border cursor-pointer
                          ${formData.activities.includes(activity.toLowerCase())
                            ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500'
                            : 'bg-white border-gray-200 hover:bg-gray-50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.activities.includes(activity.toLowerCase())}
                          onChange={(e) => {
                            const newActivities = e.target.checked
                              ? [...formData.activities, activity.toLowerCase()]
                              : formData.activities.filter(a => a !== activity.toLowerCase());
                            handleInputChange('activities', newActivities);
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {activity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  🏨
                </span>
                Accommodation
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred accommodation types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Hotel', 'Hostel', 'Apartment', 'Resort', 'Boutique', 'Villa'].map((type) => (
                      <label
                        key={type}
                        className={`
                          relative flex items-center justify-center p-4 rounded-lg border cursor-pointer
                          ${formData.accommodation.type.includes(type)
                            ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500'
                            : 'bg-white border-gray-200 hover:bg-gray-50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.accommodation.type.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...formData.accommodation.type, type]
                              : formData.accommodation.type.filter(t => t !== type);
                            handleInputChange('accommodation', newTypes, 'type');
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rating
                  </label>
                  <select
                    value={formData.accommodation.minRating}
                    onChange={(e) => handleInputChange('accommodation', parseInt(e.target.value), 'minRating')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    {[3, 3.5, 4, 4.5, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} ⭐ and above
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Travelers Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                  👥
                </span>
                Travelers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adults
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travelers.adults}
                    onChange={(e) => handleInputChange('travelers', Math.max(1, parseInt(e.target.value) || 1), 'adults')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.travelers.children}
                    onChange={(e) => handleInputChange('travelers', Math.max(0, parseInt(e.target.value) || 0), 'children')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <select
                    value={formData.travelers.nationality}
                    onChange={(e) => handleInputChange('travelers', e.target.value, 'nationality')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select nationality...</option>
                    {countryList.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Residence
                  </label>
                  <select
                    value={formData.travelers.residenceCountry}
                    onChange={(e) => handleInputChange('travelers', e.target.value, 'residenceCountry')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select country of residence...</option>
                    {countryList.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="mr-2">Plan My Trip</span>
              <span>✈️</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}; 