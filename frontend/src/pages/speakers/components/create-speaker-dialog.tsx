import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSpeaker, CreateSpeakerInput } from '@/api/speakers'
import { toast } from 'sonner'

interface CreateSpeakerDialogProps {
  trigger?: React.ReactNode
}

export function CreateSpeakerDialog({ trigger }: CreateSpeakerDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CreateSpeakerInput>({
    name: '',
    email: '',
    bio: '',
    expertise: ''
  })
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (input: CreateSpeakerInput) => createSpeaker(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['speakers'] })
      toast.success('Speaker created successfully! 🎉')
      setFormData({ name: '', email: '', bio: '', expertise: '' })
      setOpen(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to create speaker'
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
    const cleanData: CreateSpeakerInput = {
      name: formData.name.trim(),
      email: formData.email?.trim() || undefined,
      bio: formData.bio?.trim() || undefined,
      expertise: formData.expertise?.trim() || undefined
    }

    createMutation.mutate(cleanData)
  }

  const handleInputChange = (field: keyof CreateSpeakerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Speaker
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Speaker</DialogTitle>
          <DialogDescription>
            Add a new speaker to your event. Fill in their details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Speaker Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter speaker name"
                disabled={createMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="speaker@example.com"
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise" className="text-sm font-medium">
                Expertise/Field
              </Label>
              <Input
                id="expertise"
                value={formData.expertise}
                onChange={(e) => handleInputChange('expertise', e.target.value)}
                placeholder="e.g., AI/ML, Web Development, DevOps"
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio/Description
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description about the speaker..."
                className="min-h-[80px] resize-none"
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || createMutation.isPending}
              className="sm:order-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Speaker
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}