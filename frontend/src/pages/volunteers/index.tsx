import { ResponsivePageLayout } from '@/components/layout/responsive-page-layout'
import { ResponsiveCard } from '@/components/ui/responsive-card'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Users, MoreHorizontal } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVolunteer, deleteVolunteer, listVolunteers, updateVolunteer, Volunteer, CreateVolunteerInput } from '@/api/volunteers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
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

  const columns: ColumnDef<Volunteer>[] = useMemo(() => [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row }) => <div className="w-12">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <div>{row.getValue("role") || "—"}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div>{row.getValue("phone") || "—"}</div>,
    },
    {
      id: "tasks",
      header: "Assigned Tasks",
      cell: () => <div>—</div>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const volunteer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <div className="p-1 space-y-1">
                <EditButtonWrapper volunteer={volunteer} onSave={(patch) => mutUpdate.mutate({ id: volunteer.id, patch })} />
                <DeleteButtonWrapper volunteerId={volunteer.id} onConfirm={() => mutDelete.mutate(volunteer.id)} />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [mutUpdate, mutDelete])
  return (
    <ResponsivePageLayout
      title="Volunteers"
      description="Manage volunteers and assign tasks."
      actions={<NewVolunteerDialog onCreate={(data) => mutCreate.mutate(data)} />}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={volunteers || []}
          searchPlaceholder="Search volunteers..."
          searchColumn="name"
        />
      )}
    </ResponsivePageLayout>
  )
}

// Helper components for actions in dropdown
function EditButtonWrapper({ volunteer, onSave }: { volunteer: Volunteer, onSave: (patch: Partial<CreateVolunteerInput>) => void }) {
  return (
    <EditVolunteerDialog volunteer={volunteer} onSave={onSave} />
  )
}

function DeleteButtonWrapper({ onConfirm }: { volunteerId: string, onConfirm: () => void }) {
  return (
    <DeleteVolunteerButton onConfirm={onConfirm} />
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
        <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2">
          <Pencil className="h-4 w-4 mr-2"/>Edit
        </Button>
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
        <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2"/>Delete
        </Button>
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
