import Amadeus from 'amadeus';
import { FlightOption } from '@/types';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

export default amadeus;

export class AmadeusService {
  private amadeus: Amadeus;

  constructor() {
    this.amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID || '',
      clientSecret: process.env.AMADEUS_CLIENT_SECRET || ''
    });
  }

  async searchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    adults: number,
    children: number,
    currencyCode: string = 'USD'
  ): Promise<FlightOption[]> {
    try {
      const response = await this.amadeus.shopping.flightOffersSearch.get({
        originLocationCode: await this.getIATACode(origin),
        destinationLocationCode: await this.getIATACode(destination),
        departureDate,
        adults,
        children,
        currencyCode,
        max: 5
      });

      return this.mapAmadeusResponseToFlightOptions(response.data);
    } catch (error) {
      console.error('Amadeus API Error:', error);
      throw new Error('Failed to search flights');
    }
  }

  private async getIATACode(cityName: string): Promise<string> {
    try {
      const response = await this.amadeus.referenceData.locations.get({
        keyword: cityName,
        subType: Amadeus.location.city
      });

      if (response.data[0]?.iataCode) {
        return response.data[0].iataCode;
      }
      throw new Error(`No IATA code found for ${cityName}`);
    } catch (error) {
      console.error('Error getting IATA code:', error);
      throw error;
    }
  }

  private mapAmadeusResponseToFlightOptions(amadeusFlights: any[]): FlightOption[] {
    return amadeusFlights.map(flight => {
      const firstSegment = flight.itineraries[0].segments[0];
      const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];

      return {
        id: flight.id,
        from: firstSegment.departure.iataCode,
        to: lastSegment.arrival.iataCode,
        departureTime: firstSegment.departure.at,
        arrivalTime: lastSegment.arrival.at,
        airline: firstSegment.carrierCode,
        price: flight.price.total,
        currency: flight.price.currency,
        stopCount: flight.itineraries[0].segments.length - 1,
        duration: flight.itineraries[0].duration
      };
    });
  }
} 