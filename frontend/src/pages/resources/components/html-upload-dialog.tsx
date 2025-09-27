import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function HtmlUploadDialog({ onUpload }:{ onUpload: (data: { name: string; html: string; category?: string }) => void }){
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('certificate-template.html')
  const [category, setCategory] = useState<string>('template')
  const [html, setHtml] = useState('<!doctype html>\n<html>\n  <head><meta charset="utf-8"><title>Template</title></head>\n  <body>\n    <h1>Hello, Template!</h1>\n  </body>\n</html>')

  function submit(){
    if (!name.trim()) return
    if (!html.trim()) return
    onUpload({ name: name.trim(), html, category })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New HTML Template</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload HTML Template</DialogTitle>
          <DialogDescription>Paste raw HTML to store as a reusable template.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>File name</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="certificate.html" />
          </div>
          <div className="grid gap-1">
            <Label>Category</Label>
            <Input value={category} onChange={e=>setCategory(e.target.value)} placeholder="template" />
          </div>
          <div className="grid gap-1">
            <Label>HTML</Label>
            <Textarea className="min-h-[320px] font-mono text-sm" value={html} onChange={e=>setHtml(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Upload</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
