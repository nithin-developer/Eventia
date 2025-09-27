import { Activity, Users, Calendar, Layers3, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

// Super Admin (full access) dashboard
function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2"><Icon className="h-4 w-4" />{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SuperAdminDashboard() {
  // In future: fetch aggregated metrics (batchesCount, trainersCount, eventsActive, sessionsToday, attendanceRate, cancellations, etc.)
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
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Platform Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">Full administrative visibility across all entities.</p>
            </div>
            <Badge variant="outline" className="flex items-center"><Activity className="h-4 w-4 mr-1"/>All Access</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Layers3} label="Batches" value={8} sub="Active" />
            <StatCard icon={Users} label="Trainers" value={15} sub="Active" />
            <StatCard icon={Calendar} label="Events" value={12} sub="This Month" />
            <StatCard icon={Clock} label="Sessions Today" value={34} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Events Activity</CardTitle>
                <CardDescription>Sessions trend (placeholder chart)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground h-40 flex items-center justify-center border border-dashed rounded-md">Chart area</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Session Health</CardTitle>
                <CardDescription>Today&apos;s attendance snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/>Completed</span><span>18</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500"/>Upcoming</span><span>10</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500"/>Cancelled</span><span>3</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/>At Risk</span><span>3</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Administrative Actions</CardTitle>
              <CardDescription>Audit style list placeholder</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>No recent actions loaded.</div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}

// Admin (reports only) dashboard
// Additional role-specific views can be reintroduced as needed in future.

export default function Dashboard() {
  // Eventia has a single admin user for now. Use the most comprehensive view.
  return <SuperAdminDashboard />;
}
