import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { ProjectService, ProjectDto, TaskDto } from '../services/project.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchProjectTool extends BaseTool<{ query: string }, ProjectDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_project',
    description: 'Search ERP projects by name or code.',
    category: 'Projects',
    requiredScopes: [PermissionScopes.PROJECTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(
    _input: { query: string },
    context: ExecutionContext,
  ): Promise<ProjectDto[]> {
    return ProjectService.listProjects(undefined, context);
  }
}

export class GetProjectTool extends BaseTool<{ id: string }, ProjectDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_project',
    description: 'Get project details, spent budget, and progress.',
    category: 'Projects',
    requiredScopes: [PermissionScopes.PROJECTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: { id: string }): Promise<ProjectDto | null> {
    return {
      id: input.id,
      name: 'Progetto ERP Gateway',
      code: 'PRJ-01',
      customerId: 'cust_101',
      customerName: 'Acme Corporation S.r.l.',
      budget: 15000,
      spent: 8000,
      status: 'active',
    };
  }
}

export class CreateProjectTool extends BaseTool<
  {
    name: string;
    code: string;
    customerId: string;
    budget: number;
  },
  ProjectDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_project',
    description: 'Create a new project linked to a customer.',
    category: 'Projects',
    requiredScopes: [PermissionScopes.PROJECTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    customerId: z.string().min(1),
    budget: z.number().nonnegative(),
  });

  protected override async handle(input: z.infer<typeof this.inputSchema>): Promise<ProjectDto> {
    return {
      id: `proj_${Date.now()}`,
      customerName: 'Acme Corporation S.r.l.',
      spent: 0,
      status: 'planning',
      ...input,
    };
  }
}

export class UpdateProjectTool extends BaseTool<
  { id: string; name?: string; budget?: number },
  ProjectDto | null
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_project',
    description: 'Update project properties or budget.',
    category: 'Projects',
    requiredScopes: [PermissionScopes.PROJECTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    name: z.string().optional(),
    budget: z.number().optional(),
  });

  protected override async handle(input: {
    id: string;
    name?: string;
    budget?: number;
  }): Promise<ProjectDto | null> {
    return {
      id: input.id,
      name: input.name ?? 'Updated Project',
      code: 'PRJ-01',
      customerId: 'cust_101',
      customerName: 'Acme Corporation S.r.l.',
      budget: input.budget ?? 15000,
      spent: 8000,
      status: 'active',
    };
  }
}

export class ListProjectsTool extends BaseTool<{ status?: string }, ProjectDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_projects',
    description: 'List ERP projects optionally filtered by status.',
    category: 'Projects',
    requiredScopes: [PermissionScopes.PROJECTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    status: z.string().optional(),
  });

  protected override async handle(
    input: { status?: string },
    context: ExecutionContext,
  ): Promise<ProjectDto[]> {
    return ProjectService.listProjects(input.status, context);
  }
}

// Tasks Tools
export class SearchTaskTool extends BaseTool<{ query: string }, TaskDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_task',
    description: 'Search tasks by title or keyword.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(
    _input: { query: string },
    context: ExecutionContext,
  ): Promise<TaskDto[]> {
    return ProjectService.listTasks(undefined, context);
  }
}

export class GetTaskTool extends BaseTool<{ id: string }, TaskDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_task',
    description: 'Get task status and assignment.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: { id: string }): Promise<TaskDto | null> {
    return {
      id: input.id,
      projectId: 'proj_1',
      title: 'Task Esecutivo',
      status: 'in_progress',
    };
  }
}

export class CreateTaskTool extends BaseTool<
  {
    projectId: string;
    title: string;
    dueDate?: string;
  },
  TaskDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_task',
    description: 'Create a new project task.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_WRITE],
  };

  public override readonly inputSchema = z.object({
    projectId: z.string().min(1),
    title: z.string().min(1),
    dueDate: z.string().optional(),
  });

  protected override async handle(input: z.infer<typeof this.inputSchema>): Promise<TaskDto> {
    return {
      id: `task_${Date.now()}`,
      status: 'todo',
      ...input,
    };
  }
}

export class UpdateTaskTool extends BaseTool<{ id: string; title?: string }, TaskDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_task',
    description: 'Update task title or parameters.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    title: z.string().optional(),
  });

  protected override async handle(input: { id: string; title?: string }): Promise<TaskDto | null> {
    return {
      id: input.id,
      projectId: 'proj_1',
      title: input.title ?? 'Updated Task',
      status: 'in_progress',
    };
  }
}

export class CompleteTaskTool extends BaseTool<
  { id: string },
  { id: string; status: string; completedAt: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'complete_task',
    description: 'Mark a task as completed.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: {
    id: string;
  }): Promise<{ id: string; status: string; completedAt: string }> {
    return {
      id: input.id,
      status: 'done',
      completedAt: new Date().toISOString(),
    };
  }
}

export class ListTasksTool extends BaseTool<{ projectId?: string }, TaskDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_tasks',
    description: 'List project tasks.',
    category: 'Tasks',
    requiredScopes: [PermissionScopes.TASKS_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    projectId: z.string().optional(),
  });

  protected override async handle(
    input: { projectId?: string },
    context: ExecutionContext,
  ): Promise<TaskDto[]> {
    return ProjectService.listTasks(input.projectId, context);
  }
}
