import { AgentRole, AgentStatus, TravelPlan, ItineraryDay, Activity } from '@/types';
import { BaseAgent } from './BaseAgent';
import { BudgetService } from '../services/BudgetService';

interface ActivityTemplate {
  name: string;
  type: string;
  duration: number;
  price: number;
  location: string;
  description: string;
}

export class ItineraryAgent extends BaseAgent {
  private activityTemplates: { [key: string]: ActivityTemplate[] } = {};

  constructor() {
    super(AgentRole.ITINERARY_BUILDER, 'Itinerary Builder');
    this.initializeActivityTemplates();
  }

  private initializeActivityTemplates() {
    this.activityTemplates = {
      cultural: [
        {
          name: 'Museum Visit',
          type: 'cultural',
          duration: 3,
          price: 25,
          location: 'Cultural District',
          description: 'Explore local art and history'
        },
        {
          name: 'Historical Sites Tour',
          type: 'cultural',
          duration: 4,
          price: 45,
          location: 'Historical Quarter',
          description: 'Visit significant historical landmarks'
        },
        {
          name: 'Local Craft Workshop',
          type: 'cultural',
          duration: 2,
          price: 40,
          location: 'Artisan District',
          description: 'Learn traditional crafts from local artisans'
        }
      ],
      adventure: [
        {
          name: 'Hiking Expedition',
          type: 'adventure',
          duration: 6,
          price: 80,
          location: 'Nature Reserve',
          description: 'Guided hiking through scenic trails'
        },
        {
          name: 'Water Sports',
          type: 'adventure',
          duration: 4,
          price: 120,
          location: 'Beach',
          description: 'Exciting water activities and sports'
        },
        {
          name: 'Rock Climbing',
          type: 'adventure',
          duration: 3,
          price: 90,
          location: 'Adventure Center',
          description: 'Indoor and outdoor climbing experiences'
        }
      ],
      relaxation: [
        {
          name: 'Spa Day',
          type: 'relaxation',
          duration: 4,
          price: 150,
          location: 'Wellness Center',
          description: 'Luxurious spa treatments and massages'
        },
        {
          name: 'Beach Day',
          type: 'relaxation',
          duration: 6,
          price: 30,
          location: 'Beach Club',
          description: 'Relax on pristine beaches with amenities'
        },
        {
          name: 'Yoga Session',
          type: 'relaxation',
          duration: 2,
          price: 40,
          location: 'Wellness Studio',
          description: 'Guided yoga and meditation'
        }
      ],
      food: [
        {
          name: 'Food Tour',
          type: 'food',
          duration: 3,
          price: 75,
          location: 'Food District',
          description: 'Sample local delicacies and street food'
        },
        {
          name: 'Cooking Class',
          type: 'food',
          duration: 4,
          price: 100,
          location: 'Culinary School',
          description: 'Learn to cook local specialties'
        },
        {
          name: 'Wine Tasting',
          type: 'food',
          duration: 2,
          price: 60,
          location: 'Winery',
          description: 'Sample regional wines with experts'
        }
      ],
      shopping: [
        {
          name: 'Market Visit',
          type: 'shopping',
          duration: 3,
          price: 0,
          location: 'Local Market',
          description: 'Explore traditional markets and bazaars'
        },
        {
          name: 'Shopping District Tour',
          type: 'shopping',
          duration: 4,
          price: 30,
          location: 'Shopping District',
          description: 'Visit popular shopping areas and boutiques'
        },
        {
          name: 'Artisan Shopping',
          type: 'shopping',
          duration: 2,
          price: 0,
          location: 'Craft Market',
          description: 'Shop for local handicrafts and artworks'
        }
      ],
      nightlife: [
        {
          name: 'Bar Hopping Tour',
          type: 'nightlife',
          duration: 4,
          price: 80,
          location: 'Entertainment District',
          description: 'Visit popular local bars and pubs'
        },
        {
          name: 'Live Music Show',
          type: 'nightlife',
          duration: 3,
          price: 60,
          location: 'Music Venue',
          description: 'Enjoy live local music performances'
        },
        {
          name: 'Night Market Visit',
          type: 'nightlife',
          duration: 2,
          price: 0,
          location: 'Night Market',
          description: 'Experience the vibrant night market scene'
        }
      ]
    };
  }

  async execute(plan: TravelPlan): Promise<void> {
    try {
      await this.updateStatus(AgentStatus.WORKING, 'Starting itinerary planning...');

      // Validate inputs
      this.validatePlanInputs(plan);

      await this.updateStatus(AgentStatus.WORKING, `Planning trip to ${plan.preferences.destinations.join(', ')}...`);
      
      // Create itinerary for the full duration
      await this.updateStatus(AgentStatus.WORKING, 'Creating daily itineraries...');
      
      const startDate = new Date(plan.preferences.dates.start);
      const endDate = new Date(plan.preferences.dates.end);
      const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const itinerary: ItineraryDay[] = [];
      
      for (let i = 0; i < dayCount; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const activities = this.generateDailyActivities(
          plan.preferences.destinations[i % plan.preferences.destinations.length],
          plan.preferences.activities,
          plan.preferences.travelStyle,
          plan.preferences.budget.currency,
          i + 1
        );
        console.log(`ItineraryAgent: Activities for day ${i + 1}:`, activities);
        const dayItinerary: ItineraryDay = {
          date: currentDate.toISOString().split('T')[0],
          activities,
          transportation: [],
          accommodation: plan.accommodation?.[i]
        };
        
        itinerary.push(dayItinerary);
      }

      // Update the plan with our generated itinerary
      await this.updateStatus(AgentStatus.WORKING, 'Finalizing itinerary...');
      plan.itinerary = itinerary;
      console.log('ItineraryAgent: Final itinerary:', itinerary);
      
      // Update budget
      BudgetService.updateBudget(plan);
      
      await this.complete();
    } catch (error) {
      console.error('ItineraryAgent error:', error);
      await this.handleError(error as Error);
    }
  }

  private generateDailyActivities(
    destination: string,
    preferredActivities: string[],
    travelStyle: string[],
    currency: string,
    dayNumber: number
  ): Activity[] {
    const activities: Activity[] = [];
    let startTime = 9; // Start at 9 AM

    // First day - always include orientation activities
    if (dayNumber === 1) {
      activities.push({
        id: `activity-${dayNumber}-1`,
        name: 'City Orientation Tour',
        type: 'sightseeing',
        startTime: '09:00',
        endTime: '12:00',
        location: `${destination} - City Center`,
        price: 75, // Standard orientation tour price
        currency: currency,
        description: `Get oriented in ${destination} with a guided tour of main attractions`
      });
      
      startTime = 14; // Start afternoon activities at 2 PM
    }

    // Define activity prices based on type
    const activityPrices: Record<string, number> = {
      'sightseeing': 50,
      'museum': 25,
      'food-tour': 100,
      'adventure': 150,
      'cultural': 75,
      'shopping': 0,
      'beach': 30,
      'hiking': 80,
      'nightlife': 120
    };

    // Get activity preferences based on travel style and preferred activities
    const activityTypes = new Set([...preferredActivities, ...travelStyle]);
    const dailyActivities: Activity[] = [];

    // Generate 2-3 activities per day
    const numActivities = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numActivities; i++) {
      const type = Array.from(activityTypes)[Math.floor(Math.random() * activityTypes.size)];
      const basePrice = activityPrices[type] || 50;
      const actualPrice = basePrice * (0.8 + Math.random() * 0.4); // Price variation ±20%

      const activity: Activity = {
        id: `activity-${dayNumber}-${i + 2}`,
        name: this.getActivityName(type, destination),
        type,
        startTime: `${startTime}:00`,
        endTime: `${startTime + 2}:00`,
        location: `${destination} - ${this.getActivityLocation(type)}`,
        price: Math.max(1, Math.round(actualPrice) || 50), // fallback to 50 if 0/undefined, min 1
        currency: currency || 'USD', // fallback to USD if missing
        description: this.getActivityDescription(type, destination)
      };

      dailyActivities.push(activity);
      startTime += 3; // 3-hour slots for activities
    }

    return [...activities, ...dailyActivities];
  }

  private getActivityName(type: string, destination: string): string {
    const names: Record<string, string[]> = {
      'sightseeing': ['Guided Tour', 'Walking Tour', 'Highlights Tour'],
      'museum': ['Art Museum Visit', 'History Museum Tour', 'Cultural Exhibition'],
      'food-tour': ['Local Food Tasting', 'Cooking Class', 'Market Tour'],
      'adventure': ['Outdoor Adventure', 'Extreme Sports', 'Nature Expedition'],
      'cultural': ['Cultural Workshop', 'Traditional Show', 'Local Experience'],
      'shopping': ['Shopping District Tour', 'Local Market Visit', 'Artisan Shops'],
      'beach': ['Beach Day', 'Water Sports', 'Coastal Adventure'],
      'hiking': ['Nature Trail Hike', 'Mountain Expedition', 'Scenic Walk'],
      'nightlife': ['Evening Entertainment', 'Local Nightlife Tour', 'Dinner Show']
    };

    const options = names[type] || names['sightseeing'];
    return `${destination} ${options[Math.floor(Math.random() * options.length)]}`;
  }

  private getActivityLocation(type: string): string {
    const locations: Record<string, string[]> = {
      'sightseeing': ['Historic District', 'City Center', 'Old Town'],
      'museum': ['Cultural District', 'Art Quarter', 'Heritage Zone'],
      'food-tour': ['Local Market', 'Restaurant District', 'Food Street'],
      'adventure': ['Adventure Park', 'Nature Reserve', 'Sports Center'],
      'cultural': ['Cultural Center', 'Traditional Quarter', 'Arts District'],
      'shopping': ['Shopping District', 'Market Square', 'Commercial Center'],
      'beach': ['Beach Front', 'Coastal Area', 'Marina'],
      'hiking': ['Nature Park', 'Mountain Trail', 'Forest Reserve'],
      'nightlife': ['Entertainment District', 'City Center', 'Marina']
    };

    const options = locations[type] || locations['sightseeing'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private getActivityDescription(type: string, destination: string): string {
    const descriptions: Record<string, string[]> = {
      'sightseeing': [`Explore the best of ${destination} with a knowledgeable guide`],
      'museum': [`Discover the rich history and culture of ${destination}`],
      'food-tour': [`Taste the authentic flavors of ${destination}`],
      'adventure': [`Experience thrilling activities in ${destination}`],
      'cultural': [`Immerse yourself in the culture of ${destination}`],
      'shopping': [`Discover local shops and markets in ${destination}`],
      'beach': [`Enjoy the beautiful beaches of ${destination}`],
      'hiking': [`Explore the natural beauty of ${destination}`],
      'nightlife': [`Experience the vibrant nightlife of ${destination}`]
    };

    const options = descriptions[type] || descriptions['sightseeing'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private validatePlanInputs(plan: TravelPlan): void {
    if (!plan.preferences.destinations?.length) {
      throw new Error('No destinations specified');
    }

    if (!plan.preferences.dates.start || !plan.preferences.dates.end) {
      throw new Error('Travel dates are required');
    }

    if (!plan.preferences.budget?.currency) {
      throw new Error('Currency is required for budget calculations');
    }

    if (!plan.preferences.activities?.length) {
      throw new Error('At least one preferred activity type is required');
    }

    if (!plan.preferences.travelStyle?.length) {
      throw new Error('At least one travel style preference is required');
    }
  }
} 