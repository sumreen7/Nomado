export const API_CONFIG = {
  TRAVELDOC: {
    API_KEY: process.env.NEXT_PUBLIC_TRAVELDOC_API_KEY || '',
    BASE_URL: 'https://api.traveldoc.com/v1'
  }
};

export function validateApiConfig() {
  if (!API_CONFIG.TRAVELDOC.API_KEY) {
    throw new Error('Traveldoc API key is not configured. Please set NEXT_PUBLIC_TRAVELDOC_API_KEY in your environment variables.');
  }
} 