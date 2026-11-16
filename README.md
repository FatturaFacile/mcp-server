# fatturafacile-mcp-server

Official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](<https://img.shields.io/badge/Node.js-LTS%20(%3E%3D22.x)-brightgreen>)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![Package Manager](https://img.shields.io/badge/pnpm-12.x-orange)](https://pnpm.io/)
[![Build & Tests](https://img.shields.io/badge/Tests-15%2F15%20Passed-brightgreen)](https://vitest.dev/)

---

## Overview

`fatturafacile-mcp-server` is an enterprise-grade AI Gateway enabling LLMs, Autonomous Agents, and Copilots to safely, reliably, and auditably interact with the Fattura Facile ERP backend via the standard [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

It exposes comprehensive ERP operations across invoicing, CRM, quotation, catalog management, payments, and analytics, backed by strict multi-tenancy isolation, role-based access control (RBAC), OpenTelemetry distributed tracing, Redis caching, and transactional multi-step workflows.

---

## Architectural Highlights

- **OpenAPI Single Source of Truth:** All ERP communication is performed strictly via SDK client interfaces with no duplicate DTOs or handwritten HTTP models.
- **Multi-Tenancy & Zero Leakage:** Every execution is scoped by explicit `TenantContext`, `UserContext`, `CompanyContext`, and `PermissionContext`. Cache keys and audit trails are completely partitioned.
- **Unified Tool Framework:** Centralized lifecycle incorporating Zod schema validation, RBAC checks, OpenTelemetry spans, exponential backoff retries, structured error handling, and multi-tenant Redis caching.
- **Pluggable MCP Transports:** Native support for `stdio`, `streamable-http`, and legacy `sse` transports.
- **Agentic Workflow Engine:** Multi-step business workflows with automated compensation actions and transaction rollback support.
- **Vendor-Neutral Semantic Search:** Abstracted vector storage and retrieval layer for future RAG and knowledge graph capabilities.

---

## Capabilities Overview

### 1. 39 MCP Tools (Actions)

| Category                 | Available Tools                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customers**            | `search_customer`, `get_customer`, `create_customer`, `update_customer`, `delete_customer`, `list_customers`                                                                 |
| **Invoices**             | `search_invoice`, `get_invoice`, `create_invoice`, `update_invoice`, `delete_invoice`, `list_invoices`, `send_invoice`, `cancel_invoice`, `duplicate_invoice`                |
| **Quotes**               | `search_quote`, `get_quote`, `create_quote`, `update_quote`, `delete_quote`, `list_quotes`, `convert_quote_to_invoice`                                                       |
| **Payments**             | `search_payment`, `register_payment`, `refund_payment`, `list_payments`                                                                                                      |
| **Products & Services**  | `search_product`, `get_product`, `create_product`, `update_product`, `list_products`, `search_service`, `get_service`, `create_service`, `update_service`, `list_services`   |
| **Companies & Contacts** | `search_company`, `get_company`, `create_company`, `update_company`, `list_companies`, `search_contact`, `get_contact`, `create_contact`, `update_contact`, `list_contacts`  |
| **Projects & Tasks**     | `search_project`, `get_project`, `create_project`, `update_project`, `list_projects`, `search_task`, `get_task`, `create_task`, `update_task`, `complete_task`, `list_tasks` |
| **Files & Documents**    | `search_file`, `get_file`, `upload_file`, `download_file`, `list_files`                                                                                                      |

### 2. 22 Dynamic MCP Resources (Context)

- **Company:** `company://profile`, `company://settings`, `company://statistics`, `company://subscriptions`
- **Customers:** `customer://recent`, `customer://top`, `customer://inactive`, `customer://vip`
- **Products:** `product://catalog`, `product://top-selling`, `product://low-stock`
- **Quotes:** `quote://recent`, `quote://drafts`, `quote://expiring`
- **Invoices:** `invoice://latest`, `invoice://drafts`, `invoice://paid`, `invoice://overdue`, `invoice://unpaid`
- **Payments:** `payment://recent`, `payment://reconciliation`
- **Projects:** `project://recent`, `project://active`
- **Dashboards:** `dashboard://summary`, `dashboard://sales`, `dashboard://customers`, `dashboard://cashflow`, `dashboard://invoices`

### 3. 20 Pre-Engineered Prompts (Guided Interactions)

- **Sales:** `CreateQuotePrompt`, `CreateInvoicePrompt`, `SendInvoicePrompt`, `InvoiceReminderPrompt`, `SalesSummaryPrompt`, `SalesForecastPrompt`, `RevenueAnalysisPrompt`
- **Customers:** `CustomerLookupPrompt`, `CustomerAnalysisPrompt`, `CustomerRiskPrompt`, `CustomerHealthPrompt`
- **Finance:** `FinancialOverviewPrompt`, `CashFlowPrompt`, `ProfitabilityPrompt`, `OverdueInvoicesPrompt`, `RevenueForecastPrompt`
- **Productivity:** `DailySummaryPrompt`, `WeeklySummaryPrompt`, `ManagementReportPrompt`, `ExecutiveReportPrompt`

### 4. Agentic Workflows

- **Customer Onboarding & Quote Generation:** Multi-step client onboarding with automatic commercial quotation and compensation on failure.
- **Quote-to-Invoice Conversion & Dispatch:** Converts accepted customer quotes to official invoices and automatically transmits them.
- **Overdue Invoice Recovery:** Scans outstanding balances, calculates dunning terms, and dispatches compliant reminders.
- **Monthly Executive Reporting:** Aggregates P&L metrics, cashflow projections, and customer health for board briefings.

---

## Getting Started

### Prerequisites

- Node.js >= 22.x LTS
- `pnpm` >= 9.x (v12 supported)
- Redis (optional, in-memory cache fallback is active by default)

### Installation

```bash
# Clone the repository
git clone https://github.com/FatturaFacile/fatturafacile-mcp-server.git
cd fatturafacile-mcp-server

# Install dependencies
pnpm install --frozen-lockfile

# Configure environment
cp .env.example .env
```

### Running the Server

```bash
# Development mode with hot-reload
pnpm run dev

# Compile TypeScript to dist/
pnpm run build

# Start production server (stdio by default)
pnpm start

# Start with Streamable HTTP / SSE transport on port 3000
MCP_TRANSPORT=streamable-http PORT=3000 pnpm start
```

---

## Client Integration Examples

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["C:/dev/fattura-facile/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "FATTURA_FACILE_API_URL": "https://api.fatturafacile.eu",
        "FATTURA_FACILE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Cursor & Windsurf

In `.cursor/mcp.json` or Windsurf's `mcp_config.json`:

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["C:/dev/fattura-facile/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

---

## Testing & Quality Assurance

```bash
# Run unit and integration tests (Vitest)
pnpm test

# Run tests with code coverage
pnpm run test:coverage

# Typecheck with TypeScript strict mode
pnpm run typecheck

# Code linting
pnpm run lint

# Code style check
pnpm run format:check
```

---

## Docker Deployment

```bash
# Build and run containerized server with Redis
docker-compose up --build -d

# Check service health
curl http://localhost:3000/health
```

---

## Documentation

- [Architecture Specification](docs/architecture/ARCHITECTURE.md)
- [Domain Model Reference](docs/domain-model.md)
- [MCP Concepts Guide](docs/mcp-concepts.md)
- [Client Integration Guide](docs/client-integration.md)

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
