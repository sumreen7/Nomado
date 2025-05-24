import { create } from 'zustand';
import { Agent, TravelPlan, TravelPreferences, PlanningStatus, AgentStatus } from '@/types';

interface TravelStore {
  currentPlan: TravelPlan | null;
  agents: Agent[];
  isPlanning: boolean;
  error: string | null;
  // Actions
  initializePlan: (preferences: TravelPreferences) => void;
  updatePlan: (plan: Partial<TravelPlan>) => void;
  registerAgent: (agent: Agent) => void;
  unregisterAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus, task?: string) => void;
  setError: (error: string | null) => void;
  startPlanning: () => void;
  stopPlanning: () => void;
}

export const useTravelStore = create<TravelStore>((set, get) => ({
  currentPlan: null,
  agents: [],
  isPlanning: false,
  error: null,

  initializePlan: (preferences: TravelPreferences) => {
    const newPlan: TravelPlan = {
      id: `plan-${Date.now()}`,
      userId: 'user-1', // TODO: Replace with actual user ID
      preferences,
      status: PlanningStatus.DRAFT,
      budget: {
        total: 0,
        currency: preferences.budget.currency,
        breakdown: {
          flights: 0,
          accommodation: 0,
          activities: 0,
          visaFees: 0,
          misc: 0,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ currentPlan: newPlan, error: null });
  },

  updatePlan: (planUpdate: Partial<TravelPlan>) => {
    set(state => {
      if (!state.currentPlan) return state;

      const updatedPlan = {
        ...state.currentPlan,
        ...planUpdate,
        updatedAt: new Date(),
      };

      return { currentPlan: updatedPlan };
    });
  },

  registerAgent: (agent: Agent) => {
    set(state => ({
      agents: [...state.agents, agent],
    }));
  },

  unregisterAgent: (agentId: string) => {
    set(state => ({
      agents: state.agents.filter(agent => agent.id !== agentId),
    }));
  },

  updateAgentStatus: (agentId: string, status: AgentStatus, task?: string) => {
    set(state => ({
      agents: state.agents.map(agent =>
        agent.id === agentId
          ? { ...agent, status, currentTask: task }
          : agent
      ),
    }));
  },

  setError: (error: string | null) => {
    set({ error });
  },

  startPlanning: () => {
    set(state => {
      if (!state.currentPlan) {
        set({ error: 'No plan initialized' });
        return state;
      }

      const updatedPlan = {
        ...state.currentPlan,
        status: PlanningStatus.IN_PROGRESS,
      };

      return {
        currentPlan: updatedPlan,
        isPlanning: true,
        error: null,
      };
    });
  },

  stopPlanning: () => {
    set({ isPlanning: false });
  },
})); 