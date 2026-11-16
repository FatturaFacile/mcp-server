import { BaseResource } from './base/resource.js';
import { ResourceMetadata } from '../types/mcp.js';
import { ExecutionContext } from '../types/context.js';
import { PermissionScopes } from '../types/roles.js';
import { CompanyService } from '../services/company.service.js';
import { CustomerService } from '../services/customer.service.js';
import { ProductService } from '../services/product.service.js';
import { QuoteService } from '../services/quote.service.js';
import { InvoiceService } from '../services/invoice.service.js';
import { PaymentService } from '../services/payment.service.js';
import { ProjectService } from '../services/project.service.js';
import { DashboardService } from '../services/dashboard.service.js';

// Company Resources
export class CompanyProfileResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'company://profile',
    name: 'Company Profile',
    description: 'Current legal company identity, SDI code, VAT, and fiscal settings.',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 300,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return CompanyService.getProfile(context);
  }
}

export class CompanySettingsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'company://settings',
    name: 'Company Settings',
    description:
      'Fiscal regimes, electronic invoicing transmission configuration, and currency settings.',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 300,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    const profile = await CompanyService.getProfile(context);
    return {
      companyId: profile.id,
      electronicInvoicingEnabled: true,
      sdiTransmissionMethod: 'PEC_OR_SDI_CHANNEL',
      defaultCurrency: 'EUR',
      defaultPaymentDueDays: 30,
      fiscalRegime: 'RF01 - Ordinario',
    };
  }
}

export class CompanyStatisticsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'company://statistics',
    name: 'Company Statistics',
    description: 'Year-to-date business volume and customer counts.',
    requiredScopes: [PermissionScopes.ANALYTICS_READ],
    cacheTtlSeconds: 120,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return DashboardService.getSummary(context);
  }
}

export class CompanySubscriptionsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'company://subscriptions',
    name: 'Company Subscriptions',
    description: 'Active Fattura Facile SaaS plan, AI credits, and add-on modules.',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 300,
  };

  protected override async load(): Promise<unknown> {
    return {
      plan: 'Enterprise Multi-Company AI',
      status: 'active',
      modules: ['ElectronicInvoicing', 'CRM', 'Warehouse', 'AICopilotGateway'],
      renewalDate: '2026-12-31',
    };
  }
}

// Customers Resources
export class RecentCustomersResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'customer://recent',
    name: 'Recent Customers',
    description: 'List of recently added or updated customers.',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return CustomerService.list(10, context);
  }
}

export class TopCustomersResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'customer://top',
    name: 'Top Customers',
    description: 'Highest revenue generating customers.',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ, PermissionScopes.ANALYTICS_READ],
    cacheTtlSeconds: 180,
  };

  protected override async load(): Promise<unknown> {
    return [
      { id: 'cust_101', name: 'Acme Corporation S.r.l.', totalSpent: 48500, invoicesCount: 12 },
      { id: 'cust_102', name: 'Tech Solutions Ltd', totalSpent: 32000, invoicesCount: 8 },
    ];
  }
}

export class InactiveCustomersResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'customer://inactive',
    name: 'Inactive Customers',
    description: 'Customers with no purchases or invoices in the past 180 days.',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 300,
  };

  protected override async load(): Promise<unknown> {
    return [
      {
        id: 'cust_205',
        name: 'Beta Impianti S.n.c.',
        lastInvoiceDate: '2025-06-15',
        totalInvoices: 2,
      },
    ];
  }
}

export class VipCustomersResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'customer://vip',
    name: 'VIP Customers',
    description: 'Strategic accounts with dedicated SLA and payment terms.',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 300,
  };

  protected override async load(): Promise<unknown> {
    return [
      {
        id: 'cust_101',
        name: 'Acme Corporation S.r.l.',
        tier: 'Platinum',
        accountManager: 'Mario Rossi',
      },
    ];
  }
}

// Products Resources
export class ProductCatalogResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'product://catalog',
    name: 'Product Catalog',
    description: 'Complete active catalog of products and services.',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 120,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return ProductService.list(undefined, 50, context);
  }
}

export class TopSellingProductsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'product://top-selling',
    name: 'Top Selling Products',
    description: 'Top-selling products and services ranked by volume.',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 180,
  };

  protected override async load(): Promise<unknown> {
    return [
      {
        code: 'SW-CLOUD-01',
        name: 'Abbonamento Cloud Enterprise',
        unitsSold: 120,
        totalRevenue: 35880,
      },
    ];
  }
}

export class LowStockProductsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'product://low-stock',
    name: 'Low Stock Products',
    description: 'Items below minimum reorder threshold in inventory.',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(): Promise<unknown> {
    return [{ code: 'HW-ROUTER-5G', name: 'Gateway SD-WAN Enterprise', stock: 2, reorderLevel: 5 }];
  }
}

// Quotes Resources
export class RecentQuotesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'quote://recent',
    name: 'Recent Quotes',
    description: 'Latest estimates created across customers.',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return QuoteService.list(undefined, 10, context);
  }
}

export class DraftQuotesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'quote://drafts',
    name: 'Draft Quotes',
    description: 'Unsent quotes in draft state.',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return QuoteService.list('draft', 10, context);
  }
}

export class ExpiringQuotesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'quote://expiring',
    name: 'Expiring Quotes',
    description: 'Quotes expiring within the next 7 days.',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(): Promise<unknown> {
    return [
      {
        id: 'quo_1',
        number: 'PREV-2026-001',
        customerName: 'Acme Corporation S.r.l.',
        expiryDate: '2026-03-31',
        total: 5000,
      },
    ];
  }
}

// Invoices Resources
export class LatestInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'invoice://latest',
    name: 'Latest Invoices',
    description: 'Most recently issued invoices.',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list(undefined, 10, context);
  }
}

export class DraftInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'invoice://drafts',
    name: 'Draft Invoices',
    description: 'Invoices currently in draft status, pending issuance.',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list('draft', 10, context);
  }
}

export class PaidInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'invoice://paid',
    name: 'Paid Invoices',
    description: 'Fully paid and settled invoices.',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list('paid', 20, context);
  }
}

export class OverdueInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'invoice://overdue',
    name: 'Overdue Invoices',
    description: 'Invoices that exceeded due payment date.',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list('overdue', 20, context);
  }
}

export class UnpaidInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'invoice://unpaid',
    name: 'Unpaid Invoices',
    description: 'All outstanding unpaid invoices (issued or overdue).',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list('issued', 20, context);
  }
}

// Payments Resources
export class RecentPaymentsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'payment://recent',
    name: 'Recent Payments',
    description: 'Recent bank transfers and payments reconciled.',
    requiredScopes: [PermissionScopes.PAYMENTS_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return PaymentService.list(10, context);
  }
}

export class PaymentReconciliationResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'payment://reconciliation',
    name: 'Payment Reconciliation',
    description: 'Bank transactions pending match with open invoices.',
    requiredScopes: [PermissionScopes.PAYMENTS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(): Promise<unknown> {
    return [
      {
        transactionId: 'tx_998',
        amount: 1830.0,
        date: '2026-03-10',
        counterparty: 'Tech Solutions Ltd',
        matchedInvoiceId: 'inv_2',
      },
    ];
  }
}

// Projects Resources
export class RecentProjectsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'project://recent',
    name: 'Recent Projects',
    description: 'Recently created projects and contracts.',
    requiredScopes: [PermissionScopes.PROJECTS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return ProjectService.listProjects(undefined, context);
  }
}

export class ActiveProjectsResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'project://active',
    name: 'Active Projects',
    description: 'Currently running client projects.',
    requiredScopes: [PermissionScopes.PROJECTS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return ProjectService.listProjects('active', context);
  }
}

// Dashboards Resources
export class DashboardSummaryResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'dashboard://summary',
    name: 'Dashboard Summary',
    description: 'Executive summary with revenue, overdue receivables, and metrics.',
    requiredScopes: [PermissionScopes.DASHBOARDS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return DashboardService.getSummary(context);
  }
}

export class DashboardSalesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'dashboard://sales',
    name: 'Sales Dashboard',
    description: 'Sales volume, quote conversion rates, and monthly targets.',
    requiredScopes: [PermissionScopes.DASHBOARDS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(): Promise<unknown> {
    return {
      monthlySalesTarget: 80000,
      currentSales: 61000,
      quoteConversionRate: 0.68,
      dealsInPipeline: 14,
    };
  }
}

export class DashboardCustomersResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'dashboard://customers',
    name: 'Customers Dashboard',
    description: 'Active accounts, customer retention, and churn rate.',
    requiredScopes: [PermissionScopes.DASHBOARDS_READ],
    cacheTtlSeconds: 120,
  };

  protected override async load(): Promise<unknown> {
    return {
      totalCustomers: 78,
      activeThisMonth: 65,
      retentionRate: 0.96,
      newCustomersThisQuarter: 9,
    };
  }
}

export class DashboardCashflowResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'dashboard://cashflow',
    name: 'Cashflow Dashboard',
    description: 'Cash inflows vs outflows and liquidity projections.',
    requiredScopes: [PermissionScopes.DASHBOARDS_READ],
    cacheTtlSeconds: 60,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return DashboardService.getCashFlow(context);
  }
}

export class DashboardInvoicesResource extends BaseResource {
  public override readonly metadata: ResourceMetadata = {
    uri: 'dashboard://invoices',
    name: 'Invoices Dashboard',
    description: 'Breakdown of issued, paid, overdue, and draft invoices.',
    requiredScopes: [PermissionScopes.DASHBOARDS_READ],
    cacheTtlSeconds: 30,
  };

  protected override async load(context: ExecutionContext): Promise<unknown> {
    return InvoiceService.list(undefined, 20, context);
  }
}

export function getAllResources(): BaseResource<any>[] {
  return [
    // Company
    new CompanyProfileResource(),
    new CompanySettingsResource(),
    new CompanyStatisticsResource(),
    new CompanySubscriptionsResource(),

    // Customers
    new RecentCustomersResource(),
    new TopCustomersResource(),
    new InactiveCustomersResource(),
    new VipCustomersResource(),

    // Products
    new ProductCatalogResource(),
    new TopSellingProductsResource(),
    new LowStockProductsResource(),

    // Quotes
    new RecentQuotesResource(),
    new DraftQuotesResource(),
    new ExpiringQuotesResource(),

    // Invoices
    new LatestInvoicesResource(),
    new DraftInvoicesResource(),
    new PaidInvoicesResource(),
    new OverdueInvoicesResource(),
    new UnpaidInvoicesResource(),

    // Payments
    new RecentPaymentsResource(),
    new PaymentReconciliationResource(),

    // Projects
    new RecentProjectsResource(),
    new ActiveProjectsResource(),

    // Dashboards
    new DashboardSummaryResource(),
    new DashboardSalesResource(),
    new DashboardCustomersResource(),
    new DashboardCashflowResource(),
    new DashboardInvoicesResource(),
  ];
}
