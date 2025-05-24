import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = req.query.q as string;
  console.log('Received query:', q);
  console.log('AMADEUS_CLIENT_ID:', AMADEUS_CLIENT_ID);
  console.log('AMADEUS_CLIENT_SECRET:', AMADEUS_CLIENT_SECRET ? '***set***' : '***missing***');
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }
  try {
    console.log('About to fetch access token and call Amadeus API...');
    const token = await getAccessToken();
    const response = await axios.get(AMADEUS_LOCATION_URL, {
      params: {
        keyword: q,
        subType: 'CITY,AIRPORT',
        'page[limit]': 10,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const options = (response.data.data || []).map((item: any) => ({
      value: item.iataCode,
      label: `${item.name} (${item.iataCode})${item.address && item.address.countryName ? ', ' + item.address.countryName : ''}`,
    }));
    res.status(200).json(options);
  } catch (error: any) {
    console.error('Amadeus location API error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch locations' });
  }
} 