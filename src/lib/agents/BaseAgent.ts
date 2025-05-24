import { Agent, AgentRole, AgentStatus, TravelPlan } from '@/types';
import { EventEmitter } from 'events';

export abstract class BaseAgent extends EventEmitter implements Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTask?: string;
  protected plan: TravelPlan | null;
  private isStopped: boolean;

  constructor(role: AgentRole, name: string) {
    super();
    this.id = `${role}-${Date.now()}`;
    this.name = name;
    this.role = role;
    this.status = AgentStatus.IDLE;
    this.plan = null;
    this.isStopped = false;
  }

  abstract execute(plan: TravelPlan): Promise<void>;

  protected async updateStatus(status: AgentStatus, task?: string) {
    if (this.isStopped) return;
    
    this.status = status;
    this.currentTask = task;
    this.emit('statusUpdate', { agent: this, status, task });
  }

  protected async handleError(error: Error) {
    if (this.isStopped) return;

    console.error(`Agent ${this.name} encountered an error:`, error);
    await this.updateStatus(AgentStatus.ERROR, error.message);
    this.emit('error', { agent: this, error });
  }

  protected async complete() {
    if (this.isStopped) return;

    await this.updateStatus(AgentStatus.COMPLETED);
    this.emit('complete', { agent: this });
  }

  public async start(plan: TravelPlan) {
    if (this.isStopped) return;

    this.plan = plan;
    this.isStopped = false;
    await this.updateStatus(AgentStatus.WORKING, 'Initializing...');
    
    try {
      await this.execute(plan);
      if (!this.isStopped) {
        await this.complete();
      }
    } catch (error) {
      if (!this.isStopped) {
        await this.handleError(error as Error);
      }
    }
  }

  public stop() {
    this.isStopped = true;
    this.emit('stop', { agent: this });
  }
} 