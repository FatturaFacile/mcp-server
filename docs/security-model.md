# Security, Multi-Tenancy & Governance Model — fatturafacile-mcp-server

`fatturafacile-mcp-server` operates as a secure AI Gateway where all actions are mediated, authenticated, audited, and strictly isolated across enterprise tenants.

---

## 1. Authentication Layer

The server supports provider-agnostic authentication:

- **API Keys:** Provided via headers (`X-API-Key`) or environment configuration for internal services and CLI workers.
- **Bearer Tokens / JWT:** For authenticated interactive sessions, passing subject claims, tenant ID, and user roles.
- **Service Tokens:** Dedicated machine-to-machine tokens with scoped privileges.

Authentication decodes credentials into a strongly typed `ExecutionContext`.

---

## 2. Multi-Tenancy & Zero Tenant Leakage

Every execution is executed within an isolated multi-tenant boundary:

```typescript
interface ExecutionContext {
  readonly correlationId: string;
  readonly tenant: TenantContext;
  readonly user: UserContext;
  readonly company: CompanyContext;
  readonly permissions: PermissionContext;
  readonly timestamp: Date;
}
```

### Invariants:

1. **Cache Isolation:** Redis keys strictly follow `tenant:{tenantId}:company:{companyId}:{key}`. An agent operating in Tenant A can never read or invalidate data belonging to Tenant B.
2. **Backend ERP Boundaries:** Outgoing requests to the ERP backend automatically inject `X-Tenant-ID` and `X-Company-ID` extracted from the verified context.
3. **Database & Memory Partitions:** Internal in-memory queues and vector indices partition documents by the compound key `tenantId:companyId`.

---

## 3. Role-Based Access Control (RBAC)

The server enforces role-to-scope resolution:

- **SuperAdministrator:** Full unconstrained access (`*`).
- **OrganizationAdministrator:** All ERP domain permissions.
- **Manager:** Full operational permissions across CRM, billing, catalog, and analytics; restricted from sensitive admin settings.
- **Employee:** Day-to-day operations (viewing customers, managing assigned tasks, drafting invoices).
- **Agent:** Automated agentic execution with scoped permissions for quote generation, invoice processing, and CRM searches.
- **ReadOnlyUser:** Read-only access to customer, invoice, and dashboard resources.

If an agent attempts an action without holding the required scope, execution is halted immediately and an audit security violation event is recorded.

---

## 4. Rate Limiting & Abuse Prevention

A token bucket rate limiter inspects incoming requests per tenant and user ID:

- Default: 100 requests per 60-second window (configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`).
- Throttled requests receive standard MCP error code `-32029` (`RATE_LIMITED`).

---

## 5. Data Sanitization & Secret Scrubbing

All tool arguments, results, and audit messages pass through `DataSanitizer`:

- Tokens, API keys, passwords, and cryptographic keys matching security regexes are scrubbed and replaced with `******`.
- Personally Identifiable Information (PII) is prevented from leaking into general logging outputs.
