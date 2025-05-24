import { Agent, AgentRole, AgentStatus, TravelPlan, PlanningStatus } from '@/types';
import { FlightPlannerAgent } from '../agents/FlightPlannerAgent';
import { AccommodationAgent } from '../agents/AccommodationAgent';
import { VisaAgent } from '../agents/VisaAgent';
import { ItineraryAgent } from '../agents/ItineraryAgent';
import { useTravelStore } from '@/store/useTravelStore';
import { BudgetService } from './BudgetService';

export class AgentCoordinator {
  private agents: Map<AgentRole, Agent>;
  private store: typeof useTravelStore;
  private executionOrder: AgentRole[];
  private isExecuting: boolean;
  private currentPlan: TravelPlan | null;

  constructor(store: typeof useTravelStore) {
    this.agents = new Map();
    this.store = store;
    this.isExecuting = false;
    this.currentPlan = null;
    this.executionOrder = [
      AgentRole.VISA_DOCUMENTATION,
      AgentRole.FLIGHT_PLANNER,
      AgentRole.ACCOMMODATION_PLANNER,
      AgentRole.ITINERARY_BUILDER
    ];
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize all agents with their respective API keys
    // TODO: Move API keys to environment variables
    const flightPlanner = new FlightPlannerAgent('mock-api-key');
    const accommodationPlanner = new AccommodationAgent('mock-api-key');
    const visaAgent = new VisaAgent();
    const itineraryBuilder = new ItineraryAgent();
    
    // Register agents
    this.registerAgent(flightPlanner);
    this.registerAgent(accommodationPlanner);
    this.registerAgent(visaAgent);
    this.registerAgent(itineraryBuilder);

    // Set up event listeners for each agent
    [flightPlanner, accommodationPlanner, visaAgent, itineraryBuilder].forEach(
      agent => this.setupAgentEventListeners(agent)
    );
  }

  private registerAgent(agent: Agent) {
    this.agents.set(agent.role, agent);
    this.store.getState().registerAgent(agent);
  }

  private setupAgentEventListeners(agent: Agent) {
    agent.on('statusUpdate', ({ status, task }) => {
      if (!this.isExecuting) return;

      // Update store with agent's status and task
      this.store.getState().updateAgentStatus(agent.id, status, task);

      // Update plan status based on agent status
      if (status === AgentStatus.ERROR) {
        this.store.getState().updatePlan({ status: PlanningStatus.ERROR });
        this.store.getState().setError(`Error in ${agent.name}: ${task || 'Unknown error'}`);
        this.stopPlanning();
      }
    });

    agent.on('error', ({ error }) => {
      if (!this.isExecuting) return;
      
      const errorMessage = `${agent.name} failed: ${error.message}`;
      console.error(errorMessage);
      this.store.getState().setError(errorMessage);
      this.stopPlanning();
    });

    agent.on('complete', () => {
      if (!this.isExecuting) return;
      
      // Update the store with the latest plan state after each agent completes
      if (this.currentPlan) {
        this.store.getState().updatePlan(this.currentPlan);
      }
      
      this.checkPlanningCompletion();
    });
  }

  private async checkPlanningCompletion() {
    // Only consider agents that have completed successfully
    const allAgents = Array.from(this.agents.values());
    const completedAgents = allAgents.filter(
      agent => agent.status === AgentStatus.COMPLETED
    );
    
    // If all agents completed successfully
    if (completedAgents.length === allAgents.length) {
      // Ensure budget is up to date with all plan data (including activities)
      if (this.currentPlan) {
        await BudgetService.updateBudget(this.currentPlan);
      }
      if (this.currentPlan) {
        this.store.getState().updatePlan({
          ...this.currentPlan,
          status: PlanningStatus.COMPLETED,
        });
      }
      this.store.getState().setError(null); // Clear any previous errors
      this.stopPlanning();
    }
  }

  public async startPlanning(plan: TravelPlan) {
    if (this.isExecuting) return;
    
    this.isExecuting = true;
    this.currentPlan = plan;
    this.store.getState().startPlanning();
    this.store.getState().setError(null); // Clear any previous errors

    // Execute agents in the defined order
    for (const role of this.executionOrder) {
      const agent = this.agents.get(role);
      if (!agent) continue;

      try {
        await agent.start(this.currentPlan);
        
        // If the agent failed or we're no longer executing, stop the planning process
        if (agent.status === AgentStatus.ERROR || !this.isExecuting) {
          return; // The error will be handled by the event listeners
        }
      } catch (error) {
        const errorMessage = `Failed to start ${agent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        this.store.getState().setError(errorMessage);
        this.stopPlanning();
        return;
      }
    }
  }

  public stopPlanning() {
    if (!this.isExecuting) return;
    
    this.isExecuting = false;
    this.currentPlan = null;
    Array.from(this.agents.values()).forEach(agent => agent.stop());
    this.store.getState().stopPlanning();
  }
} 