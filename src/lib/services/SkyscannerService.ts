import axios from 'axios';
import { FlightOption } from '@/types';

const SKRAPID_API_KEY = process.env.SKYSCRAPER_API_KEY;

export async function searchSkyscannerFlights({
  origin,
  destination,
  date,
  adults = 1,
  currency = 'INR',
}: {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  adults?: number;
  currency?: string;
}) {
  const response = await axios.get('https://skyscanner44.p.rapidapi.com/search', {
    params: {
      origin,
      destination,
      date,
      adults,
      currency,
    },
    headers: {
      'X-RapidAPI-Key': SKRAPID_API_KEY,
      'X-RapidAPI-Host': 'skyscanner44.p.rapidapi.com',
    },
  });
  return response.data;
}

export const cityToIATA: Record<string, string> = {
  Hyderabad: 'HYD',
  Delhi: 'DEL',
  Mumbai: 'BOM',
  Bangalore: 'BLR',
  Chennai: 'MAA',
  Kolkata: 'CCU',
  // ...add more as needed
};

export function mapSkyscannerToFlightObjects(skyscannerData: any, fromCity: string, toCity: string): FlightOption[] {
  if (!skyscannerData.itineraries) return [];
  return skyscannerData.itineraries.map((itinerary: any, idx: number) => ({
    id: itinerary.id || `flight-${idx}`,
    from: fromCity,
    to: toCity,
    price: itinerary.price.amount,
    currency: itinerary.price.currency,
    airline: itinerary.legs[0]?.carriers?.marketing[0]?.name || '',
    departureTime: itinerary.legs[0]?.departure,
    arrivalTime: itinerary.legs[0]?.arrival,
    duration: itinerary.legs[0]?.duration,
    stopCount: itinerary.legs[0]?.stopCount,
  }));
} 