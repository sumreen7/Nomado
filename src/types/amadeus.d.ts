declare module 'amadeus' {
  interface AmadeusConstructor {
    new (options: {
      clientId: string;
      clientSecret: string;
      hostname?: string;
    }): Amadeus;
    location: {
      city: string;
      airport: string;
    };
  }

  interface Location {
    id: string;
    detailedName: string;
    iataCode: string;
    address: {
      cityName: string;
      countryName: string;
    };
  }

  interface LocationResponse {
    data: Location[];
  }

  interface FlightOffer {
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: Array<{
      duration: string;
      segments: Array<{
        departure: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        arrival: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        carrierCode: string;
        number: string;
        aircraft: {
          code: string;
        };
        operating: {
          carrierCode: string;
        };
        duration: string;
        id: string;
        numberOfStops: number;
        blacklistedInEU: boolean;
      }>;
    }>;
    price: {
      currency: string;
      total: string;
      base: string;
      fees: Array<{
        amount: string;
        type: string;
      }>;
      grandTotal: string;
    };
    pricingOptions: {
      fareType: string[];
      includedCheckedBagsOnly: boolean;
    };
    validatingAirlineCodes: string[];
    travelerPricings: Array<{
      travelerId: string;
      fareOption: string;
      travelerType: string;
      price: {
        currency: string;
        total: string;
        base: string;
      };
      fareDetailsBySegment: Array<{
        segmentId: string;
        cabin: string;
        fareBasis: string;
        class: string;
        includedCheckedBags: {
          quantity: number;
        };
      }>;
    }>;
  }

  interface SearchResponse {
    data: FlightOffer[];
  }

  interface Amadeus {
    shopping: {
      flightOffersSearch: {
        get(params: {
          originLocationCode: string;
          destinationLocationCode: string;
          departureDate: string;
          adults: number;
          children?: number;
          infants?: number;
          travelClass?: string;
          maxPrice?: number;
          currencyCode?: string;
          max?: number;
        }): Promise<SearchResponse>;
      };
    };
    referenceData: {
      locations: {
        get(params: {
          keyword: string;
          subType: string;
        }): Promise<LocationResponse>;
      };
    };
  }

  const Amadeus: AmadeusConstructor;
  export default Amadeus;
} 