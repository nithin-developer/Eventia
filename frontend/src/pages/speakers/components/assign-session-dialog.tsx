import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignSessionToSpeaker, CreateSessionInput, Speaker } from '@/api/speakers'
import { toast } from 'sonner'

interface AssignSessionDialogProps {
  speaker: Speaker
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SESSION_TYPES = [
  'Keynote',
  'Technical Talk',
  'Workshop',
  'Panel Discussion',
  'Lightning Talk',
  'Demo',
  'Q&A Session'
]

const TRACKS = [
  'Main Stage',
  'Tech Track',
  'Business Track',
  'Workshop Room A',
  'Workshop Room B',
  'Breakout Room 1',
  'Breakout Room 2'
]

const TIME_SLOTS = [
  '09:00 - 09:45',
  '10:00 - 10:45',
  '11:00 - 11:45',
  '12:00 - 12:45',
  '14:00 - 14:45',
  '15:00 - 15:45',
  '16:00 - 16:45',
  '17:00 - 17:45'
]

export function AssignSessionDialog({ speaker, open, onOpenChange }: AssignSessionDialogProps) {
  const [formData, setFormData] = useState<CreateSessionInput>({
    title: '',
    track: '',
    type: '',
    timeslot: ''
  })
  const qc = useQueryClient()

  const assignMutation = useMutation({
    mutationFn: (input: { speakerId: string; data: CreateSessionInput }) => 
      assignSessionToSpeaker(input.speakerId, input.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['speakers'] })
      toast.success('Session assigned successfully! 📅')
      setFormData({ title: '', track: '', type: '', timeslot: '' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to assign session'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.warning('Session title is required')
      return
    }

    // Clean up the data
    const cleanData: CreateSessionInput = {
      title: formData.title.trim(),
      track: formData.track || undefined,
      type: formData.type || undefined,
      timeslot: formData.timeslot || undefined
    }

    assignMutation.mutate({ speakerId: speaker.id, data: cleanData })
  }

  const handleInputChange = (field: keyof CreateSessionInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Assign Session to {speaker.name}</DialogTitle>
          <DialogDescription>
            Create and assign a new session to this speaker.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-title" className="text-sm font-medium">
                Session Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="session-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter session title"
                disabled={assignMutation.isPending}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-type" className="text-sm font-medium">
                  Session Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-track" className="text-sm font-medium">
                  Track/Room
                </Label>
                <Select
                  value={formData.track}
                  onValueChange={(value) => handleInputChange('track', value)}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKS.map((track) => (
                      <SelectItem key={track} value={track}>
                        {track}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeslot" className="text-sm font-medium">
                Time Slot
              </Label>
              <Select
                value={formData.timeslot}
                onValueChange={(value) => handleInputChange('timeslot', value)}
                disabled={assignMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || assignMutation.isPending}
              className="sm:order-2"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Assign Session
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}