import { AgentRole, AgentStatus, AccommodationOption, TravelPlan } from '@/types';
import { BaseAgent } from './BaseAgent';
import { BudgetService } from '../services/BudgetService';

export class AccommodationAgent extends BaseAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    super(AgentRole.ACCOMMODATION_PLANNER, 'Accommodation Planner');
    this.apiKey = apiKey;
  }

  async execute(plan: TravelPlan): Promise<void> {
    await this.updateStatus(AgentStatus.WORKING, 'Searching for accommodations...');

    try {
      console.log('AccommodationAgent: Starting accommodation search with plan:', plan);
      const accommodations = await this.searchAccommodations(plan);
      console.log('AccommodationAgent: Found accommodations:', accommodations);
      
      plan.accommodation = this.optimizeAccommodationOptions(accommodations, plan);
      console.log('AccommodationAgent: Optimized accommodations:', plan.accommodation);
      
      // Update budget after finding accommodations
      BudgetService.updateBudget(plan);
      
      await this.complete();
    } catch (error) {
      console.error('AccommodationAgent error:', error);
      await this.handleError(error as Error);
    }
  }

  private async searchAccommodations(plan: TravelPlan): Promise<AccommodationOption[]> {
    const { destinations, dates, travelers, accommodation: preferences } = plan.preferences;
    console.log('AccommodationAgent: Searching with preferences:', { destinations, dates, travelers, preferences });
    
    const allAccommodations: AccommodationOption[] = [];

    for (const destination of destinations) {
      await this.updateStatus(
        AgentStatus.WORKING,
        `Searching accommodations in ${destination}...`
      );

      const options = await this.mockAccommodationSearch(
        destination,
        dates,
        travelers,
        preferences.type
      );
      console.log(`AccommodationAgent: Found options for ${destination}:`, options);
      allAccommodations.push(...options);
    }

    return allAccommodations;
  }

  private optimizeAccommodationOptions(
    accommodations: AccommodationOption[],
    plan: TravelPlan
  ): AccommodationOption[] {
    const { budget, accommodation: preferences } = plan.preferences;
    console.log('AccommodationAgent: [DEBUG] Form types:', preferences.type);
    console.log('AccommodationAgent: [DEBUG] All generated types:', accommodations.map(a => a.type));
    // For debugging, return all generated accommodations (no filtering)
    return accommodations;
  }

  private calculateNights(plan: TravelPlan): number {
    const start = new Date(plan.preferences.dates.start);
    const end = new Date(plan.preferences.dates.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async mockAccommodationSearch(
    destination: string,
    dates: { start: string; end: string },
    travelers: { adults: number; children: number },
    types: string[]
  ): Promise<AccommodationOption[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const totalGuests = travelers.adults + travelers.children;
    const basePrice = Math.floor(Math.random() * 100) + 100; // Base price between 100-200 per night
    const totalPrice = basePrice * totalGuests;

    const accommodationTypes = types.length > 0 ? types : ['hotel', 'apartment', 'resort'];
    
    return accommodationTypes.map((type, index) => ({
      id: `acc-${Date.now()}-${index}`,
      name: `${destination} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      location: `${destination} City Center`,
      rating: Math.floor(Math.random() * 2) + 3, // Rating between 3-5
      amenities: ['WiFi', 'Air Conditioning', 'Kitchen'],
      price: totalPrice * (1 + index * 0.2), // Each option is 20% more expensive
      currency: 'USD',
      checkIn: dates.start,
      checkOut: dates.end
    }));
  }
} 