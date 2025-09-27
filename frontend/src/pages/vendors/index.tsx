import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVendor, deleteVendor, listVendors, updateVendor, Vendor, CreateVendorInput } from '@/api/vendors'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useState } from 'react'
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
            <h1 className="text-3xl font-semibold tracking-tight">Vendors</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service providers and contracts.</p>
          </div>
          <NewVendorDialog onCreate={(data)=>mutCreate.mutate(data)} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
            <CardDescription>List of approved vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading…</TableCell>
                  </TableRow>
                )}
                {!isLoading && (!vendors || vendors.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5}>No vendors yet</TableCell>
                  </TableRow>
                )}
                {vendors?.map((v: Vendor) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.category || '—'}</TableCell>
                    <TableCell>{v.contact_name || '—'}</TableCell>
                    <TableCell>{v.email || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <EditVendorDialog vendor={v} onSave={(patch)=>mutUpdate.mutate({ id: v.id, patch })} />
                        <DeleteVendorButton onConfirm={()=>mutDelete.mutate(v.id)} />
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
        <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1"/>Edit</Button>
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
        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1"/>Delete</Button>
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
