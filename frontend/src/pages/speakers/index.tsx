import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listSpeakers, Speaker } from '@/api/speakers'

export default function SpeakersPage() {
  const { data: speakers, isLoading } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => listSpeakers(),
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
            <h1 className="text-3xl font-semibold tracking-tight">Speakers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage speakers and assign sessions.</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2"/>Add Speaker</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Speakers</CardTitle>
            <CardDescription>Session assignments and logistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sessions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4}>Loading…</TableCell>
                  </TableRow>
                )}
                {!isLoading && (!speakers || speakers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4}>No speakers yet</TableCell>
                  </TableRow>
                )}
                {speakers?.map((s: Speaker) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.expertise || '—'}</TableCell>
                    <TableCell>{s.email || '—'}</TableCell>
                    <TableCell>—</TableCell>
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
