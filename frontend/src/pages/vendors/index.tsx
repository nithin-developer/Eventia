import { ResponsivePageLayout } from '@/components/layout/responsive-page-layout'
import { ResponsiveCard } from '@/components/ui/responsive-card'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Building2, MoreHorizontal } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVendor, deleteVendor, listVendors, updateVendor, Vendor, CreateVendorInput } from '@/api/vendors'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

export default function VendorsPage() {
  const qc = useQueryClient()
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors(),
  })
  const mutCreate = useMutation({
    mutationFn: createVendor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor added') },
    onError: () => toast.error('Failed to add vendor')
  })
  const mutUpdate = useMutation({
    mutationFn: (p: { id: string, patch: Partial<Parameters<typeof createVendor>[0]> }) => updateVendor(p.id, p.patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor updated') },
    onError: () => toast.error('Failed to update vendor')
  })
  const mutDelete = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor deleted') },
    onError: () => toast.error('Failed to delete vendor')
  })

  const columns: ColumnDef<Vendor>[] = useMemo(() => [
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category") || "—"}</div>,
    },
    {
      accessorKey: "contact_name",
      header: "Contact",
      cell: ({ row }) => <div>{row.getValue("contact_name") || "—"}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email") || "—"}</div>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const vendor = row.original
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
                <EditVendorDialog vendor={vendor} onSave={(patch) => mutUpdate.mutate({ id: vendor.id, patch })} />
                <DeleteVendorButton onConfirm={() => mutDelete.mutate(vendor.id)} />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [mutUpdate, mutDelete])
  return (
    <ResponsivePageLayout
      title="Vendors"
      description="Manage service providers and contracts."
      actions={<NewVendorDialog onCreate={(data) => mutCreate.mutate(data)} />}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={vendors || []}
          searchPlaceholder="Search vendors..."
          searchColumn="name"
        />
      )}
    </ResponsivePageLayout>
  )
}

function NewVendorDialog({ onCreate }:{ onCreate: (data: CreateVendorInput) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', contact_name: '', email: '', phone: '', notes: '' })
  function submit(){
    if (!form.name.trim()) return toast.error('Name is required')
    onCreate({
      name: form.name.trim(),
      category: form.category || undefined,
      contact_name: form.contact_name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
    })
    setOpen(false); setForm({ name: '', category: '', contact_name: '', email: '', phone: '', notes: '' })
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2"/>Add Vendor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" value={form.name} onChange={v=>setForm(s=>({ ...s, name: v }))} required />
          <Field label="Category" value={form.category} onChange={v=>setForm(s=>({ ...s, category: v }))} />
          <Field label="Contact" value={form.contact_name} onChange={v=>setForm(s=>({ ...s, contact_name: v }))} />
          <Field label="Email" value={form.email} onChange={v=>setForm(s=>({ ...s, email: v }))} />
          <Field label="Phone" value={form.phone} onChange={v=>setForm(s=>({ ...s, phone: v }))} />
          <Field label="Notes" value={form.notes} onChange={v=>setForm(s=>({ ...s, notes: v }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditVendorDialog({ vendor, onSave }:{ vendor: Vendor; onSave: (patch: Partial<CreateVendorInput>) => void }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: vendor.name || '',
    category: vendor.category || '',
    contact_name: vendor.contact_name || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    notes: vendor.notes || '',
  })
  function submit(){
    if (!form.name.trim()) return toast.error('Name is required')
    onSave({
      name: form.name.trim(),
      category: form.category || undefined,
      contact_name: form.contact_name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
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
          <DialogTitle>Edit Vendor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" value={form.name} onChange={v=>setForm(s=>({ ...s, name: v }))} required />
          <Field label="Category" value={form.category} onChange={v=>setForm(s=>({ ...s, category: v }))} />
          <Field label="Contact" value={form.contact_name} onChange={v=>setForm(s=>({ ...s, contact_name: v }))} />
          <Field label="Email" value={form.email} onChange={v=>setForm(s=>({ ...s, email: v }))} />
          <Field label="Phone" value={form.phone} onChange={v=>setForm(s=>({ ...s, phone: v }))} />
          <Field label="Notes" value={form.notes} onChange={v=>setForm(s=>({ ...s, notes: v }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteVendorButton({ onConfirm }:{ onConfirm: () => void }){
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2"/>Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the vendor.
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
