import { apiClient } from "./http";

export interface ResourceFile {
  id: string;
  filename: string;
  original_name: string;
  content_type?: string | null;
  size?: number | null;
  category?: string | null;
  created_at?: string | null;
}

export async function listResources(category?: string): Promise<ResourceFile[]> {
  const res = await apiClient.get("/api/resources", { params: category ? { category } : undefined });
  return res.data.items as ResourceFile[];
}

export async function uploadResource(file: File, category?: string): Promise<ResourceFile> {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);
  const res = await apiClient.post("/api/resources", form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.resource as ResourceFile;
}

export interface UploadHtmlTemplateInput {
  name: string; // filename without or with .html
  html: string; // raw HTML content
  category?: string; // default: template
}

export async function uploadHtmlTemplate(input: UploadHtmlTemplateInput): Promise<ResourceFile> {
  const res = await apiClient.post("/api/resources/html", input);
  return res.data.resource as ResourceFile;
}
