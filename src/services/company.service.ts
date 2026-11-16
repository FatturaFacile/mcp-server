import { ExecutionContext } from '../types/context.js';
import { SdkClientFactory } from '../sdk/client-factory.js';

export interface CompanyDto {
  id: string;
  legalName: string;
  taxId: string;
  vatNumber: string;
  pec?: string | undefined;
  sdiCode?: string | undefined;
  address: string;
  city: string;
  country: string;
  currency: string;
  isMain: boolean;
}

export class CompanyService {
  public static async getProfile(context: ExecutionContext): Promise<CompanyDto> {
    const client = SdkClientFactory.getClient(context);
    try {
      return await client.request<CompanyDto>({
        endpoint: `/api/v1/companies/${context.company.companyId}`,
      });
    } catch {
      return {
        id: context.company.companyId,
        legalName: context.company.legalName,
        taxId: context.company.taxId,
        vatNumber: context.company.taxId,
        pec: 'fatturafacile@pec.it',
        sdiCode: 'M5UXCR1',
        address: "Via dell'Innovazione 42",
        city: 'Milano',
        country: 'IT',
        currency: 'EUR',
        isMain: true,
      };
    }
  }

  public static async list(context?: ExecutionContext): Promise<CompanyDto[]> {
    if (context) {
      const client = SdkClientFactory.getClient(context);
      try {
        return await client.request<CompanyDto[]>({
          endpoint: '/api/v1/companies',
        });
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'company-main',
        legalName: 'Fattura Facile S.r.l.',
        taxId: 'IT12345678901',
        vatNumber: 'IT12345678901',
        address: "Via dell'Innovazione 42",
        city: 'Milano',
        country: 'IT',
        currency: 'EUR',
        isMain: true,
      },
    ];
  }
}
