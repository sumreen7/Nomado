'use client';

import { TravelPreferencesForm } from '@/components/TravelPreferencesForm';
import { TravelPlanResults } from '@/components/TravelPlanResults';
import { useTravelStore } from '@/store/useTravelStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect, useState, useRef } from 'react';
import { AgentStatusIndicator } from '@/components/AgentStatusIndicator';
import { AgentStatus, AgentRole } from '@/types';

export default function Home() {
  const currentPlan = useTravelStore(state => state.currentPlan);
  const isPlanning = useTravelStore(state => state.isPlanning);
  const error = useTravelStore(state => state.error);
  const agents = useTravelStore(state => state.agents);
  const [isLoading, setIsLoading] = useState(true);

  const sectionRefs = {
    itinerary: useRef<HTMLDivElement>(null),
    flights: useRef<HTMLDivElement>(null),
    accommodation: useRef<HTMLDivElement>(null),
    visa: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    // Simulate initialization delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Helper to scroll to section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
          <span className="text-lg text-gray-700">Loading Nomado...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">
            Welcome to Nomado!
          </h1>
          
          {!currentPlan && <TravelPreferencesForm />}
          
          {currentPlan && (
            <div className="flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0">
              {/* Sidebar/Stepper for agent progress */}
              <aside className="md:w-1/4 w-full bg-white/80 rounded-2xl shadow p-4 mb-4 md:mb-0">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">🧑‍💼</span> Planning Progress
                </h2>
                <div>
                  <button className="w-full text-left" onClick={() => scrollToSection('itinerary')}><AgentStatusIndicator name="Itinerary" status={agents.find(a => a.role === AgentRole.ITINERARY_BUILDER)?.status || AgentStatus.IDLE} task={agents.find(a => a.role === AgentRole.ITINERARY_BUILDER)?.currentTask} /></button>
                  <button className="w-full text-left" onClick={() => scrollToSection('flights')}><AgentStatusIndicator name="Flights" status={agents.find(a => a.role === AgentRole.FLIGHT_PLANNER)?.status || AgentStatus.IDLE} task={agents.find(a => a.role === AgentRole.FLIGHT_PLANNER)?.currentTask} /></button>
                  <button className="w-full text-left" onClick={() => scrollToSection('accommodation')}><AgentStatusIndicator name="Accommodations" status={agents.find(a => a.role === AgentRole.ACCOMMODATION_PLANNER)?.status || AgentStatus.IDLE} task={agents.find(a => a.role === AgentRole.ACCOMMODATION_PLANNER)?.currentTask} /></button>
                  <button className="w-full text-left" onClick={() => scrollToSection('visa')}><AgentStatusIndicator name="Visa Requirements" status={agents.find(a => a.role === AgentRole.VISA_DOCUMENTATION)?.status || AgentStatus.IDLE} task={agents.find(a => a.role === AgentRole.VISA_DOCUMENTATION)?.currentTask} /></button>
                </div>
              </aside>
              {/* Main results */}
              <main className="flex-1">
                <div className="space-y-8">
                  {isPlanning && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                      <span className="text-lg text-gray-700">Planning your trip...</span>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                      {error}
                    </div>
                  )}
                  
                  {!isPlanning && <TravelPlanResults plan={currentPlan} />}
                </div>
              </main>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
