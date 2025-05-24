import { TravelPlan, TravelPreferences, PlanningStatus } from '@/types';
import { VisaAgent } from '../lib/agents/VisaAgent';

async function testVisaCheck() {
  console.log('Testing Visa Check Service...\n');

  // Create a visa agent
  const visaAgent = new VisaAgent();

  // Test cases
  const testCases = [
    {
      name: 'EU Citizen traveling in EU',
      plan: createTestPlan('France', 'France', ['Germany', 'Italy'])
    },
    {
      name: 'US Citizen traveling to EU',
      plan: createTestPlan('USA', 'USA', ['France', 'Spain'])
    },
    {
      name: 'Indian Citizen traveling to EU',
      plan: createTestPlan('India', 'India', ['Germany', 'France'])
    }
  ];

  // Run test cases
  for (const test of testCases) {
    console.log(`=== ${test.name} ===`);
    try {
      await visaAgent.start(test.plan);
      
      console.log('\nVisa Requirements:');
      test.plan.visaRequirements?.forEach((req, index) => {
        console.log(`\nDestination ${index + 1}: ${req.country}`);
        console.log(`Required: ${req.required}`);
        console.log(`Type: ${req.type}`);
        console.log(`Processing Time: ${req.processingTime}`);
        console.log(`Cost: ${req.cost} ${req.currency}`);
        console.log('Required Documents:');
        req.documents.forEach(doc => console.log(`- ${doc}`));
        if (req.notes.length > 0) {
          console.log('Notes:');
          req.notes.forEach(note => console.log(`- ${note}`));
        }
      });

      console.log('\nBudget Impact:');
      console.log(`Visa Fees: ${test.plan.budget.breakdown.visaFees} ${test.plan.budget.currency}`);
      console.log(`Total Budget: ${test.plan.budget.total} ${test.plan.budget.currency}`);
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
}

function createTestPlan(
  nationality: string,
  residenceCountry: string,
  destinations: string[]
): TravelPlan {
  return {
    id: `test-${Date.now()}`,
    userId: 'test-user',
    status: PlanningStatus.DRAFT,
    preferences: {
      travelers: {
        adults: 1,
        children: 0,
        nationality,
        residenceCountry
      },
      destinations,
      dates: {
        start: '2024-06-01',
        end: '2024-06-15',
        isFlexible: false
      },
      budget: {
        min: 1000,
        max: 5000,
        currency: 'EUR'
      },
      travelStyle: ['leisure'],
      accommodation: {
        type: ['hotel'],
        preferences: ['central'],
        stayType: 'private',
        minRating: 4
      },
      activities: ['sightseeing']
    } as TravelPreferences,
    budget: {
      total: 0,
      currency: 'EUR',
      breakdown: {
        flights: 0,
        accommodation: 0,
        activities: 0,
        visaFees: 0,
        misc: 0
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Run the tests
testVisaCheck().catch(console.error); 