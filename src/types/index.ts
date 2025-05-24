export interface TravelPreferences {
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  dates: {
    start: string;
    end: string;
    isFlexible: boolean;
  };
  origin: string;
  destinations: string[];
  travelStyle: string[];
  accommodation: {
    type: string[];
    preferences: string[];
    stayType: 'private' | 'shared';
    minRating: number;
  };
  activities: string[];
  travelers: {
    adults: number;
    children: number;
    nationality: string;
    residenceCountry: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTask?: string;
  error?: string;
  on(event: 'statusUpdate', callback: (data: { status: AgentStatus; task?: string }) => void): void;
  on(event: 'error', callback: (data: { error: Error }) => void): void;
  on(event: 'complete', callback: () => void): void;
  start(plan: TravelPlan): Promise<void>;
  stop(): void;
}

export enum AgentRole {
  VISA_DOCUMENTATION = 'VISA_DOCUMENTATION',
  FLIGHT_PLANNER = 'FLIGHT_PLANNER',
  ACCOMMODATION_PLANNER = 'ACCOMMODATION_PLANNER',
  ITINERARY_BUILDER = 'ITINERARY_BUILDER'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface TravelPlan {
  id: string;
  userId: string;
  preferences: TravelPreferences;
  status: PlanningStatus;
  flights?: FlightOption[];
  accommodation?: AccommodationOption[];
  itinerary?: ItineraryDay[];
  visaRequirements?: VisaRequirement[];
  budget: BudgetBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightOption {
  id: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stopCount: number;
  price: number;
  currency: string;
}

export interface AccommodationOption {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  amenities: string[];
  price: number;
  currency: string;
  checkIn: string;
  checkOut: string;
}

export interface ItineraryDay {
  date: string;
  activities: Activity[];
  accommodation?: AccommodationOption;
  transportation?: FlightOption[];
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  price: number;
  currency: string;
}

export interface VisaRequirement {
  country: string;
  required: boolean;
  type: string;
  processingTime: string;
  cost: number;
  currency: string;
  documents: string[];
  notes: string[];
  maxStay: number;
}

export interface BudgetBreakdown {
  total: number;
  currency: string;
  breakdown: {
    flights: number;
    accommodation: number;
    activities: number;
    visaFees: number;
    misc: number;
  };
}

export enum PlanningStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
} 