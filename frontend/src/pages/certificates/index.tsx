import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Send } from 'lucide-react'

export default function CertificatesPage() {
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
            <h1 className="text-3xl font-semibold tracking-tight">Certificates & Communications</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload templates, bulk generate, and email.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Upload className="h-4 w-4 mr-2"/>Upload Template</Button>
            <Button><Send className="h-4 w-4 mr-2"/>Bulk Email</Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Placeholders: {'{name}'}, {'{role}'}, {'{event}'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">TODO: templates list</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generation</CardTitle>
              <CardDescription>Select recipients and generate PDFs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">TODO: generation form</div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
