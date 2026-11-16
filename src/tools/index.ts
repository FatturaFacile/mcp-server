import { BaseTool } from './base/tool.js';
import {
  SearchCustomerTool,
  GetCustomerTool,
  CreateCustomerTool,
  UpdateCustomerTool,
  DeleteCustomerTool,
  ListCustomersTool,
} from './customers.js';
import {
  SearchInvoiceTool,
  GetInvoiceTool,
  CreateInvoiceTool,
  UpdateInvoiceTool,
  DeleteInvoiceTool,
  ListInvoicesTool,
  SendInvoiceTool,
  CancelInvoiceTool,
  DuplicateInvoiceTool,
} from './invoices.js';
import {
  SearchQuoteTool,
  GetQuoteTool,
  CreateQuoteTool,
  UpdateQuoteTool,
  DeleteQuoteTool,
  ListQuotesTool,
  ConvertQuoteToInvoiceTool,
} from './quotes.js';
import {
  SearchPaymentTool,
  RegisterPaymentTool,
  RefundPaymentTool,
  ListPaymentsTool,
} from './payments.js';
import {
  SearchProductTool,
  GetProductTool,
  CreateProductTool,
  UpdateProductTool,
  ListProductsTool,
  SearchServiceTool,
  GetServiceTool,
  CreateServiceTool,
  UpdateServiceTool,
  ListServicesTool,
} from './products.js';
import {
  SearchCompanyTool,
  GetCompanyTool,
  CreateCompanyTool,
  UpdateCompanyTool,
  ListCompaniesTool,
  SearchContactTool,
  GetContactTool,
  CreateContactTool,
  UpdateContactTool,
  ListContactsTool,
} from './companies.js';
import {
  SearchProjectTool,
  GetProjectTool,
  CreateProjectTool,
  UpdateProjectTool,
  ListProjectsTool,
  SearchTaskTool,
  GetTaskTool,
  CreateTaskTool,
  UpdateTaskTool,
  CompleteTaskTool,
  ListTasksTool,
} from './projects.js';
import {
  SearchFileTool,
  GetFileTool,
  UploadFileTool,
  DownloadFileTool,
  ListFilesTool,
} from './files.js';

export function getAllTools(): BaseTool<any, any>[] {
  return [
    // Customers
    new SearchCustomerTool(),
    new GetCustomerTool(),
    new CreateCustomerTool(),
    new UpdateCustomerTool(),
    new DeleteCustomerTool(),
    new ListCustomersTool(),

    // Invoices
    new SearchInvoiceTool(),
    new GetInvoiceTool(),
    new CreateInvoiceTool(),
    new UpdateInvoiceTool(),
    new DeleteInvoiceTool(),
    new ListInvoicesTool(),
    new SendInvoiceTool(),
    new CancelInvoiceTool(),
    new DuplicateInvoiceTool(),

    // Quotes
    new SearchQuoteTool(),
    new GetQuoteTool(),
    new CreateQuoteTool(),
    new UpdateQuoteTool(),
    new DeleteQuoteTool(),
    new ListQuotesTool(),
    new ConvertQuoteToInvoiceTool(),

    // Payments
    new SearchPaymentTool(),
    new RegisterPaymentTool(),
    new RefundPaymentTool(),
    new ListPaymentsTool(),

    // Products & Services
    new SearchProductTool(),
    new GetProductTool(),
    new CreateProductTool(),
    new UpdateProductTool(),
    new ListProductsTool(),
    new SearchServiceTool(),
    new GetServiceTool(),
    new CreateServiceTool(),
    new UpdateServiceTool(),
    new ListServicesTool(),

    // Companies & Contacts
    new SearchCompanyTool(),
    new GetCompanyTool(),
    new CreateCompanyTool(),
    new UpdateCompanyTool(),
    new ListCompaniesTool(),
    new SearchContactTool(),
    new GetContactTool(),
    new CreateContactTool(),
    new UpdateContactTool(),
    new ListContactsTool(),

    // Projects & Tasks
    new SearchProjectTool(),
    new GetProjectTool(),
    new CreateProjectTool(),
    new UpdateProjectTool(),
    new ListProjectsTool(),
    new SearchTaskTool(),
    new GetTaskTool(),
    new CreateTaskTool(),
    new UpdateTaskTool(),
    new CompleteTaskTool(),
    new ListTasksTool(),

    // Files
    new SearchFileTool(),
    new GetFileTool(),
    new UploadFileTool(),
    new DownloadFileTool(),
    new ListFilesTool(),
  ];
}

export * from './base/tool.js';
export * from './customers.js';
export * from './invoices.js';
export * from './quotes.js';
export * from './payments.js';
export * from './products.js';
export * from './companies.js';
export * from './projects.js';
export * from './files.js';
