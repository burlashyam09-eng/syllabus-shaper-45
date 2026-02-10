import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useBranches, useRegulations } from '@/hooks/useBranchesAndRegulations';
import { supabase } from '@/integrations/supabase/client';
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
import { GraduationCap, Users, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import collegeLogo from '@/assets/college-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { data: branches = [], isLoading: branchesLoading } = useBranches();
  const { data: regulations = [], isLoading: regulationsLoading } = useRegulations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRegulation, setSelectedRegulation] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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
    const { error, userId } = await signUp(
      email,
      password,
      name,
      selectedRole,
      selectedBranch,
      selectedRole === 'student' ? selectedRegulation : undefined
    );

    // Upload avatar if selected and signup succeeded
    if (!error && userId && avatarFile && selectedRole === 'faculty') {
      try {
        const path = `avatars/${userId}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(path, avatarFile, { upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('resources')
            .getPublicUrl(path);
          
          await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);
        }
      } catch (e) {
        console.error('Avatar upload failed:', e);
      }
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* College Header */}
      <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border/50 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <img src={collegeLogo} alt="Sir C.R. Reddy College of Engineering Logo" className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-full bg-white p-1 shadow-sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-foreground leading-tight tracking-tight">
              Sir C.R. Reddy College of Engineering
            </h1>
            <p className="text-xs md:text-sm font-semibold text-primary">(Autonomous)</p>
            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight mt-0.5">
              Approved by AICTE | Affiliated to JNTUK | Accredited by NBA &amp; NAAC (A Grade)
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
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
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground">Sign Up</TabsTrigger>
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
              {/* Role Selector */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedRole === 'faculty' ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedRole('faculty')}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Users className="w-10 h-10 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">Faculty</h3>
                    <p className="text-xs text-muted-foreground text-center">Add & manage</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedRole === 'student' ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedRole('student')}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <GraduationCap className="w-10 h-10 text-primary mb-2" />
                    <h3 className="font-semibold text-sm">Student</h3>
                    <p className="text-xs text-muted-foreground text-center">View & learn</p>
                  </CardContent>
                </Card>
              </div>

              {selectedRole && (
                <>
                  {/* Faculty Avatar Upload */}
                  {selectedRole === 'faculty' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={avatarPreview || ''} />
                          <AvatarFallback className="bg-primary/10">
                            <Camera className="w-8 h-8 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                          <Camera className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Add profile photo</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                    </div>
                  )}

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
    </div>
  );
};

export default Login;
