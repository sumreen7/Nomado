import { VisaRequirement } from '@/types';
import { VisaType } from './VisaService';

interface VisaFee {
  cost: number;
  currency: string;
}

interface CountryInfo {
  currency: string;
  visaCost: number;
  isEU: boolean;
  processingTime: string;
  maxStay: number;
  specialCases?: {
    countries: string[];
    visaFree: boolean;
    maxStay?: number;
    notes?: string[];
  }[];
}

export class MockVisaService {
  private static instance: MockVisaService;
  
  private constructor() {}

  public static getInstance(): MockVisaService {
    if (!MockVisaService.instance) {
      MockVisaService.instance = new MockVisaService();
    }
    return MockVisaService.instance;
  }

  private getCountryInfo(country: string): CountryInfo {
    // Define country-specific information including local currencies and special cases
    const countryMap: { [key: string]: CountryInfo } = {
      'USA': {
        currency: 'USD',
        visaCost: 160,
        isEU: false,
        processingTime: '3-5 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['Canada', 'UK', 'Australia', 'New Zealand', 'Japan'],
            visaFree: true,
            maxStay: 90,
            notes: ['ESTA required for tourism']
          }
        ]
      },
      'UK': {
        currency: 'GBP',
        visaCost: 95,
        isEU: false,
        processingTime: '3-4 weeks',
        maxStay: 180,
        specialCases: [
          {
            countries: ['USA', 'Canada', 'Australia', 'New Zealand', 'Japan'],
            visaFree: true,
            maxStay: 180
          }
        ]
      },
      'France': {
        currency: 'EUR',
        visaCost: 80,
        isEU: true,
        processingTime: '15 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['USA', 'Canada', 'Australia', 'Japan'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'Germany': {
        currency: 'EUR',
        visaCost: 80,
        isEU: true,
        processingTime: '2-3 weeks',
        maxStay: 90
      },
      'Italy': {
        currency: 'EUR',
        visaCost: 80,
        isEU: true,
        processingTime: '15 business days',
        maxStay: 90
      },
      'Spain': {
        currency: 'EUR',
        visaCost: 80,
        isEU: true,
        processingTime: '15 business days',
        maxStay: 90
      },
      'Australia': {
        currency: 'AUD',
        visaCost: 150,
        isEU: false,
        processingTime: '15-20 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['New Zealand'],
            visaFree: true,
            maxStay: -1, // Unlimited stay
            notes: ['Special Category visa automatically granted']
          }
        ]
      },
      'Canada': {
        currency: 'CAD',
        visaCost: 100,
        isEU: false,
        processingTime: '10-20 business days',
        maxStay: 180,
        specialCases: [
          {
            countries: ['USA'],
            visaFree: true,
            maxStay: 180
          }
        ]
      },
      'Japan': {
        currency: 'JPY',
        visaCost: 6000,
        isEU: false,
        processingTime: '5-7 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['USA', 'Canada', 'Australia', 'UK', 'EU'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'China': {
        currency: 'CNY',
        visaCost: 956,
        isEU: false,
        processingTime: '4-7 business days',
        maxStay: 30
      },
      'India': {
        currency: 'INR',
        visaCost: 6000,
        isEU: false,
        processingTime: '5-7 business days',
        maxStay: 180,
        specialCases: [
          {
            countries: ['Japan'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'Switzerland': {
        currency: 'CHF',
        visaCost: 80,
        isEU: false,
        processingTime: '10-15 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['EU'],
            visaFree: true,
            maxStay: 90,
            notes: ['Part of Schengen Area']
          }
        ]
      },
      'Norway': {
        currency: 'NOK',
        visaCost: 600,
        isEU: false,
        processingTime: '15 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['EU'],
            visaFree: true,
            maxStay: 90,
            notes: ['Part of Schengen Area']
          }
        ]
      },
      'Sweden': {
        currency: 'SEK',
        visaCost: 800,
        isEU: true,
        processingTime: '15 business days',
        maxStay: 90
      },
      'Denmark': {
        currency: 'DKK',
        visaCost: 450,
        isEU: true,
        processingTime: '15 business days',
        maxStay: 90
      },
      'Singapore': {
        currency: 'SGD',
        visaCost: 150,
        isEU: false,
        processingTime: '3-5 business days',
        maxStay: 30,
        specialCases: [
          {
            countries: ['USA', 'EU', 'UK', 'Canada', 'Australia', 'Japan'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'UAE': {
        currency: 'AED',
        visaCost: 500,
        isEU: false,
        processingTime: '3-4 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['USA', 'UK', 'EU'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'Brazil': {
        currency: 'BRL',
        visaCost: 400,
        isEU: false,
        processingTime: '5-10 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['EU'],
            visaFree: true,
            maxStay: 90
          }
        ]
      },
      'South Africa': {
        currency: 'ZAR',
        visaCost: 1800,
        isEU: false,
        processingTime: '5-10 business days',
        maxStay: 90
      },
      'New Zealand': {
        currency: 'NZD',
        visaCost: 170,
        isEU: false,
        processingTime: '15-20 business days',
        maxStay: 90,
        specialCases: [
          {
            countries: ['Australia'],
            visaFree: true,
            maxStay: -1, // Unlimited stay
            notes: ['Resident visa available on arrival']
          }
        ]
      }
    };

    return countryMap[country] || {
      currency: 'USD',
      visaCost: 160,
      isEU: false,
      processingTime: '15-20 business days',
      maxStay: 90
    };
  }

  // Helper to check if travel is domestic US (handles city/airport codes)
  private isDomesticUS(nationality: string, residenceCountry: string, destination: string): boolean {
    const usAliases = ['usa', 'us', 'united states', 'united states of america'];
    const usCitiesOrAirports = [
      'new york', 'nyc', 'jfk', 'lga', 'ewr',
      'dallas', 'dfw', 'dal',
      'los angeles', 'la', 'lax',
      'chicago', 'ord', 'mdw',
      'san francisco', 'sfo',
      'miami', 'mia',
      'houston', 'iah', 'hou',
      'atlanta', 'atl',
      'boston', 'bos',
      'washington', 'iad', 'dca',
      'seattle', 'sea',
      'denver', 'den',
      'las vegas', 'las',
      'orlando', 'mco',
      'philadelphia', 'phl',
      'phoenix', 'phx',
      'san diego', 'san',
      'detroit', 'dtw',
      'minneapolis', 'msp',
      'charlotte', 'clt',
      'tampa', 'tpa',
      'portland', 'pdx',
      'salt lake city', 'slc',
      'st louis', 'stl',
      'baltimore', 'bwi',
      'san jose', 'sjc',
      'austin', 'aus',
      'fort lauderdale', 'fll',
      'dallas-fort worth', 'dallas/fort worth',
    ];
    const norm = (s: string) => s.trim().toLowerCase();
    const isUSNational = usAliases.includes(norm(nationality)) || usAliases.includes(norm(residenceCountry));
    const isUSDestination = usAliases.includes(norm(destination)) || usCitiesOrAirports.includes(norm(destination));
    return isUSNational && isUSDestination;
  }

  public async checkVisaRequirements(
    nationality: string,
    residenceCountry: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<VisaRequirement> {
    // Domestic US travel: no visa required for anyone already in the US
    const usAliases = ['usa', 'us', 'united states', 'united states of america'];
    const usCitiesOrAirports = [
      'new york', 'nyc', 'jfk', 'lga', 'ewr',
      'dallas', 'dfw', 'dal',
      'los angeles', 'la', 'lax',
      'chicago', 'ord', 'mdw',
      'san francisco', 'sfo',
      'miami', 'mia',
      'houston', 'iah', 'hou',
      'atlanta', 'atl',
      'boston', 'bos',
      'washington', 'iad', 'dca',
      'seattle', 'sea',
      'denver', 'den',
      'las vegas', 'las',
      'orlando', 'mco',
      'philadelphia', 'phl',
      'phoenix', 'phx',
      'san diego', 'san',
      'detroit', 'dtw',
      'minneapolis', 'msp',
      'charlotte', 'clt',
      'tampa', 'tpa',
      'portland', 'pdx',
      'salt lake city', 'slc',
      'st louis', 'stl',
      'baltimore', 'bwi',
      'san jose', 'sjc',
      'austin', 'aus',
      'fort lauderdale', 'fll',
      'dallas-fort worth', 'dallas/fort worth',
    ];
    const norm = (s: string) => s.trim().toLowerCase();
    const isUSOrigin = usAliases.includes(norm(nationality)) || usAliases.includes(norm(residenceCountry)) || usAliases.includes(norm(destination)) || usCitiesOrAirports.includes(norm(destination));
    const isUSDestination = usAliases.includes(norm(destination)) || usCitiesOrAirports.includes(norm(destination));
    if (isUSOrigin && isUSDestination) {
      return {
        country: destination,
        required: false,
        type: visaType,
        processingTime: 'N/A',
        cost: 0,
        currency: 'USD',
        documents: ['Valid ID', 'Proof of immigration status (e.g., visa, I-94, permit)'],
        notes: [
          'No visa required for domestic travel within the U.S.',
          'You must carry valid identification and proof of your immigration status.'
        ],
        maxStay: -1
      };
    }
    // Domestic travel: no visa required
    if (
      nationality.toLowerCase() === destination.toLowerCase() ||
      residenceCountry.toLowerCase() === destination.toLowerCase() ||
      this.isDomesticUS(nationality, residenceCountry, destination)
    ) {
      return {
        country: destination,
        required: false,
        type: visaType,
        processingTime: 'N/A',
        cost: 0,
        currency: 'USD',
        documents: ['Valid ID'],
        notes: ['No visa required for domestic travel'],
        maxStay: -1
      };
    }
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const originCountry = this.getCountryInfo(nationality);
    const destCountry = this.getCountryInfo(destination);

    // Check for special cases first
    const specialCase = destCountry.specialCases?.find(
      sc => sc.countries.includes(nationality) || 
           (sc.countries.includes('EU') && originCountry.isEU)
    );

    if (specialCase?.visaFree) {
      return {
        country: destination,
        required: false,
        type: visaType,
        processingTime: 'N/A',
        cost: 0,
        currency: destCountry.currency,
        documents: ['Valid passport'],
        notes: [
          `No visa required for stays up to ${specialCase.maxStay === -1 ? 'unlimited time' : specialCase.maxStay + ' days'}`,
          ...(specialCase.notes || [])
        ],
        maxStay: specialCase.maxStay || 90
      };
    }

    // No visa required if both countries are in EU
    if (originCountry.isEU && destCountry.isEU) {
      return {
        country: destination,
        required: false,
        type: visaType,
        processingTime: 'N/A',
        cost: 0,
        currency: destCountry.currency,
        documents: ['Valid passport or EU ID card'],
        notes: ['No visa required for EU citizens'],
        maxStay: -1 // Unlimited stay within EU
      };
    }

    // Default case - visa required
    return {
      country: destination,
      required: true,
      type: visaType,
      processingTime: destCountry.processingTime,
      cost: destCountry.visaCost,
      currency: destCountry.currency,
      documents: [
        'Valid passport',
        'Completed visa application form',
        'Proof of accommodation',
        'Return flight tickets',
        'Bank statements',
        'Travel insurance',
        'Passport photos',
        'Employment verification'
      ],
      notes: [
        'Passport must be valid for at least 6 months beyond intended stay',
        'Apply at least 1 month before travel date',
        `Maximum stay of ${destCountry.maxStay} days`
      ],
      maxStay: destCountry.maxStay
    };
  }

  public async getVisaProcessingTime(
    nationality: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const destCountry = this.getCountryInfo(destination);
    return destCountry.processingTime;
  }

  public async getVisaFee(
    nationality: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<VisaFee> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const destCountry = this.getCountryInfo(destination);
    return {
      cost: destCountry.visaCost,
      currency: destCountry.currency
    };
  }
} 