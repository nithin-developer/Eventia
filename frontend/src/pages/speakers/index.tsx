import { ResponsivePageLayout } from '@/components/layout/responsive-page-layout'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, Trash2, Calendar, Mail, User, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSpeakers, Speaker, deleteSpeaker } from '@/api/speakers'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { CreateSpeakerDialog } from './components/create-speaker-dialog'
import { EditSpeakerDialog } from './components/edit-speaker-dialog'
import { AssignSessionDialog } from './components/assign-session-dialog'
import { ViewSessionsDialog } from './components/view-sessions-dialog'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'

export default function SpeakersPage() {
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null)
  const [assigningSpeaker, setAssigningSpeaker] = useState<Speaker | null>(null)
  const [viewingSpeaker, setViewingSpeaker] = useState<Speaker | null>(null)
  const [deletingSpeaker, setDeletingSpeaker] = useState<Speaker | null>(null)
  
  const qc = useQueryClient()
  const { data: speakers, isLoading } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => listSpeakers(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSpeaker(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['speakers'] })
      toast.success('Speaker deleted successfully! 🗑️')
      setDeletingSpeaker(null)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to delete speaker'
      toast.error(message)
    },
  })

  const columns: ColumnDef<Speaker>[] = useMemo(() => [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row }) => <div className="w-12">{row.index + 1}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const speaker = row.original
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{speaker.name}</div>
              {speaker.email && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {speaker.email}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "expertise",
      header: "Expertise",
      cell: ({ row }) => {
        const expertise = row.getValue("expertise") as string
        return expertise ? (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {expertise}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "bio",
      header: "Bio",
      cell: ({ row }) => {
        const bio = row.getValue("bio") as string
        return bio ? (
          <div className="max-w-xs truncate" title={bio}>
            {bio}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "sessions",
      header: "Sessions",
      cell: ({ row }) => {
        const speaker = row.original
        const count = speaker.session_count || 0
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant={count > 0 ? "default" : "secondary"}
              className={count > 0 ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : ""}
            >
              {count} {count === 1 ? "session" : "sessions"}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const speaker = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setViewingSpeaker(speaker)}>
                <Eye className="h-4 w-4 mr-2" />
                View Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingSpeaker(speaker)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Speaker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssigningSpeaker(speaker)}>
                <Calendar className="h-4 w-4 mr-2" />
                Assign Session
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeletingSpeaker(speaker)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Speaker
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  return (
    <>
      <ResponsivePageLayout
        title="Speakers"
        description="Manage speakers and assign sessions."
        actions={<CreateSpeakerDialog />}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={speakers || []}
            searchPlaceholder="Search speakers..."
            searchColumn="name"
          />
        )}
      </ResponsivePageLayout>

      {/* Edit Speaker Dialog */}
      {editingSpeaker && (
        <EditSpeakerDialog
          speaker={editingSpeaker}
          open={!!editingSpeaker}
          onOpenChange={(open) => !open && setEditingSpeaker(null)}
        />
      )}

      {/* Assign Session Dialog */}
      {assigningSpeaker && (
        <AssignSessionDialog
          speaker={assigningSpeaker}
          open={!!assigningSpeaker}
          onOpenChange={(open) => !open && setAssigningSpeaker(null)}
        />
      )}

      {/* View Sessions Dialog */}
      {viewingSpeaker && (
        <ViewSessionsDialog
          speaker={viewingSpeaker}
          open={!!viewingSpeaker}
          onOpenChange={(open) => !open && setViewingSpeaker(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingSpeaker && (
        <ConfirmDialog
          open={!!deletingSpeaker}
          onOpenChange={(open) => !open && setDeletingSpeaker(null)}
          title="Delete Speaker"
          desc={`Are you sure you want to delete "${deletingSpeaker.name}"? This action cannot be undone.`}
          handleConfirm={() => deleteMutation.mutate(deletingSpeaker.id)}
          isLoading={deleteMutation.isPending}
          destructive={true}
        />
      )}
    </>
  )
}
