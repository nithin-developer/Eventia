import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Images } from 'lucide-react'

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
          <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Images className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Albums</CardTitle>
                  <CardDescription>Visibility and sharing controls</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="text-sm text-muted-foreground">TODO: albums grid</div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
