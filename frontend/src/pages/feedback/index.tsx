import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FeedbackPage() {
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Feedback Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Session and overall event feedback.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ratings</CardTitle>
                <CardDescription>Charts for session ratings</CardDescription>
              </CardHeader>
              <CardContent className="h-48 border border-dashed rounded-md text-sm text-muted-foreground flex items-center justify-center">Chart area</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>Word cloud of comments</CardDescription>
              </CardHeader>
              <CardContent className="h-48 border border-dashed rounded-md text-sm text-muted-foreground flex items-center justify-center">Word cloud area</CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
