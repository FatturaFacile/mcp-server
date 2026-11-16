/**
 * Permission scopes and role definitions for Fattura Facile ERP.
 */

export const PermissionScopes = {
  // Customers
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_DELETE: 'customers:delete',

  // Companies
  COMPANIES_READ: 'companies:read',
  COMPANIES_WRITE: 'companies:write',

  // Contacts
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',

  // Products & Services
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  SERVICES_READ: 'services:read',
  SERVICES_WRITE: 'services:write',

  // Quotes
  QUOTES_READ: 'quotes:read',
  QUOTES_WRITE: 'quotes:write',
  QUOTES_DELETE: 'quotes:delete',
  QUOTES_CONVERT: 'quotes:convert',

  // Invoices
  INVOICES_READ: 'invoices:read',
  INVOICES_WRITE: 'invoices:write',
  INVOICES_DELETE: 'invoices:delete',
  INVOICES_SEND: 'invoices:send',
  INVOICES_CANCEL: 'invoices:cancel',

  // Payments
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_WRITE: 'payments:write',

  // Projects & Tasks
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',

  // Files & Attachments
  FILES_READ: 'files:read',
  FILES_WRITE: 'files:write',

  // Dashboards & Analytics
  DASHBOARDS_READ: 'dashboards:read',
  ANALYTICS_READ: 'analytics:read',

  // Workflows
  WORKFLOWS_EXECUTE: 'workflows:execute',

  // Administration
  ADMIN_FULL: 'admin:full',
} as const;

export type PermissionScope = (typeof PermissionScopes)[keyof typeof PermissionScopes];

export const RoleScopeMatrix: Record<string, readonly string[]> = {
  SuperAdministrator: ['*'],
  OrganizationAdministrator: Object.values(PermissionScopes),
  Manager: [
    PermissionScopes.CUSTOMERS_READ,
    PermissionScopes.CUSTOMERS_WRITE,
    PermissionScopes.COMPANIES_READ,
    PermissionScopes.CONTACTS_READ,
    PermissionScopes.CONTACTS_WRITE,
    PermissionScopes.PRODUCTS_READ,
    PermissionScopes.PRODUCTS_WRITE,
    PermissionScopes.SERVICES_READ,
    PermissionScopes.SERVICES_WRITE,
    PermissionScopes.QUOTES_READ,
    PermissionScopes.QUOTES_WRITE,
    PermissionScopes.QUOTES_CONVERT,
    PermissionScopes.INVOICES_READ,
    PermissionScopes.INVOICES_WRITE,
    PermissionScopes.INVOICES_SEND,
    PermissionScopes.PAYMENTS_READ,
    PermissionScopes.PAYMENTS_WRITE,
    PermissionScopes.PROJECTS_READ,
    PermissionScopes.PROJECTS_WRITE,
    PermissionScopes.TASKS_READ,
    PermissionScopes.TASKS_WRITE,
    PermissionScopes.FILES_READ,
    PermissionScopes.FILES_WRITE,
    PermissionScopes.DASHBOARDS_READ,
    PermissionScopes.ANALYTICS_READ,
    PermissionScopes.WORKFLOWS_EXECUTE,
  ],
  Employee: [
    PermissionScopes.CUSTOMERS_READ,
    PermissionScopes.CONTACTS_READ,
    PermissionScopes.PRODUCTS_READ,
    PermissionScopes.SERVICES_READ,
    PermissionScopes.QUOTES_READ,
    PermissionScopes.INVOICES_READ,
    PermissionScopes.PROJECTS_READ,
    PermissionScopes.PROJECTS_WRITE,
    PermissionScopes.TASKS_READ,
    PermissionScopes.TASKS_WRITE,
    PermissionScopes.FILES_READ,
    PermissionScopes.FILES_WRITE,
  ],
  Agent: [
    PermissionScopes.CUSTOMERS_READ,
    PermissionScopes.CUSTOMERS_WRITE,
    PermissionScopes.COMPANIES_READ,
    PermissionScopes.CONTACTS_READ,
    PermissionScopes.PRODUCTS_READ,
    PermissionScopes.SERVICES_READ,
    PermissionScopes.QUOTES_READ,
    PermissionScopes.QUOTES_WRITE,
    PermissionScopes.QUOTES_CONVERT,
    PermissionScopes.INVOICES_READ,
    PermissionScopes.INVOICES_WRITE,
    PermissionScopes.INVOICES_SEND,
    PermissionScopes.PAYMENTS_READ,
    PermissionScopes.PAYMENTS_WRITE,
    PermissionScopes.PROJECTS_READ,
    PermissionScopes.TASKS_READ,
    PermissionScopes.FILES_READ,
    PermissionScopes.DASHBOARDS_READ,
    PermissionScopes.WORKFLOWS_EXECUTE,
  ],
  ReadOnlyUser: [
    PermissionScopes.CUSTOMERS_READ,
    PermissionScopes.COMPANIES_READ,
    PermissionScopes.CONTACTS_READ,
    PermissionScopes.PRODUCTS_READ,
    PermissionScopes.SERVICES_READ,
    PermissionScopes.QUOTES_READ,
    PermissionScopes.INVOICES_READ,
    PermissionScopes.PAYMENTS_READ,
    PermissionScopes.PROJECTS_READ,
    PermissionScopes.TASKS_READ,
    PermissionScopes.FILES_READ,
    PermissionScopes.DASHBOARDS_READ,
  ],
};
