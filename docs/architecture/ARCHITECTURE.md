# Enterprise Architecture Specification — fatturafacile-mcp-server

`fatturafacile-mcp-server` is the official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem. It exposes ERP capabilities through the standard Model Context Protocol, enabling seamless, secure, and auditable interactions for AI agents, assistants, copilots, and autonomous platforms.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["AI Clients & Orchestrators"]
        C1["Microsoft Copilot / M365"]
        C2["ChatGPT / OpenAI Agents SDK"]
        C3["Claude Desktop / Claude Code"]
        C4["Cursor / Windsurf / VS Code"]
        C5["LangChain / Semantic Kernel / CrewAI"]
    end

    subgraph MCPGateway["fatturafacile-mcp-server (AI Gateway)"]
        subgraph Transports["Transport Adapters (src/transport)"]
            T1["stdio"]
            T2["streamable-http"]
            T3["sse (legacy compatibility)"]
        end

        subgraph CoreServer["MCP Protocol Core (src/server)"]
            SRV["McpServer Engine"]
            REG["Capabilities Registry"]
        end

        subgraph SecurityLayer["Security & Governance"]
            AUTH["Authentication (src/auth)"]
            RBAC["Authorization & RBAC (src/permissions)"]
            SEC["Rate Limiter & Sanitizer (src/security)"]
            AUD["Audit Trail Logger (src/audit)"]
            OTEL["OpenTelemetry Tracing & Metrics (src/telemetry)"]
        end

        subgraph Framework["Unified Execution Framework"]
            TFW["Tool Framework (src/tools/base)"]
            RFW["Resource Framework (src/resources/base)"]
            PFW["Prompt Framework (src/prompts/base)"]
            WFW["Workflow Engine (src/workflows)"]
            ORCH["Multi-Tool Orchestrator (src/orchestration)"]
        end

        subgraph InfraAdapters["Infrastructure & State"]
            CACHE["Redis Multi-Tenant Cache (src/cache)"]
            QUEUE["Async Queue Worker (src/queue)"]
            SEM["Semantic Search Abstraction (src/search)"]
            SDK["OpenAPI SDK Client Factory (src/sdk)"]
        end
    end

    subgraph Backend["Fattura Facile ERP Backend"]
        ERP["REST API (api.fatturafacile.eu)"]
    end

    Clients --> Transports
    Transports --> CoreServer
    CoreServer --> SecurityLayer
    SecurityLayer --> Framework
    Framework --> InfraAdapters
    InfraAdapters --> CACHE
    InfraAdapters --> QUEUE
    SDK --> ERP
```

---

## 2. Domain Model & Multi-Tenant Context Hierarchy

In accordance with enterprise multi-tenancy requirements, every execution is strictly scoped:

```mermaid
classDiagram
    class ExecutionContext {
        +TenantContext tenant
        +UserContext user
        +CompanyContext company
        +PermissionContext permissions
        +string correlationId
        +Date timestamp
    }

    class TenantContext {
        +string tenantId
        +string partitionKey
        +string isolationLevel
        +string[] features
    }

    class UserContext {
        +string userId
        +string email
        +UserRole role
        +string[] groups
    }

    class CompanyContext {
        +string companyId
        +string legalName
        +string taxId
        +string country
        +string currency
    }

    class PermissionContext {
        +string[] scopes
        +boolean isSuperAdmin
        +hasScope(scope: string) boolean
        +assertScope(scope: string) void
    }

    ExecutionContext *-- TenantContext
    ExecutionContext *-- UserContext
    ExecutionContext *-- CompanyContext
    ExecutionContext *-- PermissionContext
```

### Context Isolation Invariants:

1. **Zero Cross-Tenant Leakage:** No query, cache entry, or ERP call can be dispatched without an active `TenantContext`.
2. **Cache Partitioning:** Redis keys strictly follow `tenant:{tenantId}:company:{companyId}:{entity}:{id}`.
3. **Audit Trail Immutability:** Audit records persist tenant, user, company, tool, arguments, duration, and status.

---

## 3. Module Boundaries & Clean Architecture

The codebase strictly adheres to Clean Architecture and SOLID principles:

- `src/bootstrap`: Container lifecycle, process signals (`SIGINT`, `SIGTERM`), graceful teardown.
- `src/config`: Strongly typed environment loading with Zod validation.
- `src/server`: Model Context Protocol server configuration and capability registration.
- `src/transport`: Pluggable transports (`stdio`, `streamable-http`, `sse`).
- `src/auth`: Provider-agnostic token verification (API Key, Bearer JWT, Service Token).
- `src/security`: Rate limiting (Token Bucket), request/response sanitization, security policies.
- `src/permissions`: RBAC evaluation, role-to-scope mappings, company-level data access rules.
- `src/audit`: Structured event logging, audit trail emitters.
- `src/telemetry`: OpenTelemetry tracer, meters, baggage propagation, span lifecycle.
- `src/cache`: Redis cache manager with tenant-scoped keyspaces and in-memory fallback.
- `src/queue`: Background job processing and async workflow runners.
- `src/sdk`: ERP client factory and SDK configuration utilizing `@fatturafacile/openapi-sdk`.
- `src/services`: Core domain services orchestrating SDK operations (Invoices, Customers, etc.).
- `src/workflows`: Deterministic multi-step business workflows.
- `src/orchestration`: Multi-tool planners, execution graphs, compensation & rollback handlers.
- `src/tools`: 39 Domain MCP tools extending the unified base framework.
- `src/resources`: 22 Dynamic MCP resources exposing readable ERP context.
- `src/prompts`: 20 Pre-engineered prompts for LLM workflows.
- `src/schemas`: Shared Zod validation schemas.
- `src/types`: TypeScript contracts, contexts, and helper types.
- `src/validation`: Validation utilities and schema transformers.
- `src/errors`: Standard error classes mapping to MCP protocol error codes.

---

## 4. Security, Authentication & Authorization Sequence

```mermaid
sequenceDiagram
    participant Client as AI Agent / Client
    participant Transport as Transport Adapter
    participant Auth as Auth & Security Guard
    participant RBAC as Permission Engine
    participant Tool as MCP Base Tool
    participant Audit as Audit Trail
    participant SDK as OpenAPI SDK Client
    participant ERP as Fattura Facile ERP

    Client->>Transport: Send Tool Call (JSON-RPC)
    Transport->>Auth: Extract Credentials (API Key / JWT)
    Auth->>Auth: Validate Token & Build ExecutionContext
    alt Invalid Credentials
        Auth-->>Transport: 401 Unauthorized / McpError(InvalidParams)
        Transport-->>Client: Error Response
    end
    Auth->>RBAC: Assert Required Scopes (e.g., invoices:create)
    alt Permission Denied
        RBAC->>Audit: Emit Unauthorized Attempt Event
        RBAC-->>Transport: 403 Forbidden / McpError(Unauthorized)
        Transport-->>Client: Error Response
    end
    RBAC->>Tool: Execute with ExecutionContext & Input
    Tool->>Audit: Record Tool Invocations
    Tool->>SDK: Call ERP Operation with Tenant Header
    SDK->>ERP: HTTP Request (X-Tenant-ID, Authorization)
    ERP-->>SDK: Domain Entity / Response
    SDK-->>Tool: Validated DTO
    Tool->>Audit: Record Result & Duration
    Tool-->>Transport: Mcp Tool Result
    Transport-->>Client: Success Response
```

---

## 5. Workflow & Orchestration Model

The workflow engine coordinates multi-step business transactions:

- **Transaction Boundaries:** Logical transaction boundaries spanning multiple ERP actions.
- **Compensation Actions:** If Step 2 fails, Step 1 triggers registered compensation (e.g., canceling draft invoice if payment registration fails).
- **Audit Integration:** Workflows register beginning, checkpoint, and completion events in the audit trail.
