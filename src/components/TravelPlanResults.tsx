import { TravelPlan, PlanningStatus, AgentStatus } from '@/types';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { useTravelStore } from '@/store/useTravelStore';
import Skeleton from 'react-loading-skeleton';
import { useEffect, useState } from 'react';
import { convert, getLastSyncTime, refreshRates } from '@/lib/services/CurrencyService';
import 'tailwindcss/tailwind.css';

interface TravelPlanResultsProps {
  plan: TravelPlan;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  SGD: 'S$',
  ZAR: 'R',
  // ...add more as needed
};
const getCurrencySymbol = (code: string) => {
  if (!code) return '';
  if (!currencySymbols) return code;
  return currencySymbols[code] || code;
};

type BudgetCategory = 'flights' | 'accommodation' | 'activities' | 'visaFees' | 'misc';

// Update the cityToCurrency mapping to ensure Indian cities use INR
const cityToCurrency: Record<string, string> = {
  'HYD': 'INR', 'Hyderabad': 'INR', 'Delhi': 'INR', 'Mumbai': 'INR', 'India': 'INR',
  'New York': 'USD', 'NYC': 'USD', 'JFK': 'USD',
  'London': 'GBP', 'LON': 'GBP',
  'Paris': 'EUR',
  'Tokyo': 'JPY',
  'Sydney': 'AUD',
  'Toronto': 'CAD',
  'Dubai': 'AED',
  'Singapore': 'SGD',
  'Cape Town': 'ZAR',
  // ...add more as needed
};

async function getLocalPrice(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  try {
    return await convert(amount, from, to);
  } catch {
    return amount;
  }
}

export const TravelPlanResults = ({ plan }: TravelPlanResultsProps) => {
  const agents = useTravelStore(state => state.agents);
  const getAgent = (role: string) => agents.find(a => a.role === role);

  // Helper: show skeleton loader if agent is working
  const showSkeleton = (role: string) => getAgent(role)?.status === AgentStatus.WORKING;
  // Helper: show error if agent failed
  const showError = (role: string) => getAgent(role)?.status === AgentStatus.ERROR;
  // Helper: get agent status/task
  const agentStatus = (role: string) => getAgent(role);

  const placeholderImg = 'https://source.unsplash.com/400x250/?hotel,travel';

  // Find best value accommodation (lowest price)
  const bestValueId = (plan.accommodation && plan.accommodation.length > 0)
    ? plan.accommodation.reduce((minId, acc) => {
        const minAcc = plan.accommodation?.find(a => a.id === minId);
        return acc.price < ((minAcc?.price) ?? Infinity) ? acc.id : minId;
      }, plan.accommodation[0].id)
    : null;

  // Helper to convert and cache prices for flights, accommodations, and activities
  const [convertedFlightPrices, setConvertedFlightPrices] = useState<{ [id: string]: number }>({});
  const [convertedAccommodationPrices, setConvertedAccommodationPrices] = useState<{ [id: string]: number }>({});
  const [convertedActivityPrices, setConvertedActivityPrices] = useState<{ [id: string]: number }>({});
  const [showRateWarning, setShowRateWarning] = useState(false);

  // At the top of the component, check for outdated rates and handle refresh
  const [lastSync, setLastSync] = useState(getLastSyncTime());
  const [refreshing, setRefreshing] = useState(false);
  const baseCurrency = plan.budget?.currency || 'USD';

  // Manual refresh handler
  const handleRefreshRates = async () => {
    setRefreshing(true);
    await refreshRates(baseCurrency);
    setLastSync(getLastSyncTime());
    setRefreshing(false);
    // Update warning
    if (Date.now() - getLastSyncTime() > 1000 * 60 * 60 * 24) {
      setShowRateWarning(true);
    } else {
      setShowRateWarning(false);
    }
  };

  // Check for outdated rates and set up periodic auto-refresh (every 12 hours)
  useEffect(() => {
    const checkWarning = () => {
      const sync = getLastSyncTime();
      setLastSync(sync);
      if (sync && Date.now() - sync > 1000 * 60 * 60 * 24) {
        setShowRateWarning(true);
      } else {
        setShowRateWarning(false);
      }
    };
    checkWarning();
    const interval = setInterval(async () => {
      await refreshRates(baseCurrency);
      checkWarning();
    }, 1000 * 60 * 60 * 12); // 12 hours
    return () => clearInterval(interval);
  }, [baseCurrency]);

  useEffect(() => {
    async function convertAll() {
      if (!plan.budget || !plan.budget.currency) return;
      if (plan.flights?.length) {
        const prices: { [id: string]: number } = {};
        for (const flight of plan.flights) {
          prices[flight.id] = Math.round(await convert(flight.price, flight.currency, plan.budget.currency));
        }
        setConvertedFlightPrices(prices);
      }
      if (plan.accommodation?.length) {
        const prices: { [id: string]: number } = {};
        for (const acc of plan.accommodation) {
          prices[acc.id] = Math.round(await convert(acc.price, acc.currency, plan.budget.currency));
        }
        setConvertedAccommodationPrices(prices);
      }
      if (plan.itinerary?.length) {
        const prices: { [id: string]: number } = {};
        for (const day of plan.itinerary) {
          for (const activity of day.activities) {
            if (!activity.price || !activity.currency || !plan.budget.currency) {
              console.error('Missing activity price or currency:', activity);
              continue;
            }
            try {
              prices[activity.id] = Math.round(await convert(activity.price, activity.currency, plan.budget.currency));
            } catch (e) {
              console.error('Currency conversion failed for activity:', activity, e);
            }
          }
        }
        setConvertedActivityPrices(prices);
      }
    }
    convertAll();
  }, [plan.flights?.length, plan.accommodation?.length, plan.itinerary?.length, plan.budget && plan.budget.currency]);

  if (plan.status === PlanningStatus.IN_PROGRESS) {
    return null;
  }

  return (
    <div className="space-y-12 mt-8 p-8 rounded-3xl shadow-2xl bg-gradient-radial from-primary-100 via-white to-secondary-100 min-h-[90vh]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {showRateWarning && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded text-center flex-1">
            ⚠️ Exchange rates may be outdated. Last synced: {new Date(lastSync).toLocaleString()}
          </div>
        )}
        <button
          onClick={handleRefreshRates}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-primary-200 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold shadow transition disabled:opacity-50"
        >
          {refreshing ? (
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></span>
          ) : (
            <span className="mr-2">🔄</span>
          )}
          Refresh Rates
        </button>
      </div>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold font-sans bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent tracking-tight drop-shadow-lg">
          Your Travel Plan
        </h2>
        <p className="mt-2 text-gray-600">
          Here's what we've planned for your trip
        </p>
      </div>

      {/* Itinerary Section */}
      <div id="itinerary">
        <AgentStatusIndicator
          name={agentStatus('ITINERARY_PLANNER')?.name || 'Itinerary'}
          status={agentStatus('ITINERARY_PLANNER')?.status || AgentStatus.IDLE}
          task={agentStatus('ITINERARY_PLANNER')?.currentTask}
        />
        {showSkeleton('ITINERARY_PLANNER') && <Skeleton height={120} count={2} className="mb-4" />}
        {showError('ITINERARY_PLANNER') && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {agentStatus('ITINERARY_PLANNER')?.currentTask || 'An error occurred while fetching itinerary.'}
          </div>
        )}
        {plan.itinerary && plan.itinerary.length > 0 && (
          <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                🗓️
              </span>
              Itinerary
            </h3>
            <div className="space-y-8">
              {plan.itinerary?.map((day, idx) => (
                <div key={day.date} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <h4 className="text-lg font-semibold text-primary-700 mb-2">
                    Day {idx + 1} - {day.date}
                  </h4>
                  {day.activities && day.activities.length > 0 ? (
                    <ul className="space-y-2">
                      {day.activities?.map((activity, aidx) => (
                        <li key={activity.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div>
                              <span className="font-medium text-gray-900">{activity.name}</span>
                              <span className="ml-2 text-xs text-gray-500">({activity.type})</span>
                              <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                              <div className="text-xs text-gray-500 mt-1">{activity.location}</div>
                            </div>
                            <div className="mt-2 md:mt-0 text-right">
                              <span className="text-sm text-gray-700">
                                {activity.startTime} - {activity.endTime}
                              </span>
                              <div className="text-primary-600 font-semibold">
                                {convertedActivityPrices[activity.id] !== undefined && plan.budget && plan.budget.currency
                                  ? `${getCurrencySymbol(plan.budget.currency)} ${convertedActivityPrices[activity.id]}`
                                  : '...'}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500">No activities planned for this day.</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Flights Section - improved UI */}
      <div id="flights">
        <AgentStatusIndicator
          name={agentStatus('FLIGHT_PLANNER')?.name || 'Flights'}
          status={agentStatus('FLIGHT_PLANNER')?.status || AgentStatus.IDLE}
          task={agentStatus('FLIGHT_PLANNER')?.currentTask}
        />
        {showSkeleton('FLIGHT_PLANNER') && <Skeleton height={120} count={2} className="mb-4" />}
        {showError('FLIGHT_PLANNER') && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {agentStatus('FLIGHT_PLANNER')?.currentTask || 'An error occurred while fetching flights.'}
          </div>
        )}
        {plan.flights && plan.flights.length > 0 && (
          <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">✈️</span>
              Flight Itinerary
            </h3>
            {/* Visual route timeline */}
            <div className="flex items-center justify-center mb-6">
              {plan.flights?.map((flight, idx) => (
                <>
                  <div key={flight.id} className="flex flex-col items-center">
                    <span className="font-semibold text-primary-700">{flight.from}</span>
                    <span className="text-xs text-gray-500">{flight.departureTime || 'Dep'}</span>
                  </div>
                  {plan.flights && idx < plan.flights.length - 1 && (
                    <span className="mx-2 text-2xl text-gray-400">→</span>
                  )}
                </>
              ))}
              {plan.flights && plan.flights.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-primary-700">{plan.flights[plan.flights.length - 1]?.to}</span>
                  <span className="text-xs text-gray-500">{plan.flights[plan.flights.length - 1]?.arrivalTime || 'Arr'}</span>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {plan.flights?.map((flight, idx) => (
                <div key={flight.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">{flight.from}</span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-lg font-semibold text-gray-900">{flight.to}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>Dep: {flight.departureTime || '-'}</span>
                        <span>Arr: {flight.arrivalTime || '-'}</span>
                        <span>Airline: {flight.airline}</span>
                        <span>Duration: {flight.duration}</span>
                        <span>{flight.stopCount === 0 ? 'Direct' : `${flight.stopCount} stop(s)`}</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      {flight.price && flight.currency && (
                        <span className="block text-sm text-gray-500">
                          {getCurrencySymbol(flight.currency)} {flight.price} {flight.currency} (local)
                        </span>
                      )}
                      {convertedFlightPrices[flight.id] !== undefined && plan.budget && plan.budget.currency
                        ? <span className="block text-primary-600 font-bold">{getCurrencySymbol(plan.budget.currency)} {convertedFlightPrices[flight.id]} {plan.budget.currency} (your currency)</span>
                        : '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Accommodations Section - improved UI */}
      <div id="accommodation">
        <AgentStatusIndicator
          name={agentStatus('ACCOMMODATION_PLANNER')?.name || 'Accommodations'}
          status={agentStatus('ACCOMMODATION_PLANNER')?.status || AgentStatus.IDLE}
          task={agentStatus('ACCOMMODATION_PLANNER')?.currentTask}
        />
        {showSkeleton('ACCOMMODATION_PLANNER') && <Skeleton height={120} count={2} className="mb-4" />}
        {showError('ACCOMMODATION_PLANNER') && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {agentStatus('ACCOMMODATION_PLANNER')?.currentTask || 'An error occurred while fetching accommodations.'}
          </div>
        )}
        {plan.accommodation && plan.accommodation.length > 0 && (
          <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">🏨</span>
              Accommodations
            </h3>
            <div className="space-y-6">
              {plan.accommodation.map((acc) => (
                <div key={acc.id} className={`border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 ${acc.id === bestValueId ? 'bg-green-50' : ''}`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    <img src={placeholderImg} alt="Hotel" className="w-full md:w-48 h-32 object-cover rounded-2xl mb-4 md:mb-0 shadow-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">{acc.name}</h4>
                        {acc.id === bestValueId && <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs font-semibold">Best Value</span>}
                      </div>
                      <p className="text-sm text-gray-600">{acc.location}</p>
                      <div className="flex flex-wrap gap-2">
                        {acc.amenities.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">{amenity}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={star <= Math.round(acc.rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                        <span className="ml-1 text-sm font-medium text-gray-900">{acc.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      {acc.price && acc.currency && (
                        <span className="block text-sm text-gray-500">
                          {getCurrencySymbol(acc.currency)} {acc.price} {acc.currency} (local)
                        </span>
                      )}
                      {convertedAccommodationPrices[acc.id] !== undefined && plan.budget && plan.budget.currency
                        ? <span className="block text-primary-600 font-bold">{getCurrencySymbol(plan.budget.currency)} {convertedAccommodationPrices[acc.id]} {plan.budget.currency} (your currency)</span>
                        : '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Visa Requirements Section - deduplicate by country */}
      <div id="visa">
        <AgentStatusIndicator
          name={agentStatus('VISA_PLANNER')?.name || 'Visa Requirements'}
          status={agentStatus('VISA_PLANNER')?.status || AgentStatus.IDLE}
          task={agentStatus('VISA_PLANNER')?.currentTask}
        />
        {showSkeleton('VISA_PLANNER') && <Skeleton height={120} count={2} className="mb-4" />}
        {showError('VISA_PLANNER') && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {agentStatus('VISA_PLANNER')?.currentTask || 'An error occurred while fetching visa requirements.'}
          </div>
        )}
        {plan.visaRequirements && plan.visaRequirements.length > 0 && (
          <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
                🛂
              </span>
              Visa Requirements
            </h3>
            <div className="space-y-6">
              {Array.from(new Map(plan.visaRequirements.map(req => [req.country, req])).values()).map((req, index) => (
                <div
                  key={req.country}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        req.required ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {req.required ? 'Visa Required' : 'No Visa Required'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        For travel to {req.country}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Processing Time: {req.processingTime}
                      </p>
                    </div>
                    {req.required && req.documents && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Required Documents:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {req.documents.map((doc: string, idx: number) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {req.notes && req.notes.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Additional Notes:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {req.notes.map((note: string, idx: number) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Budget Summary Section */}
      <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">
            💰
          </span>
          Budget Summary
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-md border border-primary-100 transition-all hover:bg-primary-100/60 hover:scale-105">
                <span className="text-gray-600">Flights</span>
                <span className="font-medium text-gray-900">
                  {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.breakdown?.flights ?? ''}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-md border border-primary-100 transition-all hover:bg-primary-100/60 hover:scale-105">
                <span className="text-gray-600">Accommodation</span>
                <span className="font-medium text-gray-900">
                  {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.breakdown?.accommodation ?? ''}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-md border border-primary-100 transition-all hover:bg-primary-100/60 hover:scale-105">
                <span className="text-gray-600">Activities</span>
                <span className="font-medium text-gray-900">
                  {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.breakdown?.activities ?? ''}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-md border border-primary-100 transition-all hover:bg-primary-100/60 hover:scale-105">
                <span className="text-gray-600">Visa Fees</span>
                <span className="font-medium text-gray-900">
                  {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.breakdown?.visaFees ?? ''}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-md border border-primary-100 transition-all hover:bg-primary-100/60 hover:scale-105">
                <span className="text-gray-600">Miscellaneous</span>
                <span className="font-medium text-gray-900">
                  {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.breakdown?.misc ?? ''}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-900">Total Budget</span>
              <span className="text-3xl font-extrabold text-primary-600 animate-pulse drop-shadow">
                {plan.budget && plan.budget.currency ? `${getCurrencySymbol(plan.budget.currency)} ` : ''}{plan.budget?.total ?? ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Budget Translator Section */}
      <section className="bg-white/60 backdrop-blur-lg shadow-glass rounded-3xl p-10 border-2 border-primary-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="bg-primary-100 text-primary-700 p-2 rounded-lg mr-2">🌐</span>
          Smart Budget Translator
        </h3>
        <p className="mb-4 text-gray-600">See your budget breakdown in both local and your home currency for each destination.</p>
        {plan.preferences?.destinations?.map((dest, idx) => {
          const userCurrency = plan.budget?.currency || 'INR';
          const localCurrency = 'INR'; // Force INR for Indian cities
          const showDualCurrency = userCurrency !== localCurrency;
          const isLocal = [plan.preferences?.travelers?.nationality, plan.preferences?.travelers?.residenceCountry]
            .map(s => s?.toLowerCase().trim()).includes('india');
          
          // Calculate local values for each category
          const getLocalValue = (category: BudgetCategory) => {
            switch (category) {
              case 'flights':
                return plan.flights?.find(f => f.to === dest)?.price || 0;
              case 'accommodation':
                return plan.accommodation?.find(a => a.location.includes(dest))?.price || 0;
              case 'activities':
                return plan.itinerary?.flatMap(day => 
                  day.activities.filter(act => act.location?.includes(dest))
                ).reduce((sum, act) => sum + (act.price || 0), 0) || 0;
              case 'visaFees':
                return isLocal ? 0 : (plan.visaRequirements?.find(v => v.country === dest)?.cost || 0);
              case 'misc':
                return Math.round((plan.budget?.breakdown?.misc || 0) / (plan.preferences?.destinations?.length || 1));
              default:
                return 0;
            }
          };

          // Calculate total budget for this destination
          const totalLocalValue = ['flights', 'accommodation', 'activities', 'visaFees', 'misc']
            .reduce((sum, cat) => sum + getLocalValue(cat as BudgetCategory), 0);

          return (
            <div key={dest} className="mb-8">
              <h4 className="text-lg font-bold text-primary-700 mb-2">{dest}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white/80 rounded-xl shadow border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700">Category</th>
                      {showDualCurrency ? (
                        <>
                          <th className="px-4 py-2 text-left text-gray-700">Local Price (INR)</th>
                          <th className="px-4 py-2 text-left text-gray-700">Your Currency</th>
                        </>
                      ) : (
                        <th className="px-4 py-2 text-left text-gray-700">Price (INR)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(['flights', 'accommodation', 'activities', 'visaFees', 'misc'] as BudgetCategory[]).map((cat) => {
                      const localValue = getLocalValue(cat);
                      return (
                        <tr key={cat} className="border-t">
                          <td className="px-4 py-2 font-medium text-gray-900 capitalize">
                            {cat === 'visaFees' ? 'Visa Fees' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </td>
                          {showDualCurrency ? (
                            <>
                              <td className="px-4 py-2 text-gray-700">
                                {cat === 'visaFees' && isLocal ? (
                                  <span className="text-green-700 font-semibold">No visa required</span>
                                ) : (
                                  <span>₹ {localValue.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-primary-700 font-semibold">
                                {userCurrency !== localCurrency ? (
                                  <span>{getCurrencySymbol(userCurrency)} {localValue.toLocaleString()} {userCurrency}</span>
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-2 text-primary-700 font-semibold">
                              {cat === 'visaFees' && isLocal ? (
                                <span className="text-green-700 font-semibold">No visa required</span>
                              ) : (
                                <span>₹ {localValue.toLocaleString()}</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gray-300 font-bold">
                      <td className="px-4 py-2">Total for {dest}</td>
                      <td className="px-4 py-2 text-primary-700" colSpan={showDualCurrency ? 2 : 1}>
                        ₹ {totalLocalValue.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}; 