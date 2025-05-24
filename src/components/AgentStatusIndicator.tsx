import { AgentStatus } from '@/types';
import { FC } from 'react';

interface AgentStatusIndicatorProps {
  name: string;
  status: AgentStatus;
  task?: string;
}

const statusIcon = (status: AgentStatus) => {
  switch (status) {
    case AgentStatus.WORKING:
      return <span className="animate-spin text-blue-500">⏳</span>;
    case AgentStatus.COMPLETED:
      return <span className="text-green-600">✔️</span>;
    case AgentStatus.ERROR:
      return <span className="text-red-600">❌</span>;
    default:
      return <span className="text-gray-400">●</span>;
  }
};

export const AgentStatusIndicator: FC<AgentStatusIndicatorProps> = ({ name, status, task }) => (
  <div className="flex items-center space-x-3 py-2">
    <div className="text-xl">{statusIcon(status)}</div>
    <div>
      <div className="font-medium text-gray-900">{name}</div>
      <div className="text-xs text-gray-500">
        {status === AgentStatus.WORKING && task ? task : status.charAt(0) + status.slice(1).toLowerCase()}
      </div>
    </div>
  </div>
); 