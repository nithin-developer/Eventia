import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GalleryPage() {
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
            <h1 className="text-3xl font-semibold tracking-tight">Photo Gallery</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload photos, categorize into albums, manage sharing.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Albums</CardTitle>
              <CardDescription>Visibility and sharing controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">TODO: albums grid</div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
