import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, LogOut, Users, BookOpen, GitBranch, FileText, Plus, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBranches, useRegulations } from '@/hooks/useBranchesAndRegulations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import collegeLogo from '@/assets/college-logo.png';

interface FacultyEntry {
  id: string;
  faculty_code: string;
  branch_id: string;
  name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { data: branches = [] } = useBranches();
  const { data: regulations = [] } = useRegulations();
  const [subjectCount, setSubjectCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [facultyList, setFacultyList] = useState<FacultyEntry[]>([]);

  // Create faculty form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFacultyCode, setNewFacultyCode] = useState('');
  const [newFacultyPassword, setNewFacultyPassword] = useState('');
  const [newFacultyBranch, setNewFacultyBranch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    const { count: sCount } = await supabase.from('subjects').select('id', { count: 'exact', head: true });
    setSubjectCount(sCount || 0);

    const { count: fCount } = await supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'faculty');
    setFacultyCount(fCount || 0);

    // Fetch faculty list
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, faculty_code, branch_id, name, created_at')
      .not('faculty_code', 'is', null);

    if (profiles) {
      setFacultyList(profiles as FacultyEntry[]);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    setIsAuthorized(true);
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    navigate('/', { replace: true });
  };

  const handleCreateFaculty = async () => {
    if (!newFacultyCode || !newFacultyPassword || !newFacultyBranch) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newFacultyPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    try {
      const adminToken = sessionStorage.getItem('admin_token');
      const { data, error } = await supabase.functions.invoke('create-faculty', {
        body: {
          adminToken,
          facultyCode: newFacultyCode.toUpperCase(),
          password: newFacultyPassword,
          branchId: newFacultyBranch,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to create faculty account');
      } else {
        toast.success('Faculty account created successfully!');
        setNewFacultyCode('');
        setNewFacultyPassword('');
        setNewFacultyBranch('');
        setShowCreateForm(false);
        fetchData();
      }
    } catch {
      toast.error('Failed to create faculty account');
    }
    setCreating(false);
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

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
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

        {/* Create Faculty Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Faculty Management</CardTitle>
                <CardDescription>Create and manage faculty login accounts</CardDescription>
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create Faculty
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Form */}
            {showCreateForm && (
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Faculty Unique ID</Label>
                      <Input
                        placeholder="e.g. 2023ENG110200040"
                        value={newFacultyCode}
                        onChange={(e) => setNewFacultyCode(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select value={newFacultyBranch} onValueChange={setNewFacultyBranch}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          value={newFacultyPassword}
                          onChange={(e) => setNewFacultyPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button onClick={handleCreateFaculty} disabled={creating}>
                      {creating ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Faculty List */}
            {facultyList.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium text-muted-foreground">Faculty ID</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Branch</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyList.map((faculty) => (
                        <tr key={faculty.id} className="border-b last:border-0">
                          <td className="p-3 font-mono text-xs">{faculty.faculty_code}</td>
                          <td className="p-3">
                            {branches.find(b => b.id === faculty.branch_id)?.name || '—'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(faculty.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No faculty accounts created yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
