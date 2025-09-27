import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AgendaSession, listAgendaSessions, uploadAgenda, createAgendaSession, updateAgendaSession, deleteAgendaSession, CreateAgendaSessionInput } from '@/api/agenda'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { useState } from 'react'

export default function AgendaPage() {
  const qc = useQueryClient()
  const { data: sessions, isLoading } = useQuery({ queryKey: ['agenda','sessions'], queryFn: () => listAgendaSessions() })
  const mutUpload = useMutation({
    mutationFn: uploadAgenda,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agenda','sessions'] }); toast.success('Agenda uploaded') },
    onError: () => toast.error('Failed to upload agenda'),
  })
  const mutCreate = useMutation({
    mutationFn: createAgendaSession,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agenda','sessions'] }); toast.success('Session added') },
    onError: () => toast.error('Failed to add session'),
  })
  const mutUpdate = useMutation({
    mutationFn: (p: { id: string; patch: Partial<CreateAgendaSessionInput> }) => updateAgendaSession(p.id, p.patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agenda','sessions'] }); toast.success('Session updated') },
    onError: () => toast.error('Failed to update session'),
  })
  const mutDelete = useMutation({
    mutationFn: deleteAgendaSession,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agenda','sessions'] }); toast.success('Session deleted') },
    onError: () => toast.error('Failed to delete session'),
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
            <h1 className="text-3xl font-semibold tracking-tight">Agenda Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload Excel and edit sessions grouped by track and timeslot.</p>
          </div>
          <div className="flex gap-2">
            <NewSessionDialog onCreate={(data)=>mutCreate.mutate(data)} />
            <UploadJsonDialog onSubmit={(payload)=>mutUpload.mutate(payload)} />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Agenda Editor</CardTitle>
            <CardDescription>Manage sessions by track and timeslot</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Timeslot</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
                )}
                {!isLoading && (!sessions || sessions.length === 0) && (
                  <TableRow><TableCell colSpan={5}>No sessions yet</TableCell></TableRow>
                )}
                {sessions?.map((s: AgendaSession) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.track || '—'}</TableCell>
                    <TableCell>{s.type || '—'}</TableCell>
                    <TableCell>{s.timeslot || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <EditSessionDialog session={s} onSave={(patch)=>mutUpdate.mutate({ id: s.id, patch })} />
                        <DeleteSessionButton
                          session={s}
                          onConfirm={()=>mutDelete.mutate(s.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

function UploadJsonDialog({ onSubmit }:{ onSubmit: (payload: { sessions: CreateAgendaSessionInput[] }) => void }){
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  function submit(){
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('Expected an array of sessions')
      onSubmit({ sessions: parsed })
      setOpen(false); setText('')
    } catch (e:any){
      toast.error(e?.message || 'Invalid JSON')
    }
  }
  const sample = [
    { title: 'Opening Keynote', track: 'Main', type: 'Keynote', timeslot: '09:00-09:30' },
    { title: 'Break', track: 'Main', type: 'Break', timeslot: '09:30-09:45' },
  ]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2"/>Upload JSON</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload agenda (JSON)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Paste an array of session objects</Label>
          <Textarea value={text} onChange={(e)=>setText(e.target.value)} rows={12} placeholder={JSON.stringify(sample, null, 2)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Upload</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewSessionDialog({ onCreate }:{ onCreate: (input: CreateAgendaSessionInput) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateAgendaSessionInput>({ title: '', track: '', type: '', timeslot: '' })
  function submit(){
    if (!form.title.trim()) return toast.error('Title is required')
    onCreate({
      title: form.title.trim(),
      track: form.track || undefined,
      type: form.type || undefined,
      timeslot: form.timeslot || undefined,
    })
    setOpen(false); setForm({ title: '', track: '', type: '', timeslot: '' })
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2"/>Add Session</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <LabeledInput label="Title" value={form.title} onChange={(v)=>setForm(s=>({ ...s, title: v }))} required />
          <LabeledInput label="Track" value={form.track || ''} onChange={(v)=>setForm(s=>({ ...s, track: v }))} />
          <LabeledInput label="Type" value={form.type || ''} onChange={(v)=>setForm(s=>({ ...s, type: v }))} />
          <LabeledInput label="Timeslot" value={form.timeslot || ''} onChange={(v)=>setForm(s=>({ ...s, timeslot: v }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditSessionDialog({ session, onSave }:{ session: AgendaSession; onSave: (patch: Partial<CreateAgendaSessionInput>) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateAgendaSessionInput>({
    title: session.title || '',
    track: session.track || '',
    type: session.type || '',
    timeslot: session.timeslot || '',
  })
  function submit(){
    if (!form.title.trim()) return toast.error('Title is required')
    onSave({
      title: form.title.trim(),
      track: form.track || undefined,
      type: form.type || undefined,
      timeslot: form.timeslot || undefined,
    })
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1"/>Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <LabeledInput label="Title" value={form.title} onChange={(v)=>setForm(s=>({ ...s, title: v }))} required />
          <LabeledInput label="Track" value={form.track || ''} onChange={(v)=>setForm(s=>({ ...s, track: v }))} />
          <LabeledInput label="Type" value={form.type || ''} onChange={(v)=>setForm(s=>({ ...s, type: v }))} />
          <LabeledInput label="Timeslot" value={form.timeslot || ''} onChange={(v)=>setForm(s=>({ ...s, timeslot: v }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LabeledInput({ label, value, onChange, required }:{ label: string; value: string; onChange: (v:string)=>void; required?: boolean }){
  return (
    <div className="grid gap-1">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  )
}

function DeleteSessionButton({ session, onConfirm }:{ session: AgendaSession; onConfirm: () => void }){
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="destructive" onClick={()=>setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1"/>Delete
      </Button>
      <DeleteConfirmationDialog
        isOpen={open}
        onClose={()=>setOpen(false)}
        onConfirm={()=>{ onConfirm(); setOpen(false) }}
        title="Delete session?"
        description="This will permanently remove the session."
        itemName={session.title}
      />
    </>
  )
}
