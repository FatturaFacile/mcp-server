import { ExecutionContext } from '../types/context.js';

export interface SearchDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  score?: number;
}

export interface SemanticSearchQuery {
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
  minScore?: number;
  hybridWeight?: number; // 0.0 (lexical) to 1.0 (dense vector)
}

export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface IVectorStore {
  upsert(tenantId: string, companyId: string, documents: SearchDocument[]): Promise<void>;
  query(
    tenantId: string,
    companyId: string,
    vector: number[],
    query: SemanticSearchQuery,
  ): Promise<SearchDocument[]>;
  delete(tenantId: string, companyId: string, documentIds: string[]): Promise<void>;
}

export class InMemoryVectorStore implements IVectorStore {
  private readonly store = new Map<string, SearchDocument[]>();

  private getStoreKey(tenantId: string, companyId: string): string {
    return `${tenantId}:${companyId}`;
  }

  public async upsert(
    tenantId: string,
    companyId: string,
    documents: SearchDocument[],
  ): Promise<void> {
    const key = this.getStoreKey(tenantId, companyId);
    const existing = this.store.get(key) ?? [];
    const updated = [
      ...existing.filter((doc) => !documents.some((d) => d.id === doc.id)),
      ...documents,
    ];
    this.store.set(key, updated);
  }

  public async query(
    tenantId: string,
    companyId: string,
    _vector: number[],
    searchQuery: SemanticSearchQuery,
  ): Promise<SearchDocument[]> {
    const key = this.getStoreKey(tenantId, companyId);
    const documents = this.store.get(key) ?? [];
    const limit = searchQuery.limit ?? 10;

    // Lexical + mock similarity scoring
    return documents
      .map((doc) => ({
        ...doc,
        score: doc.content.toLowerCase().includes(searchQuery.query.toLowerCase()) ? 0.95 : 0.5,
      }))
      .filter((doc) => (doc.score ?? 0) >= (searchQuery.minScore ?? 0.6))
      .slice(0, limit);
  }

  public async delete(tenantId: string, companyId: string, documentIds: string[]): Promise<void> {
    const key = this.getStoreKey(tenantId, companyId);
    const existing = this.store.get(key) ?? [];
    this.store.set(
      key,
      existing.filter((doc) => !documentIds.includes(doc.id)),
    );
  }
}

export class SemanticSearchEngine {
  constructor(
    private readonly vectorStore: IVectorStore = new InMemoryVectorStore(),
    private readonly embeddingProvider?: IEmbeddingProvider,
  ) {}

  public async search(
    query: SemanticSearchQuery,
    context: ExecutionContext,
  ): Promise<SearchDocument[]> {
    let queryVector: number[] = [];
    if (this.embeddingProvider) {
      queryVector = await this.embeddingProvider.generateEmbedding(query.query);
    }
    return this.vectorStore.query(
      context.tenant.tenantId,
      context.company.companyId,
      queryVector,
      query,
    );
  }

  public async indexDocuments(
    documents: SearchDocument[],
    context: ExecutionContext,
  ): Promise<void> {
    return this.vectorStore.upsert(context.tenant.tenantId, context.company.companyId, documents);
  }
}

export const semanticSearch = new SemanticSearchEngine();
