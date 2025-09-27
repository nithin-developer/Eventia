import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus, getBoard, reorderBoard, createTask, updateTask, deleteTask } from '@/api/tasks'
import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'

type ColumnsState = Record<TaskStatus, Task[]>

export default function TasksPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'board'],
    queryFn: () => getBoard(),
  })
  const [columns, setColumns] = useState<ColumnsState>(() => ({
    todo: [], in_progress: [], done: [],
  }))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  )

  // Keep local state in sync
  useMemo(() => {
    if (data?.columns) setColumns(data.columns)
  }, [data])

  const mutReorder = useMutation({
    mutationFn: (payload: Record<TaskStatus, string[]>) => reorderBoard(payload),
    onError: () => toast.error('Failed to save order'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'board'] }),
  })

  const mutCreate = useMutation({
    mutationFn: (input: { title: string; description?: string; assignee?: string }) => createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'board'] })
      toast.success('Task created')
    },
    onError: () => toast.error('Failed to create task'),
  })

  const mutUpdate = useMutation({
    mutationFn: (payload: { id: string; patch: Partial<Pick<Task, 'title'|'description'|'assignee'|'stage'|'status'>> }) => {
      const patch: any = { ...payload.patch }
      if (patch.description === null) delete patch.description
      return updateTask(payload.id, patch)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'board'] }),
  })

  const mutDelete = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'board'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const [fromCol, activeId] = (active.id as string).split(':') as [TaskStatus, string]
    const overStr = String(over.id)
    let toCol: TaskStatus
    let overId: string | null = null
    if (overStr.startsWith('col:')) {
      toCol = overStr.replace('col:', '') as TaskStatus
    } else {
      const parts = overStr.split(':') as [TaskStatus, string]
      toCol = parts[0]
      overId = parts[1]
    }
    if (!fromCol || !toCol) return

    const fromList = [...columns[fromCol]]
    const toList = fromCol === toCol ? fromList : [...columns[toCol]]
    const fromIndex = fromList.findIndex(t => t.id === activeId)
    const overIndex = overId ? toList.findIndex(t => t.id === overId) : -1
    if (fromIndex === -1) return

    const [moved] = fromList.splice(fromIndex, 1)
  const newIndex = overIndex >= 0 ? overIndex : toList.length
    toList.splice(newIndex, 0, moved)

    const nextCols: ColumnsState = {
      ...columns,
      [fromCol]: fromCol === toCol ? toList : fromList,
      [toCol]: toList,
    }
    // apply status to moved item if column changed
    nextCols[toCol] = nextCols[toCol].map((t, i) => ({ ...t, status: toCol, position: i }))
    if (fromCol !== toCol) nextCols[fromCol] = nextCols[fromCol].map((t, i) => ({ ...t, position: i }))
    setColumns(nextCols)

    // persist
    mutReorder.mutate({
      todo: nextCols.todo.map(t => t.id),
      in_progress: nextCols.in_progress.map(t => t.id),
      done: nextCols.done.map(t => t.id),
    })
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
            <h1 className="text-3xl font-semibold tracking-tight">Task Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">Kanban board with drag-and-drop and CRUD.</p>
          </div>
          <NewTaskButton onCreate={(t) => mutCreate.mutate(t)} />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {(['todo','in_progress','done'] as TaskStatus[]).map((col) => (
              <KanbanColumn
                key={col}
                title={col.replace('_',' ')}
                status={col}
                tasks={columns[col]}
                isLoading={isLoading}
                onEdit={(id, patch) => mutUpdate.mutate({ id, patch })}
                onDelete={(id) => mutDelete.mutate(id)}
              />
            ))}
          </div>
        </DndContext>
      </Main>
    </>
  )
}

function KanbanColumn({ title, status, tasks, isLoading, onEdit, onDelete }:{
  title: string,
  status: TaskStatus,
  tasks: Task[] | undefined,
  isLoading: boolean,
  onEdit: (id: string, patch: Partial<Task>) => void,
  onDelete: (id: string) => void,
}){
  const droppable = useDroppable({ id: `col:${status}` })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{title}</CardTitle>
        <CardDescription>{(tasks?.length ?? 0)} items</CardDescription>
      </CardHeader>
      <CardContent ref={droppable.setNodeRef}>
        <SortableContext items={(tasks||[]).map(t => `${status}:${t.id}`)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 min-h-[60px]">
            {isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
            {!isLoading && (!tasks || tasks.length===0) && (
              <li className="text-sm text-muted-foreground">No tasks</li>
            )}
            {tasks?.map(t => (
              <KanbanCard key={t.id} status={status} task={t} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </SortableContext>
      </CardContent>
    </Card>
  )
}

function KanbanCard({ status, task, onEdit, onDelete }:{
  status: TaskStatus,
  task: Task,
  onEdit: (id: string, patch: Partial<Task>) => void,
  onDelete: (id: string) => void,
}){
  const sortableId = `${status}:${task.id}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId })
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
  }
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description || '')
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="rounded-md border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</div>
          )}
          {task.assignee && (
            <div className="text-xs text-muted-foreground mt-1">Assignee: {task.assignee}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-muted rounded" onClick={() => setOpen(true)} title="Edit"><Pencil className="h-4 w-4"/></button>
          <button className="p-1 hover:bg-muted rounded" onClick={() => onDelete(task.id)} title="Delete"><Trash2 className="h-4 w-4"/></button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={desc} onChange={e=>setDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={()=>{ onEdit(task.id, { title, description: desc }); setOpen(false) }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  )
}

function NewTaskButton({ onCreate }:{ onCreate: (input: { title: string; description?: string; assignee?: string }) => void }){
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [assignee, setAssignee] = useState('')
  function submit(){
    if (!title.trim()) return toast.error('Title is required')
    onCreate({ title: title.trim(), description: desc || undefined, assignee: assignee || undefined })
    setOpen(false); setTitle(''); setDesc(''); setAssignee('')
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2"/>New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="assignee">Assignee</Label>
            <Input id="assignee" value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="Optional" />
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
