import { AgentRole, AgentStatus, FlightOption, TravelPlan } from '@/types';
import { BaseAgent } from './BaseAgent';
import { BudgetService } from '../services/BudgetService';
import { searchAmadeusFlights } from '../services/AmadeusFlightSearch';

export class FlightPlannerAgent extends BaseAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    super(AgentRole.FLIGHT_PLANNER, 'Flight Planner');
    this.apiKey = apiKey;
  }

  async execute(plan: TravelPlan): Promise<void> {
    await this.updateStatus(AgentStatus.WORKING, 'Searching for flights...');

    try {
      const flights = await this.searchFlights(plan);
      
      // Update the plan with found flights
      plan.flights = this.optimizeFlightOptions(flights, plan);
      
      // Update budget
      BudgetService.updateBudget(plan);
      
      await this.complete();
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  private async searchFlights(plan: TravelPlan): Promise<FlightOption[]> {
    const { origin, destinations, dates, travelers, budget } = plan.preferences;
    const allFlights: FlightOption[] = [];
    for (let i = 0; i < destinations.length; i++) {
      const fromCity = i === 0 ? origin : destinations[i - 1];
      const toCity = destinations[i];
      try {
        const amadeusFlights = await searchAmadeusFlights({
          originCity: fromCity,
          destinationCity: toCity,
          date: dates.start,
          adults: travelers.adults,
          currency: budget.currency || 'INR',
        });
        const flights = amadeusFlights.map((flight: any, idx: number) => ({
          id: flight.id || `flight-${idx}`,
          from: fromCity,
          to: toCity,
          price: Number(flight.price.total),
          currency: flight.price.currency,
          airline: flight.itineraries[0].segments[0].carrierCode,
          departureTime: flight.itineraries[0].segments[0].departure.at,
          arrivalTime: flight.itineraries[0].segments.slice(-1)[0].arrival.at,
          duration: flight.itineraries[0].duration,
          stopCount: flight.itineraries[0].segments.length - 1,
        }));
        allFlights.push(...flights);
      } catch (error) {
        console.error('Amadeus API error:', error);
        const err = error as Error;
        throw new Error(`Amadeus API error for ${fromCity} to ${toCity}: ${err.message || err}`);
      }
    }
    return allFlights;
  }

  private optimizeFlightOptions(flights: FlightOption[], plan: TravelPlan): FlightOption[] {
    // Filter flights based on budget constraints
    const { budget } = plan.preferences;
    
    return flights.filter(flight => {
      // Convert flight price to budget currency if needed
      const flightPrice = flight.price; // TODO: Add currency conversion
      return flightPrice <= budget.max;
    }).sort((a, b) => {
      // Sort by price and stop count
      if (a.price === b.price) {
        return a.stopCount - b.stopCount;
      }
      return a.price - b.price;
    }).slice(0, 5); // Return top 5 options
  }
} 