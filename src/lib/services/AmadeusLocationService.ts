import axios from 'axios';
import amadeus from './AmadeusService';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_LOCATION_URL = 'https://test.api.amadeus.com/v1/reference-data/locations';

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }
  const response = await axios.post(AMADEUS_AUTH_URL, new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_CLIENT_ID!,
    client_secret: AMADEUS_CLIENT_SECRET!,
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // buffer
  return accessToken;
}

export async function searchLocations(query: string) {
  const token = await getAccessToken();
  const response = await axios.get(AMADEUS_LOCATION_URL, {
    params: {
      keyword: query,
      subType: 'CITY,AIRPORT',
      'page[limit]': 10,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return (response.data.data || []).map((item: any) => ({
    value: item.iataCode,
    label: `${item.name} (${item.iataCode})${item.address && item.address.countryName ? ', ' + item.address.countryName : ''}`,
  }));
}

export async function getCityCode(cityName: string): Promise<string | null> {
  const response = await amadeus.referenceData.locations.get({
    keyword: cityName,
    subType: 'CITY'
  });
  const locations = response.data;
  if (locations && locations.length > 0) {
    return locations[0].iataCode;
  }
  return null;
} 