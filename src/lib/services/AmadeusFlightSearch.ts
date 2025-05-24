import amadeus from './AmadeusService';
import { getCityCode } from './AmadeusLocationService';

export async function searchAmadeusFlights({
  originCity,
  destinationCity,
  date,
  adults = 1,
  currency = 'INR'
}: {
  originCity: string;
  destinationCity: string;
  date: string;
  adults?: number;
  currency?: string;
}) {
  const originCode = await getCityCode(originCity);
  const destinationCode = await getCityCode(destinationCity);
  if (!originCode || !destinationCode) throw new Error('Invalid city name(s)');

  const response = await amadeus.shopping.flightOffersSearch.get({
    originLocationCode: originCode,
    destinationLocationCode: destinationCode,
    departureDate: date,
    adults,
    currencyCode: currency,
    max: 5,
  });
  return response.data;
} 