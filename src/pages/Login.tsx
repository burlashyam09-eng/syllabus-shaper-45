import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Users } from 'lucide-react';

const branches = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
];

const regulations = [
  'R22 (2022-2026)',
  'R21 (2021-2025)',
  'R20 (2020-2024)',
  'R19 (2019-2023)',
];

const Login = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [regulation, setRegulation] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = {
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      role: role!,
      ...(role === 'faculty' ? { branch } : { regulation }),
    };
    
    login(user);
    navigate('/dashboard');
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">EduLearn</h1>
            <p className="text-muted-foreground">Your structured learning companion</p>
          </div>
          
          <div className="space-y-4">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:border-faculty group"
              onClick={() => setRole('faculty')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-14 h-14 rounded-full bg-faculty/10 flex items-center justify-center group-hover:bg-faculty group-hover:text-faculty-foreground transition-colors">
                  <Users className="w-7 h-7 text-faculty group-hover:text-faculty-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Faculty Login</h3>
                  <p className="text-sm text-muted-foreground">Manage courses and add resources</p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:border-student group"
              onClick={() => setRole('student')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-14 h-14 rounded-full bg-student/10 flex items-center justify-center group-hover:bg-student group-hover:text-student-foreground transition-colors">
                  <GraduationCap className="w-7 h-7 text-student group-hover:text-student-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Student Login</h3>
                  <p className="text-sm text-muted-foreground">Access courses and track progress</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            role === 'faculty' ? 'bg-faculty text-faculty-foreground' : 'bg-student text-student-foreground'
          }`}>
            {role === 'faculty' ? <Users className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
          </div>
          <CardTitle className="text-2xl">{role === 'faculty' ? 'Faculty' : 'Student'} Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {role === 'faculty' ? (
              <div className="space-y-2">
                <Label>Select Branch</Label>
                <Select value={branch} onValueChange={setBranch} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Academic Regulation</Label>
                <Select value={regulation} onValueChange={setRegulation} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your regulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {regulations.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setRole(null)}
            >
              ← Back to role selection
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
