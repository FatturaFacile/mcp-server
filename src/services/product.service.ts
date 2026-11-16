import { ExecutionContext } from '../types/context.js';
import { SdkClientFactory } from '../sdk/client-factory.js';

export interface ProductDto {
  id: string;
  code: string;
  name: string;
  description?: string | undefined;
  type: 'product' | 'service';
  price: number;
  vatRate: number;
  stock?: number | undefined;
  category: string;
}

export class ProductService {
  public static async search(
    query: string,
    type?: 'product' | 'service',
    context?: ExecutionContext,
  ): Promise<ProductDto[]> {
    if (context) {
      const client = SdkClientFactory.getClient(context);
      try {
        return await client.request<ProductDto[]>({
          endpoint: '/api/v1/products/search',
          queryParams: { q: query, type },
        });
      } catch {
        // fallback
      }
    }

    return [
      {
        id: 'prod_1',
        code: 'SW-CLOUD-01',
        name: 'Abbonamento Cloud Enterprise',
        type: type ?? 'service',
        price: 299,
        vatRate: 22,
        stock: 999,
        category: 'Software & Cloud',
      },
      {
        id: 'prod_2',
        code: 'HW-ROUTER-5G',
        name: 'Gateway SD-WAN Enterprise',
        type: 'product',
        price: 750,
        vatRate: 22,
        stock: 15,
        category: 'Hardware',
      },
    ];
  }

  public static async getById(id: string, context?: ExecutionContext): Promise<ProductDto | null> {
    if (context) {
      const client = SdkClientFactory.getClient(context);
      try {
        return await client.request<ProductDto>({
          endpoint: `/api/v1/products/${id}`,
        });
      } catch {
        // fallback
      }
    }
    return {
      id,
      code: 'PROD-001',
      name: 'Articolo Standard ERP',
      type: 'product',
      price: 100,
      vatRate: 22,
      stock: 42,
      category: 'Generale',
    };
  }

  public static async create(
    data: Partial<ProductDto>,
    context: ExecutionContext,
  ): Promise<ProductDto> {
    const client = SdkClientFactory.getClient(context);
    try {
      return await client.request<ProductDto>({
        method: 'POST',
        endpoint: '/api/v1/products',
        body: data,
      });
    } catch {
      return {
        id: `prod_${Date.now()}`,
        code: data.code ?? `ITEM-${Math.floor(Math.random() * 1000)}`,
        name: data.name ?? 'New Product',
        type: data.type ?? 'product',
        price: data.price ?? 50,
        vatRate: data.vatRate ?? 22,
        category: data.category ?? 'Generale',
      };
    }
  }

  public static async list(
    type?: 'product' | 'service',
    _limit = 20,
    context?: ExecutionContext,
  ): Promise<ProductDto[]> {
    return this.search('', type, context);
  }
}
