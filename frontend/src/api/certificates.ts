import { apiClient } from './http'

export interface CertificateTemplateMeta {
  id: string
  name: string
  file_id?: string | null
}

export interface GeneratedInfo { 
  name: string; 
  bytes: number;
  pdf_base64?: string;
}

export async function uploadCertificateHtmlTemplate(name: string, html: string) {
  // reuse resources HTML endpoint with category=template
  const { data } = await apiClient.post('/api/resources/html?category=template', { name, html, content_type: 'text/html' })
  return data
}

export async function listCertificateTemplates() {
  const { data } = await apiClient.get<{ items: any[] }>(`/api/resources?category=template`)
  return data.items
}

export async function generateCertificates(
  recipients: { name: string }[], 
  options?: { event_name?: string; event_date?: string }
): Promise<GeneratedInfo[]> {
  const { data } = await apiClient.post<{ generated: GeneratedInfo[] }>('/api/certificates/generate', { 
    recipients,
    ...options
  })
  return data.generated
}

export async function bulkEmailCertificates(payload: {
  subject: string
  body: string
  is_html?: boolean
  messages: { to: string; name?: string; attachment?: { filename?: string; content_base64: string } }[]
}) {
  const { data } = await apiClient.post('/api/certificates/bulk-email', payload)
  return data
}
