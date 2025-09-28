import { apiClient } from "./http";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  stage?: string | null;
  assignee?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  position?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  stage?: string;
  assignee?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface BoardResponse {
  columns: Record<TaskStatus, Task[]>;
}

export async function listTasks(params?: {
  status?: string;
  stage?: string;
  person?: string;
}): Promise<Task[]> {
  const res = await apiClient.get("/api/tasks", { params });
  return res.data.items as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await apiClient.post("/api/tasks", input);
  return res.data.task as Task;
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput>): Promise<Task> {
  const res = await apiClient.put(`/api/tasks/${id}`, patch);
  return res.data.task as Task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}

export async function getBoard(): Promise<BoardResponse> {
  const res = await apiClient.get(`/api/tasks/board`);
  return res.data as BoardResponse;
}

export async function reorderBoard(columns: Record<TaskStatus, string[]>): Promise<{ updated: number }> {
  const res = await apiClient.post(`/api/tasks/reorder`, { columns });
  return res.data as { updated: number };
}

export interface GenerateTasksInput {
  prompt: string;
}

export interface GenerateTasksResponse {
  message: string;
  tasks: Task[];
  count: number;
}

export async function generateTasksFromPrompt(input: GenerateTasksInput): Promise<GenerateTasksResponse> {
  const res = await apiClient.post("/api/tasks/generate-from-prompt", input);
  return res.data as GenerateTasksResponse;
}
