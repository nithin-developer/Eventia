import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Code, Image, FileType } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listResources, ResourceFile, uploadResource, uploadHtmlTemplate } from '@/api/resources'
import { FileUploadDialog } from './components/file-upload-dialog'
import { HtmlUploadDialog } from './components/html-upload-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function ResourcesPage() {
  const qc = useQueryClient()
  const { data: files, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => listResources(),
  })
  const mutFile = useMutation({
    mutationFn: (p: { file: File; category?: string }) => uploadResource(p.file, p.category),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('File uploaded') },
    onError: () => toast.error('Upload failed')
  })
  const mutHtml = useMutation({
    mutationFn: uploadHtmlTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Template saved') },
    onError: () => toast.error('Template upload failed')
  })
  return (
    <>
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload files and manage templates (certificates, invites).</p>
          </div>
          <div className="flex gap-2">
            <HtmlUploadDialog onUpload={(d)=>mutHtml.mutate(d)} />
            <FileUploadDialog onUpload={(file, category)=>mutFile.mutate({ file, category })} />
          </div>
        </div>
        <Tabs defaultValue="uploads" className="w-full">
          <TabsList>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="uploads">
            <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">All Files</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Images and documents you've uploaded</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="space-y-2 text-sm">
                  {isLoading && <div>Loading…</div>}
                  {!isLoading && (!files || files.length === 0) && (
                    <div className="text-muted-foreground">No files uploaded yet</div>
                  )}
                  <ul className="divide-y">
                    {files?.map((f: ResourceFile) => (
                      <li key={f.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileIcon contentType={f.content_type || ''} />
                          <div>
                            <div className="font-medium leading-none">{f.original_name}</div>
                            <div className="text-xs text-muted-foreground">{f.content_type || 'unknown'} • {f.size ? formatSize(f.size) : ''}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{f.created_at?.slice(0,10)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="templates">
            <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Templates Library</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">HTML templates for certificates and invitations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <TemplatesGrid files={files?.filter(f => (f.category || '') === 'template')} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function formatSize(n: number){
  if (n < 1024) return `${n} B`
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`
  if (n < 1024*1024*1024) return `${(n/1024/1024).toFixed(1)} MB`
  return `${(n/1024/1024/1024).toFixed(1)} GB`
}

function FileIcon({ contentType }:{ contentType: string }){
  if (contentType?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
  if (contentType === 'text/html') return <FileText className="h-5 w-5 text-orange-500" />
  if (contentType === 'application/pdf') return <FileType className="h-5 w-5 text-red-500" />
  return <FileType className="h-5 w-5 text-muted-foreground" />
}

function TemplatesGrid({ files, isLoading }:{ files?: ResourceFile[]; isLoading: boolean }){
  return (
    <div className="space-y-2">
      {isLoading && <div>Loading…</div>}
      {!isLoading && (!files || files.length === 0) && <div className="text-muted-foreground">No templates yet. Use "New HTML Template" to add one.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {files?.map(f => (
          <div key={f.id} className="border rounded-lg p-4 flex items-start gap-3">
            <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium leading-none">{f.original_name}</div>
              <div className="text-xs text-muted-foreground">{f.created_at?.slice(0,10)} • HTML Template</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
