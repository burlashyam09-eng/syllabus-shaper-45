import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSyllabusStore, Subject } from '@/store/syllabusStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Plus,
  LogOut,
  Upload,
  ChevronRight,
  GraduationCap,
  Users,
} from 'lucide-react';

const regulations = [
  'R22 (2022-2026)',
  'R21 (2021-2025)',
  'R20 (2020-2024)',
  'R19 (2019-2023)',
];

const Dashboard = () => {
  const { user, logout, isFaculty } = useAuth();
  const navigate = useNavigate();
  const { subjects, addSubject, parseSyllabus } = useSyllabusStore();
  const [syllabusText, setSyllabusText] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [selectedRegulation, setSelectedRegulation] = useState(user?.regulation || regulations[0]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredSubjects = subjects.filter((s) => 
    isFaculty || s.regulation === user?.regulation
  );

  const calculateProgress = (subject: Subject) => {
    const totalModules = subject.units.reduce((acc, u) => acc + u.modules.length, 0);
    const completedModules = subject.units.reduce(
      (acc, u) => acc + u.modules.filter((m) => m.completed).length,
      0
    );
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  const handleParseSyllabus = () => {
    if (syllabusText.trim()) {
      parseSyllabus(syllabusText, selectedRegulation);
      setSyllabusText('');
      setIsUploadOpen(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubjectName && newSubjectCode) {
      addSubject({
        id: crypto.randomUUID(),
        name: newSubjectName,
        code: newSubjectCode,
        regulation: selectedRegulation,
        units: [],
      });
      setNewSubjectName('');
      setNewSubjectCode('');
      setIsAddOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">EduLearn</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isFaculty ? 'bg-faculty text-faculty-foreground' : 'bg-student text-student-foreground'
              }`}>
                {isFaculty ? <Users className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-muted-foreground text-xs">
                  {isFaculty ? user?.branch : user?.regulation}
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-muted-foreground">
            {isFaculty
              ? 'Manage your courses and add learning resources for students.'
              : 'Continue your learning journey and track your progress.'}
          </p>
        </div>

        {/* Action Buttons - Only for Faculty */}
        {isFaculty && (
          <div className="flex flex-wrap gap-4 mb-8">
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Syllabus
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload & Parse Syllabus</DialogTitle>
                  <DialogDescription>
                    Paste your syllabus text below. It will be automatically parsed into subjects, units, and modules.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Regulation</Label>
                    <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regulations.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Syllabus Content</Label>
                    <Textarea
                      placeholder={`Example format:
CS201 Data Structures
Unit 1: Introduction
Arrays and Operations
Linked Lists
Unit 2: Trees
Binary Trees
AVL Trees`}
                      className="min-h-[200px] font-mono text-sm"
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleParseSyllabus} className="w-full">
                    Parse & Add Syllabus
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject manually and add units/modules later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Code</Label>
                    <Input
                      placeholder="e.g., CS301"
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Name</Label>
                    <Input
                      placeholder="e.g., Operating Systems"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regulation</Label>
                    <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regulations.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddSubject} className="w-full">
                    Add Subject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const progress = calculateProgress(subject);
            return (
              <Link key={subject.id} to={`/subject/${subject.id}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="mb-2">
                        {subject.code}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {subject.regulation}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {subject.name}
                    </CardTitle>
                    <CardDescription>
                      {subject.units.length} units • {subject.units.reduce((acc, u) => acc + u.modules.length, 0)} modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center text-sm text-primary font-medium">
                      Continue Learning
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No subjects found</h3>
            <p className="text-muted-foreground">
              {isFaculty
                ? 'Upload a syllabus or add a subject to get started.'
                : 'No courses available for your regulation yet.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
