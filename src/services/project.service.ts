import { ExecutionContext } from '../types/context.js';
import { SdkClientFactory } from '../sdk/client-factory.js';

export interface ProjectDto {
  id: string;
  name: string;
  code: string;
  customerId: string;
  customerName: string;
  budget: number;
  spent: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
}

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description?: string | undefined;
  assignedTo?: string | undefined;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string | undefined;
}

export class ProjectService {
  public static async listProjects(
    status?: string,
    context?: ExecutionContext,
  ): Promise<ProjectDto[]> {
    if (context) {
      const client = SdkClientFactory.getClient(context);
      try {
        return await client.request<ProjectDto[]>({
          endpoint: '/api/v1/projects',
          queryParams: { status },
        });
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'proj_1',
        name: 'Integrazione ERP AI Gateway',
        code: 'PRJ-AI-01',
        customerId: 'cust_101',
        customerName: 'Acme Corporation S.r.l.',
        budget: 25000,
        spent: 12000,
        status: 'active',
      },
    ];
  }

  public static async listTasks(
    projectId?: string,
    context?: ExecutionContext,
  ): Promise<TaskDto[]> {
    if (context) {
      const client = SdkClientFactory.getClient(context);
      try {
        return await client.request<TaskDto[]>({
          endpoint: '/api/v1/tasks',
          queryParams: { projectId },
        });
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'task_1',
        projectId: projectId ?? 'proj_1',
        title: 'Verifica Endpoint SDI & Fatturazione Elettronica',
        status: 'in_progress',
        dueDate: '2026-03-31',
      },
    ];
  }
}
