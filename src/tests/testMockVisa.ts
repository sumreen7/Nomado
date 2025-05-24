import { TravelPlan, TravelPreferences, PlanningStatus } from '@/types';
import { VisaAgent } from '../lib/agents/VisaAgent';

interface TestCase {
  name: string;
  plan: TravelPlan;
}

const testCases: TestCase[] = [
  {
    name: 'Test Case 1: US Citizen traveling to Japan',
    plan: {
      id: 'test-1',
      userId: 'user-1',
      status: PlanningStatus.DRAFT,
      preferences: {
        travelers: {
          adults: 1,
          children: 0,
          nationality: 'United States',
          residenceCountry: 'United States'
        },
        destinations: ['Japan'],
      } as TravelPreferences,
      budget: {
        total: 0,
        currency: 'USD',
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
    }
  }
];

async function runTests() {
  const visaAgent = new VisaAgent();

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

runTests().catch(console.error); 