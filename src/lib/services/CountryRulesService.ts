import { VisaType } from './VisaService';

export interface CountryAgreement {
  type: 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'pre_approval' | 'embassy_only';
  maxStay?: number; // in days
  requirements?: string[];
  notes?: string[];
}

export interface VisaExemption {
  type: string;
  conditions: string[];
  maxStay: number; // in days
}

export class CountryRulesService {
  private static instance: CountryRulesService;

  // Regional agreements and unions
  private readonly schengenCountries = new Set([
    'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Estonia',
    'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland',
    'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal',
    'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland'
  ]);

  private readonly aseanCountries = new Set([
    'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia',
    'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'
  ]);

  private readonly gccCountries = new Set([
    'Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi Arabia',
    'United Arab Emirates'
  ]);

  // Special visa types by purpose
  private readonly specialVisaTypes: Record<string, VisaType[]> = {
    'USA': [
      VisaType.TOURIST, // B1/B2
      VisaType.BUSINESS,
      VisaType.STUDENT, // F1
      VisaType.WORK, // H1B
      VisaType.TRANSIT,
      VisaType.DIPLOMATIC, // A
      VisaType.JOURNALIST, // I
      VisaType.EXCHANGE_VISITOR, // J1
      VisaType.INVESTOR, // E1/E2
      VisaType.PERFORMER // P
    ],
    'UK': [
      VisaType.TOURIST,
      VisaType.BUSINESS,
      VisaType.STUDENT,
      VisaType.WORK,
      VisaType.TRANSIT,
      VisaType.FAMILY,
      VisaType.SETTLEMENT,
      VisaType.INNOVATOR,
      VisaType.SKILLED_WORKER
    ],
    'Australia': [
      VisaType.TOURIST,
      VisaType.BUSINESS,
      VisaType.STUDENT,
      VisaType.WORK,
      VisaType.WORKING_HOLIDAY,
      VisaType.SKILLED_MIGRATION,
      VisaType.PARTNER
    ]
  };

  // Bilateral agreements and special arrangements
  private readonly bilateralAgreements: Map<string, Map<string, CountryAgreement>> = new Map([
    ['Singapore', new Map<string, CountryAgreement>([
      ['Malaysia', { type: 'visa_free', maxStay: 30 }],
      ['Indonesia', { type: 'visa_free', maxStay: 30 }],
      ['Brunei', { type: 'visa_free', maxStay: 90 }]
    ])],
    ['Japan', new Map<string, CountryAgreement>([
      ['Singapore', { type: 'visa_free', maxStay: 90 }],
      ['South Korea', { type: 'visa_free', maxStay: 90 }],
      ['Taiwan', { type: 'visa_free', maxStay: 90 }]
    ])]
  ]);

  // Special exemptions and programs
  private readonly specialPrograms: Map<string, Map<string, VisaExemption[]>> = new Map([
    ['USA', new Map([
      ['ESTA', [
        {
          type: 'visa_waiver',
          conditions: ['Valid ESTA authorization', 'Return ticket'],
          maxStay: 90
        }
      ]]
    ])],
    ['Australia', new Map([
      ['eVisitor', [
        {
          type: 'electronic_visa',
          conditions: ['EU passport holder', 'Tourist or business purpose'],
          maxStay: 90
        }
      ]]
    ])]
  ]);

  private constructor() {}

  public static getInstance(): CountryRulesService {
    if (!CountryRulesService.instance) {
      CountryRulesService.instance = new CountryRulesService();
    }
    return CountryRulesService.instance;
  }

  public getAvailableVisaTypes(country: string): VisaType[] {
    return this.specialVisaTypes[country] || [
      VisaType.TOURIST,
      VisaType.BUSINESS,
      VisaType.STUDENT,
      VisaType.WORK,
      VisaType.TRANSIT
    ];
  }

  public checkVisaFreeAgreement(
    nationality: string,
    destination: string
  ): CountryAgreement | null {
    // Check bilateral agreements
    const countryAgreements = this.bilateralAgreements.get(nationality);
    if (countryAgreements && countryAgreements.has(destination)) {
      return countryAgreements.get(destination)!;
    }

    // Check regional agreements
    if (this.schengenCountries.has(nationality) && this.schengenCountries.has(destination)) {
      return {
        type: 'visa_free',
        maxStay: 90,
        notes: ['Freedom of movement within Schengen Area']
      };
    }

    if (this.aseanCountries.has(nationality) && this.aseanCountries.has(destination)) {
      return {
        type: 'visa_free',
        maxStay: 30,
        notes: ['ASEAN member state agreement']
      };
    }

    if (this.gccCountries.has(nationality) && this.gccCountries.has(destination)) {
      return {
        type: 'visa_free',
        maxStay: 90,
        notes: ['GCC member state agreement']
      };
    }

    return null;
  }

  public getSpecialPrograms(
    nationality: string,
    destination: string
  ): VisaExemption[] {
    const programs = this.specialPrograms.get(destination);
    if (!programs) return [];

    const exemptions: VisaExemption[] = [];
    programs.forEach((programExemptions) => {
      exemptions.push(...programExemptions);
    });

    return exemptions;
  }

  public getVisaRequirements(
    nationality: string,
    destination: string,
    visaType: VisaType
  ): string[] {
    const baseRequirements = [
      'Valid passport',
      'Passport-size photos',
      'Proof of funds',
      'Travel insurance'
    ];

    const typeSpecificRequirements = this.getTypeSpecificRequirements(visaType);
    const countrySpecificRequirements = this.getCountrySpecificRequirements(destination, visaType);

    return [...baseRequirements, ...typeSpecificRequirements, ...countrySpecificRequirements];
  }

  private getTypeSpecificRequirements(visaType: VisaType): string[] {
    switch (visaType) {
      case VisaType.DIPLOMATIC:
        return [
          'Diplomatic note from sending country',
          'Official assignment letter',
          'Diplomatic passport'
        ];
      case VisaType.JOURNALIST:
        return [
          'Press credentials',
          'Assignment letter from media organization',
          'Portfolio of work'
        ];
      case VisaType.INVESTOR:
        return [
          'Business plan',
          'Proof of investment funds',
          'Company registration documents',
          'Financial statements'
        ];
      case VisaType.PERFORMER:
        return [
          'Performance contract',
          'Event details',
          'Sponsor letter',
          'Performance history'
        ];
      case VisaType.WORKING_HOLIDAY:
        return [
          'Age proof (18-30)',
          'Return ticket',
          'Sufficient funds for stay',
          'No dependent children'
        ];
      case VisaType.SKILLED_WORKER:
        return [
          'Job offer letter',
          'Educational qualifications',
          'Work experience certificates',
          'Skills assessment'
        ];
      case VisaType.SKILLED_MIGRATION:
        return [
          'Points assessment',
          'Skills assessment',
          'English proficiency test',
          'Health insurance'
        ];
      default:
        return [];
    }
  }

  private getCountrySpecificRequirements(destination: string, visaType: VisaType): string[] {
    const requirements: string[] = [];

    switch (destination) {
      case 'USA':
        requirements.push('DS-160 form');
        if (visaType === VisaType.STUDENT) {
          requirements.push('I-20 form', 'SEVIS fee payment receipt');
        }
        break;
      case 'UK':
        requirements.push('UK visa application form');
        if (visaType === VisaType.SKILLED_WORKER) {
          requirements.push('Certificate of Sponsorship', 'English language test results');
        }
        break;
      case 'Australia':
        requirements.push('Form 1419');
        if (visaType === VisaType.STUDENT) {
          requirements.push('Confirmation of Enrollment', 'OSHC health insurance');
        }
        break;
    }

    return requirements;
  }
} 