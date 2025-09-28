import { ResponsivePageLayout } from '@/components/layout/responsive-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FeedbackPage() {
  return (
    <ResponsivePageLayout
      title="Feedback Analytics"
      description="Session and overall event feedback."
    >
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle>Ratings</CardTitle>
                <CardDescription>Charts for session ratings</CardDescription>
              </CardHeader>
              <CardContent className="h-48 border border-dashed rounded-md text-sm text-muted-foreground flex items-center justify-center relative">Chart area</CardContent>
            </Card>
            <Card className="group relative overflow-hidden border-border/60 hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle>Comments</CardTitle>
                <CardDescription>Word cloud of comments</CardDescription>
              </CardHeader>
              <CardContent className="h-48 border border-dashed rounded-md text-sm text-muted-foreground flex items-center justify-center relative">Word cloud area</CardContent>
            </Card>
      </div>
    </ResponsivePageLayout>
  )
}
