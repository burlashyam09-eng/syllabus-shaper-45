import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, Users, BookOpen, GitBranch, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBranches, useRegulations } from '@/hooks/useBranchesAndRegulations';
import { supabase } from '@/integrations/supabase/client';
import collegeLogo from '@/assets/college-logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { data: branches = [] } = useBranches();
  const { data: regulations = [] } = useRegulations();
  const [subjectCount, setSubjectCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    setIsAuthorized(true);

    // Fetch counts
    supabase.from('subjects').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setSubjectCount(count || 0);
    });
    supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'faculty').then(({ count }) => {
      setFacultyCount(count || 0);
    });
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/', { replace: true });
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={collegeLogo} alt="College Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full bg-white p-0.5 shadow-sm" />
            <div className="text-center">
              <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight tracking-tight">
                Sir C.R. Reddy College of Engineering
              </h2>
              <p className="text-[10px] sm:text-xs text-primary font-semibold">(Autonomous)</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">System Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <ThemeToggle />
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
              <GitBranch className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{branches.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Regulations</CardTitle>
              <FileText className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{regulations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subjects</CardTitle>
              <BookOpen className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subjectCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Faculty</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{facultyCount}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
