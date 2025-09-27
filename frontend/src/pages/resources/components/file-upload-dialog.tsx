import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'

export function FileUploadDialog({ onUpload }:{ onUpload: (file: File, category?: string) => void }){
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string | undefined>('upload')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(){
    const f = inputRef.current?.files?.[0]
    if (!f) return
    onUpload(f, category)
    setOpen(false)
    setFileName('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Upload className="h-4 w-4 mr-2"/>Upload</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
          <DialogDescription>Upload images (PNG/JPG), PDFs or any document.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v)=>setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">upload</SelectItem>
                <SelectItem value="image">image</SelectItem>
                <SelectItem value="document">document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>File</Label>
            <Input ref={inputRef} type="file" onChange={(e)=>setFileName(e.target.files?.[0]?.name || '')} />
            {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
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
