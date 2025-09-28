import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Send, FileText, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadCertificateHtmlTemplate, generateCertificates, bulkEmailCertificates, listCertificateTemplates } from '@/api/certificates'
import { useQuery } from '@tanstack/react-query'

export default function CertificatesPage() {
  const [eventName, setEventName] = useState('')
  const [participantsText, setParticipantsText] = useState('')
  const [emailSubject, setEmailSubject] = useState('Your Participation Certificate')
  const [emailBody, setEmailBody] = useState('Hello {name},\n\nPlease find your participation certificate attached.')
  const [sending, setSending] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState('Certificate Template')
  const [uploadHtml, setUploadHtml] = useState('')
  const { data: templates, refetch: refetchTemplates } = useQuery({ queryKey: ['certificate','templates'], queryFn: () => listCertificateTemplates() })

  async function handleUploadTemplate(){
    if (!uploadName.trim() || !uploadHtml.trim()) return toast.error('Provide template name and HTML')
    try {
      await uploadCertificateHtmlTemplate(uploadName.trim(), uploadHtml)
      toast.success('Template uploaded')
      refetchTemplates()
      setUploadOpen(false); setUploadName('Certificate Template'); setUploadHtml('')
    } catch {
      toast.error('Failed to upload template')
    }
  }

  async function handleDownloadSample() {
    try {
      const sampleName = 'Sample Participant'
      const generated = await generateCertificates([{ name: sampleName }], {
        event_name: eventName || 'Sample Event',
        event_date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      })

      if (generated[0]?.pdf_base64) {
        // Convert base64 to blob and download
        const byteCharacters = atob(generated[0].pdf_base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${sampleName.replace(/[^a-zA-Z0-9]/g, '_')}_certificate.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success('Sample certificate downloaded! 📄')
      } else {
        toast.error('Failed to generate PDF')
      }
    } catch (e) {
      console.error('Download sample error:', e)
      toast.error('Failed to download sample certificate')
    }
  }

  async function handleBulkEmail(){
    const names = participantsText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    if (names.length === 0) return toast.error('Add at least one participant')
    
    setSending(true)
    try {
      // Generate proper PDF certificates with event details
      const generated = await generateCertificates(names.map(n=>({ name: n })), {
        event_name: eventName || 'Event',
        event_date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      })
      
      const messages = names.map((n, i)=>{
        // Parse email in the format "Name <email@domain>" or "email@domain"
        let email = ''
        const m = n.match(/<([^>]+)>$/)
        const nameOnly = m ? n.replace(/<[^>]+>$/, '').trim() : n
        email = m ? m[1] : ''
        
        if (!email) {
          // fallback: if line is just email, use it as email and derive name from event
          if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n)) { 
            email = n; 
          }
        }
        
        const generatedCert = generated[i]
        if (!generatedCert?.pdf_base64) {
          console.warn(`No PDF generated for ${nameOnly}`)
          return null
        }
        
        return {
          to: email,
          name: nameOnly,
          attachment: { 
            filename: `${nameOnly.replace(/[^a-zA-Z0-9]/g, '_')}_certificate.pdf`, 
            content_base64: generatedCert.pdf_base64! 
          }
        }
      }).filter((x): x is NonNullable<typeof x> => x !== null && !!x.to)
      
      if (messages.length === 0) { 
        toast.error('No valid email addresses found. Use "Name <email@domain>" per line.'); 
        setSending(false); 
        return 
      }
      
      const resp = await bulkEmailCertificates({ 
        subject: emailSubject, 
        body: emailBody, 
        is_html: false, 
        messages 
      })
      
      if (resp?.errors?.length) {
        toast.warning(`Sent ${resp.sent || 0}, ${resp.errors.length} failed`)
      } else {
        toast.success(`Successfully sent ${messages.length} certificates! 📧`)
      }
    } catch (e){
      console.error('Bulk email error:', e)
      toast.error('Failed to send emails')
    } finally {
      setSending(false)
    }
  }
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
            <h1 className="text-3xl font-semibold tracking-tight">Certificates & Communications</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload templates, bulk generate, and email.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="h-4 w-4 mr-2"/>Upload Template</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Upload Certificate HTML Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label>Template name</Label>
                  <Input value={uploadName} onChange={e=>setUploadName(e.target.value)} />
                  <Label>HTML</Label>
                  <Textarea value={uploadHtml} onChange={e=>setUploadHtml(e.target.value)} rows={14} placeholder="Paste HTML here (see certificate-template.html)" />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={()=>setUploadOpen(false)}>Cancel</Button>
                    <Button onClick={handleUploadTemplate}>Upload</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadSample}><FileText className="h-4 w-4 mr-2"/>Download Sample</Button>
            <Button onClick={handleBulkEmail} disabled={sending}><Send className="h-4 w-4 mr-2"/>{sending ? 'Sending…' : 'Bulk Email'}</Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-4 relative">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Templates</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Placeholders: {'{name}'}, {'{role}'}, {'{event}'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-sm text-muted-foreground mb-3">You can upload HTML templates. Rendering to PDF per participant can be extended server-side.</div>
              <div className="grid gap-4">
                <div>
                  <div className="font-medium mb-2">Uploaded templates</div>
                  <div className="rounded border p-3 text-sm bg-muted/20">
                    {(!templates || templates.length === 0) ? (
                      <div className="text-muted-foreground">No templates uploaded yet.</div>
                    ) : (
                      <ul className="list-disc ml-5">
                        {templates.map((t:any)=> (
                          <li key={t.id}>{t.original_name} <span className="text-muted-foreground">({Math.round((t.size||0)/1024)} KB)</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <Label>Event name</Label>
                <Input placeholder="e.g., Vibeathon 2025" value={eventName} onChange={e=>setEventName(e.target.value)} />
                <Label className="mt-3">Participants (one per line). You can use {`"Name <email@domain>"`} format.</Label>
                <Textarea rows={8} placeholder={'Jane Doe <jane@example.com>\nJohn Smith <john@example.com>'} value={participantsText} onChange={e=>setParticipantsText(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-4 relative">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Bulk Generation</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Select recipients and generate PDFs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-sm text-muted-foreground">Emails will be sent using SMTP settings from backend environment variables.</div>
              <div className="grid gap-2 mt-3">
                <Label>Subject</Label>
                <Input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} />
                <Label className="mt-3">Body (supports {`{name}`} placeholder)</Label>
                <Textarea rows={8} value={emailBody} onChange={e=>setEmailBody(e.target.value)} />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleBulkEmail} disabled={sending}><Send className="h-4 w-4 mr-2"/>{sending ? 'Sending…' : 'Send Emails'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
