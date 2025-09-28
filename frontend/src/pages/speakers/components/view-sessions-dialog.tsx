import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, MapPin, Eye, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Speaker } from '@/api/speakers'
import { apiClient } from '@/api/http'

interface Session {
  id: string
  title: string
  track?: string | null
  type?: string | null
  timeslot?: string | null
  speaker_id?: string | null
}

interface ViewSessionsDialogProps {
  speaker: Speaker
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function getSpeakerSessions(speakerId: string): Promise<Session[]> {
  const res = await apiClient.get('/api/speakers/sessions')
  const allSessions = res.data.items as Session[]
  // Filter sessions for this specific speaker
  return allSessions.filter(session => session.speaker_id === speakerId)
}

export function ViewSessionsDialog({ speaker, open, onOpenChange }: ViewSessionsDialogProps) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['speaker-sessions', speaker.id],
    queryFn: () => getSpeakerSessions(speaker.id),
    enabled: open, // Only fetch when dialog is open
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Sessions for {speaker.name}
          </DialogTitle>
          <DialogDescription>
            All sessions assigned to this speaker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading sessions...</span>
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 space-y-3 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">
                        {session.title}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {session.timeslot && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.timeslot}
                          </div>
                        )}
                        {session.track && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.track}
                          </div>
                        )}
                      </div>
                    </div>

                    {session.type && (
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {session.type}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                No Sessions Assigned
              </h4>
              <p className="text-xs text-muted-foreground">
                This speaker hasn't been assigned to any sessions yet.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}