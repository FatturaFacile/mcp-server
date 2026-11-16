import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export interface FileMetadataDto {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export class SearchFileTool extends BaseTool<{ query: string }, FileMetadataDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_file',
    description: 'Search documents, XML invoices, attachments, and contracts in ERP storage.',
    category: 'Files',
    requiredScopes: [PermissionScopes.FILES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(input: { query: string }): Promise<FileMetadataDto[]> {
    return [
      {
        id: 'file_001',
        name: `allegato_${input.query}.pdf`,
        sizeBytes: 1048576,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        url: 'https://storage.fatturafacile.eu/files/file_001.pdf',
      },
    ];
  }
}

export class GetFileTool extends BaseTool<{ id: string }, FileMetadataDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_file',
    description: 'Get file metadata and download link by ID.',
    category: 'Files',
    requiredScopes: [PermissionScopes.FILES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: { id: string }): Promise<FileMetadataDto | null> {
    return {
      id: input.id,
      name: 'Fattura_Elettronica_2026.xml',
      sizeBytes: 45200,
      mimeType: 'application/xml',
      uploadedAt: new Date().toISOString(),
      url: `https://storage.fatturafacile.eu/files/${input.id}`,
    };
  }
}

export class UploadFileTool extends BaseTool<
  {
    name: string;
    mimeType: string;
    contentBase64: string;
  },
  FileMetadataDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'upload_file',
    description: 'Upload a document or attachment into ERP storage.',
    category: 'Files',
    requiredScopes: [PermissionScopes.FILES_WRITE],
  };

  public override readonly inputSchema = z.object({
    name: z.string().min(1),
    mimeType: z.string().default('application/octet-stream'),
    contentBase64: z.string().min(1),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<FileMetadataDto> {
    const fileId = `file_${Date.now()}`;
    return {
      id: fileId,
      name: input.name,
      sizeBytes: Math.floor(input.contentBase64.length * 0.75),
      mimeType: input.mimeType,
      uploadedAt: new Date().toISOString(),
      url: `https://storage.fatturafacile.eu/tenants/${context.tenant.tenantId}/${fileId}`,
    };
  }
}

export class DownloadFileTool extends BaseTool<
  { id: string },
  { id: string; name: string; downloadUrl: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'download_file',
    description: 'Generate temporary secure download URL for an attachment.',
    category: 'Files',
    requiredScopes: [PermissionScopes.FILES_READ],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<{ id: string; name: string; downloadUrl: string }> {
    return {
      id: input.id,
      name: 'documento_scaricato.pdf',
      downloadUrl: `https://storage.fatturafacile.eu/download/${context.tenant.tenantId}/${input.id}?token=temp_token_123`,
    };
  }
}

export class ListFilesTool extends BaseTool<{ limit?: number }, FileMetadataDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_files',
    description: 'List recent files in ERP storage.',
    category: 'Files',
    requiredScopes: [PermissionScopes.FILES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().optional().default(20),
  });

  protected override async handle(): Promise<FileMetadataDto[]> {
    return [
      {
        id: 'file_001',
        name: 'Report_Vendite_Q1.pdf',
        sizeBytes: 2450000,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        url: 'https://storage.fatturafacile.eu/files/file_001.pdf',
      },
    ];
  }
}
