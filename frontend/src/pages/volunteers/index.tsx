import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVolunteer, deleteVolunteer, listVolunteers, updateVolunteer, Volunteer, CreateVolunteerInput } from '@/api/volunteers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { toast } from 'sonner'

export default function VolunteersPage() {
  const qc = useQueryClient()
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => listVolunteers(),
  })
  const mutCreate = useMutation({
    mutationFn: createVolunteer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteers'] }); toast.success('Volunteer added') },
    onError: () => toast.error('Failed to add volunteer')
  })
  const mutUpdate = useMutation({
    mutationFn: (p: { id: string, patch: Partial<CreateVolunteerInput> }) => updateVolunteer(p.id, p.patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteers'] }); toast.success('Volunteer updated') },
    onError: () => toast.error('Failed to update volunteer')
  })
  const mutDelete = useMutation({
    mutationFn: deleteVolunteer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteers'] }); toast.success('Volunteer deleted') },
    onError: () => toast.error('Failed to delete volunteer')
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
            <h1 className="text-3xl font-semibold tracking-tight">Volunteers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage volunteers and assign tasks.</p>
          </div>
          <NewVolunteerDialog onCreate={(data)=>mutCreate.mutate(data)} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Volunteer List</CardTitle>
            <CardDescription>CRUD and task assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Tasks</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading…</TableCell>
                  </TableRow>
                )}
                {!isLoading && (!volunteers || volunteers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5}>No volunteers yet</TableCell>
                  </TableRow>
                )}
                {volunteers?.map((v: Volunteer) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.role || '—'}</TableCell>
                    <TableCell>{v.phone || '—'}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <EditVolunteerDialog volunteer={v} onSave={(patch)=>mutUpdate.mutate({ id: v.id, patch })} />
                        <DeleteVolunteerButton onConfirm={()=>mutDelete.mutate(v.id)} />
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

const PRESET_ROLES = [
  'Registration',
  'Logistics',
  'Stage Coordinator',
  'Hospitality',
  'AV Support',
  'Security',
  'Photography',
  'Social Media',
  'Runner',
]

function NewVolunteerDialog({ onCreate }:{ onCreate: (data: CreateVolunteerInput) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' })
  function submit(){
    if (!form.name.trim()) return toast.error('Name is required')
    onCreate({
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      role: form.role || undefined,
    })
    setOpen(false); setForm({ name: '', email: '', phone: '', role: '' })
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2"/>Add Volunteer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Volunteer</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" value={form.name} onChange={v=>setForm(s=>({ ...s, name: v }))} required />
          <Field label="Email" value={form.email} onChange={v=>setForm(s=>({ ...s, email: v }))} />
          <Field label="Phone" value={form.phone} onChange={v=>setForm(s=>({ ...s, phone: v }))} />
          <div className="grid gap-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v)=>setForm(s=>({ ...s, role: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditVolunteerDialog({ volunteer, onSave }:{ volunteer: Volunteer; onSave: (patch: Partial<CreateVolunteerInput>) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: volunteer.name || '',
    email: volunteer.email || '',
    phone: volunteer.phone || '',
    role: volunteer.role || '',
  })
  function submit(){
    if (!form.name.trim()) return toast.error('Name is required')
    onSave({
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      role: form.role || undefined,
    })
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1"/>Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Volunteer</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" value={form.name} onChange={v=>setForm(s=>({ ...s, name: v }))} required />
          <Field label="Email" value={form.email} onChange={v=>setForm(s=>({ ...s, email: v }))} />
          <Field label="Phone" value={form.phone} onChange={v=>setForm(s=>({ ...s, phone: v }))} />
          <div className="grid gap-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v)=>setForm(s=>({ ...s, role: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteVolunteerButton({ onConfirm }:{ onConfirm: () => void }){
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1"/>Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete volunteer?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the volunteer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Field({ label, value, onChange, required }:{ label: string; value: string; onChange: (v: string) => void; required?: boolean }){
  return (
    <div className="grid gap-1">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}
