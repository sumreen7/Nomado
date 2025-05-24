import { TravelPlan, Agent, AgentRole, AgentStatus } from '@/types';
import { MockVisaService } from '../services/MockVisaService';
import { VisaType } from '../services/VisaService';
import { EventEmitter } from 'events';

export class VisaAgent extends EventEmitter implements Agent {
  private visaService: MockVisaService;
  public id: string;
  public name: string;
  public role: AgentRole;
  public status: AgentStatus;
  public currentTask?: string;
  public error?: string;

  constructor() {
    super();
    this.visaService = MockVisaService.getInstance();
    this.id = 'visa-agent-1';
    this.name = 'Visa Requirements Agent';
    this.role = AgentRole.VISA_DOCUMENTATION;
    this.status = AgentStatus.IDLE;
  }

  async start(plan: TravelPlan): Promise<void> {
    try {
      this.status = AgentStatus.WORKING;
      this.emit('statusUpdate', { status: this.status, task: 'Checking visa requirements' });
      
      await this.execute(plan);
      
      this.status = AgentStatus.COMPLETED;
      this.emit('statusUpdate', { status: this.status });
      this.emit('complete');
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('statusUpdate', { status: this.status, task: this.error });
      this.emit('error', { error: error instanceof Error ? error : new Error(this.error) });
    }
  }

  stop(): void {
    if (this.status === AgentStatus.WORKING) {
      this.status = AgentStatus.IDLE;
      this.emit('statusUpdate', { status: this.status, task: 'Stopped' });
    }
  }

  private async execute(plan: TravelPlan): Promise<void> {
    if (!plan.preferences?.travelers?.nationality) {
      throw new Error('Traveler nationality is required for visa check');
    }

    const { nationality, residenceCountry } = plan.preferences.travelers;
    const destinations = plan.preferences.destinations;

    if (!destinations || destinations.length === 0) {
      throw new Error('No destinations specified for visa check');
    }

    // Initialize visa requirements array if it doesn't exist
    if (!plan.visaRequirements) {
      plan.visaRequirements = [];
    }

    // Initialize visa fees in budget if they don't exist
    if (!plan.budget.breakdown) {
      plan.budget.breakdown = {
        flights: 0,
        accommodation: 0,
        activities: 0,
        visaFees: 0,
        misc: 0
      };
    }

    // Get visa requirements for each destination
    for (const destination of destinations) {
      this.emit('statusUpdate', { 
        status: this.status, 
        task: `Checking visa requirements for ${destination}` 
      });

      const requirement = await this.visaService.checkVisaRequirements(
        nationality,
        residenceCountry || nationality, // Use nationality as residence if not specified
        destination,
        VisaType.TOURIST
      );

      plan.visaRequirements.push(requirement);

      // Update budget if visa is required and has a cost
      const visaCost = requirement.cost || 0;
      if (requirement.required && visaCost > 0) {
        plan.budget.breakdown.visaFees += visaCost;
        plan.budget.total += visaCost;
      }
    }
  }
}