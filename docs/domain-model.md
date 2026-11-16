# Domain Model Reference — fatturafacile-mcp-server

The Fattura Facile ERP Domain Model provides a strongly-typed, multi-tenant representation of enterprise business processes. Every entity is designed to comply with Italian fiscal legislation (SDI, electronic invoicing, split payment) and European cross-border regulations.

---

## 1. Entities & Data Transfer Objects (DTOs)

### Customer (`CustomerDto`)

Represents individual clients, corporate entities, and public administration (PA) counterparts.

- `id`: Unique customer identifier (`cust_...`)
- `name`: Legal business name or individual full name
- `taxId`: Fiscal code (_Codice Fiscale_)
- `vatNumber`: Value-Added Tax ID (_Partita IVA_)
- `email`: Billing or administrative contact email
- `phone`: Contact telephone number
- `address`, `city`, `zipCode`, `country`: Fiscal registered address details
- `createdAt`: ISO 8601 creation timestamp

### Invoice (`InvoiceDto`)

Represents issued or received invoices conforming to the FatturaPA XML schema standard.

- `id`: Unique invoice identifier (`inv_...`)
- `number`: Formatted invoice sequence (e.g., `FATT-2026-001`)
- `customerId`: Foreign key to associated customer
- `customerName`: Denormalized customer legal name
- `issueDate`: Date of invoice generation
- `dueDate`: Payment due date
- `status`: State lifecycle:
  - `draft`: Editable working draft
  - `issued`: Formally generated and numbered
  - `sent`: Dispatched to client or SDI transmission channel
  - `paid`: Settled through reconciled incoming payment
  - `overdue`: Outstanding past the due date
  - `cancelled`: Formally voided or credited
- `items`: Array of itemized lines (`InvoiceItemDto` with `description`, `quantity`, `unitPrice`, `vatRate`, `total`)
- `subtotal`: Taxable base amount
- `vatAmount`: Total VAT charge
- `total`: Final payable amount (`subtotal + vatAmount`)
- `currency`: ISO 4217 currency code (default: `EUR`)

### Quote / Estimate (`QuoteDto`)

Commercial quotation or budget proposal presented to prospects or existing clients.

- `id`: Unique quote identifier (`quo_...`)
- `number`: Formatted estimate sequence (e.g., `PREV-2026-001`)
- `customerId`: Target client identifier
- `customerName`: Client name
- `issueDate`: Proposal date
- `expiryDate`: Commercial validity expiration date (default: 30 days)
- `status`: Lifecycle (`draft` -> `sent` -> `accepted` | `rejected` -> `converted`)
- `total`: Quoted monetary value
- `currency`: Currency code

### Payment (`PaymentDto`)

Financial transaction recording incoming payment against one or more open invoices.

- `id`: Transaction identifier (`pay_...`)
- `invoiceId`: Linked invoice ID
- `amount`: Settled payment value
- `paymentMethod`: Reconciled channel:
  - `bank_transfer` (_Bonifico Bancario_)
  - `credit_card` (_Carta di Credito_)
  - `direct_debit` (_RID / SDD Sepa Direct Debit_)
  - `cash` (_Cassa / Contanti_)
- `paidAt`: Timestamp of transaction clearance
- `reference`: Bank transfer memo or transaction ID
- `status`: Status (`completed`, `pending`, `failed`, `refunded`)

### Products & Services (`ProductDto`)

Catalog item representing either physical inventory or professional services.

- `id`: Catalog ID (`prod_...`)
- `code`: SKU, barcode, or internal accounting code
- `name`: Item designation
- `description`: Detailed specification
- `type`: `product` (tangible asset with warehouse stock tracking) or `service` (consultancy/hourly fee)
- `price`: Base selling price excluding tax
- `vatRate`: Applicable VAT percentage (e.g., 22%, 10%, 4%, 0% exempt)
- `stock`: Current quantity in inventory (for physical products)
- `category`: Functional grouping (e.g., _Hardware_, _Cloud_, _Consulting_)

### Company Profile (`CompanyDto`)

The legal tenant entity issuing invoices and managing accounting records.

- `id`: Internal tenant company identifier
- `legalName`: Registered company name
- `taxId`: Tax Code / Fiscal identification
- `vatNumber`: VAT registration number
- `pec`: Certified Electronic Mail (_Posta Elettronica Certificata_)
- `sdiCode`: 7-character recipient code for SDI electronic invoice delivery (_Codice Destinatario_)
- `address`, `city`, `country`, `currency`: Fiscal registration data
- `isMain`: Boolean indicator for the primary operating company in a multi-company group

### Project & Task (`ProjectDto`, `TaskDto`)

Operational structures linking billable activities and time tracking to customer accounts.

- `Project`: `id`, `name`, `code`, `customerId`, `budget`, `spent`, `status`
- `Task`: `id`, `projectId`, `title`, `description`, `assignedTo`, `status`, `dueDate`
