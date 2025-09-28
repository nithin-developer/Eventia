import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSpeaker, CreateSpeakerInput, Speaker } from '@/api/speakers'
import { toast } from 'sonner'

interface EditSpeakerDialogProps {
  speaker: Speaker
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSpeakerDialog({ speaker, open, onOpenChange }: EditSpeakerDialogProps) {
  const [formData, setFormData] = useState<CreateSpeakerInput>({
    name: '',
    email: '',
    bio: '',
    expertise: ''
  })
  const qc = useQueryClient()

  // Initialize form data when speaker changes
  useEffect(() => {
    if (speaker) {
      setFormData({
        name: speaker.name || '',
        email: speaker.email || '',
        bio: speaker.bio || '',
        expertise: speaker.expertise || ''
      })
    }
  }, [speaker])

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; data: Partial<CreateSpeakerInput> }) => 
      updateSpeaker(input.id, input.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['speakers'] })
      toast.success('Speaker updated successfully! ✨')
      onOpenChange(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update speaker'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.warning('Speaker name is required')
      return
    }

    // Clean up the data
    const cleanData: Partial<CreateSpeakerInput> = {
      name: formData.name.trim(),
      email: formData.email?.trim() || undefined,
      bio: formData.bio?.trim() || undefined,
      expertise: formData.expertise?.trim() || undefined
    }

    updateMutation.mutate({ id: speaker.id, data: cleanData })
  }

  const handleInputChange = (field: keyof CreateSpeakerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Speaker</DialogTitle>
          <DialogDescription>
            Update speaker information. Make changes and save when ready.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Speaker Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter speaker name"
                disabled={updateMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="speaker@example.com"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expertise" className="text-sm font-medium">
                Expertise/Field
              </Label>
              <Input
                id="edit-expertise"
                value={formData.expertise}
                onChange={(e) => handleInputChange('expertise', e.target.value)}
                placeholder="e.g., AI/ML, Web Development, DevOps"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio" className="text-sm font-medium">
                Bio/Description
              </Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description about the speaker..."
                className="min-h-[80px] resize-none"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || updateMutation.isPending}
              className="sm:order-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Update Speaker
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}