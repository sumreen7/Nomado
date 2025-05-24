import { VisaRequirement } from '@/types';
import { CacheService } from './CacheService';
import axios from 'axios';

export enum VisaType {
  TOURIST = 'tourist',
  BUSINESS = 'business',
  STUDENT = 'student',
  WORK = 'work',
  TRANSIT = 'transit',
  DIPLOMATIC = 'diplomatic',
  JOURNALIST = 'journalist',
  EXCHANGE_VISITOR = 'exchange_visitor',
  INVESTOR = 'investor',
  PERFORMER = 'performer',
  FAMILY = 'family',
  SETTLEMENT = 'settlement',
  INNOVATOR = 'innovator',
  SKILLED_WORKER = 'skilled_worker',
  WORKING_HOLIDAY = 'working_holiday',
  SKILLED_MIGRATION = 'skilled_migration',
  PARTNER = 'partner'
}

export class VisaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'VisaServiceError';
  }
}

export class VisaService {
  private static instance: VisaService;
  private readonly cache: CacheService;
  private readonly cacheTTL = 12 * 60 * 60 * 1000; // 12 hours
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.traveldoc.com/v1';

  private constructor(apiKey: string) {
    this.cache = CacheService.getInstance();
    this.apiKey = apiKey;
  }

  public static getInstance(apiKey: string): VisaService {
    if (!VisaService.instance) {
      VisaService.instance = new VisaService(apiKey);
    }
    return VisaService.instance;
  }

  private async makeApiRequest<T>(endpoint: string, params: any): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new VisaServiceError(
        error.response?.data?.message || 'API request failed',
        error.response?.status?.toString() || 'UNKNOWN',
        error.response?.data
      );
    }
  }

  public async checkVisaRequirements(
    nationality: string,
    residenceCountry: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<VisaRequirement> {
    const cacheKey = `visa:${nationality}:${residenceCountry}:${destination}:${visaType}`;
    const cachedData = this.cache.get<VisaRequirement>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.makeApiRequest<any>('/visa-requirements', {
        nationality,
        residence: residenceCountry,
        destination,
        visa_type: visaType
      });

      const requirement: VisaRequirement = {
        country: destination,
        required: response.visa_required,
        type: response.visa_type || visaType,
        processingTime: response.processing_time,
        cost: response.cost,
        currency: response.currency,
        documents: response.required_documents || [],
        notes: response.additional_notes,
        maxStay: response.max_stay
      };

      this.cache.set(cacheKey, requirement, this.cacheTTL);
      return requirement;
    } catch (error) {
      if (error instanceof VisaServiceError) {
        throw error;
      }
      throw new VisaServiceError(
        'Failed to fetch visa requirements',
        'API_ERROR',
        error
      );
    }
  }

  public async getVisaProcessingTime(
    nationality: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<string> {
    const cacheKey = `processing:${nationality}:${destination}:${visaType}`;
    const cachedData = this.cache.get<string>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.makeApiRequest<any>('/processing-time', {
        nationality,
        destination,
        visa_type: visaType
      });

      const processingTime = response.processing_time;
      this.cache.set(cacheKey, processingTime, this.cacheTTL);
      return processingTime;
    } catch (error) {
      throw new VisaServiceError(
        'Failed to fetch processing time',
        'API_ERROR',
        error
      );
    }
  }

  public async getVisaFee(
    nationality: string,
    destination: string,
    visaType: VisaType = VisaType.TOURIST
  ): Promise<{ cost: number; currency: string }> {
    const cacheKey = `fee:${nationality}:${destination}:${visaType}`;
    const cachedData = this.cache.get<{ cost: number; currency: string }>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.makeApiRequest<any>('/visa-fees', {
        nationality,
        destination,
        visa_type: visaType
      });

      const fee = {
        cost: response.cost,
        currency: response.currency
      };

      this.cache.set(cacheKey, fee, this.cacheTTL);
      return fee;
    } catch (error) {
      throw new VisaServiceError(
        'Failed to fetch visa fees',
        'API_ERROR',
        error
      );
    }
  }
} 