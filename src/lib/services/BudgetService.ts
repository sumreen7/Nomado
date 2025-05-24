import { TravelPlan, FlightOption, AccommodationOption, Activity, VisaRequirement } from '@/types';
import { convert } from './CurrencyService';

export class BudgetService {
  static async updateBudget(plan: TravelPlan): Promise<void> {
    const selectedCurrency = plan.preferences.budget.currency;
    const budget = {
      total: 0,
      currency: selectedCurrency,
      breakdown: {
        flights: 0,
        accommodation: 0,
        activities: 0,
        visaFees: 0,
        misc: 0,
      },
    };

    try {
      // Calculate flights total
      if (plan.flights?.length) {
        for (const flight of plan.flights) {
          if (!flight.price || !flight.currency || !selectedCurrency) {
            console.error('Missing flight price or currency:', flight);
            continue;
          }
          try {
            const convertedPrice = await convert(flight.price, flight.currency, selectedCurrency);
            budget.breakdown.flights += Math.round(convertedPrice);
          } catch (e) {
            console.error('Currency conversion failed for flight:', flight, e);
          }
        }
      }

      // Calculate accommodation total
      if (plan.accommodation?.length) {
        for (const acc of plan.accommodation) {
          if (!acc.price || !acc.currency || !selectedCurrency) {
            console.error('Missing accommodation price or currency:', acc);
            continue;
          }
          try {
            const convertedPrice = await convert(acc.price, acc.currency, selectedCurrency);
            budget.breakdown.accommodation += Math.round(convertedPrice);
          } catch (e) {
            console.error('Currency conversion failed for accommodation:', acc, e);
          }
        }
      }

      // Calculate activities total from itinerary
      if (plan.itinerary?.length) {
        for (const day of plan.itinerary) {
          for (const activity of day.activities) {
            if (!activity.price || !activity.currency || !selectedCurrency) {
              console.error('Missing activity price or currency:', activity);
              continue;
            }
            try {
              const convertedPrice = await convert(activity.price, activity.currency, selectedCurrency);
              budget.breakdown.activities += Math.round(convertedPrice);
            } catch (e) {
              console.error('Currency conversion failed for activity:', activity, e);
            }
          }
        }
      }

      // Calculate visa fees
      if (plan.visaRequirements?.length) {
        for (const visa of plan.visaRequirements) {
          if (!visa.cost || !visa.currency || !selectedCurrency) {
            console.error('Missing visa cost or currency:', visa);
            continue;
          }
          try {
            const convertedPrice = await convert(visa.cost, visa.currency, selectedCurrency);
            budget.breakdown.visaFees += Math.round(convertedPrice);
          } catch (e) {
            console.error('Currency conversion failed for visa:', visa, e);
          }
        }
      }

      // Calculate total
      budget.total = Object.values(budget.breakdown).reduce((a, b) => a + b, 0);

      // Add a default miscellaneous cost (10% of total budget before misc)
      const totalBeforeMisc = budget.total;
      budget.breakdown.misc = Math.round(totalBeforeMisc * 0.1);
      budget.total += budget.breakdown.misc;

      // Update the plan's budget
      plan.budget = budget;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw new Error('Failed to update budget with currency conversion');
    }
  }
} 