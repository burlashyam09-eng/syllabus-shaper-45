import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useBranches, useRegulations } from '@/hooks/useBranchesAndRegulations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { data: branches = [], isLoading: branchesLoading } = useBranches();
  const { data: regulations = [], isLoading: regulationsLoading } = useRegulations();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRegulation, setSelectedRegulation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name || !selectedRole || !selectedBranch) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedRole === 'student' && !selectedRegulation) {
      toast.error('Students must select a regulation');
      return;
    }

    setLoading(true);
    const { error } = await signUp(
      email,
      password,
      name,
      selectedRole,
      selectedBranch,
      selectedRole === 'student' ? selectedRegulation : undefined
    );
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
    }
  };

  const RoleSelector = () => (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedRole === 'faculty' ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => setSelectedRole('faculty')}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Users className="w-12 h-12 text-primary mb-2" />
          <h3 className="font-semibold">Faculty</h3>
          <p className="text-xs text-muted-foreground text-center">
            Add & manage content
          </p>
        </CardContent>
      </Card>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedRole === 'student' ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => setSelectedRole('student')}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          <GraduationCap className="w-12 h-12 text-primary mb-2" />
          <h3 className="font-semibold">Student</h3>
          <p className="text-xs text-muted-foreground text-center">
            View & learn content
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">EduLearn Platform</CardTitle>
          <CardDescription>Your academic learning companion</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <RoleSelector />

              {selectedRole && (
                <>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRole === 'student' && (
                    <div className="space-y-2">
                      <Label>Academic Regulation</Label>
                      <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your regulation" />
                        </SelectTrigger>
                        <SelectContent>
                          {regulationsLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : regulations.length === 0 ? (
                            <SelectItem value="none" disabled>No regulations available</SelectItem>
                          ) : (
                            regulations.map((reg) => (
                              <SelectItem key={reg.id} value={reg.id}>
                                {reg.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {regulations.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No regulations yet. A faculty member needs to create one first.
                        </p>
                      )}
                    </div>
                  )}

                  <Button className="w-full" onClick={handleSignup} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
