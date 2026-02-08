import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useRegulations, useCreateRegulation, useUpdateRegulation, useDeleteRegulation } from '@/hooks/useBranchesAndRegulations';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Plus,
  LogOut,
  GraduationCap,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';

const Dashboard = () => {
  const { profile, role, signOut, isFaculty, user } = useAuth();
  const { data: branches = [] } = useBranches();
  const { data: regulations = [], isLoading: regulationsLoading } = useRegulations();
  const createRegulation = useCreateRegulation();
  const updateRegulation = useUpdateRegulation();
  const deleteRegulation = useDeleteRegulation();

  // Selected regulation for filtering (faculty) or auto-set (student)
  const [selectedRegulation, setSelectedRegulation] = useState<string>('all');
  const filterRegulation = isFaculty 
    ? (selectedRegulation === 'all' ? undefined : selectedRegulation)
    : profile?.regulation_id || undefined;

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects(filterRegulation);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  // Dialog states
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isRegulationDialogOpen, setIsRegulationDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditRegulationDialogOpen, setIsEditRegulationDialogOpen] = useState(false);
  const [deleteRegulationDialogOpen, setDeleteRegulationDialogOpen] = useState(false);
  const [selectedRegulationForAction, setSelectedRegulationForAction] = useState<string | null>(null);
  const [selectedSubjectForAction, setSelectedSubjectForAction] = useState<string | null>(null);

  // Form states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectRegulation, setNewSubjectRegulation] = useState('');
  const [newRegulationName, setNewRegulationName] = useState('');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCode, setEditSubjectCode] = useState('');
  const [editRegulationName, setEditRegulationName] = useState('');

  const branchName = branches.find(b => b.id === profile?.branch_id)?.name || 'Unknown Branch';
  const regulationName = regulations.find(r => r.id === profile?.regulation_id)?.name;

  const handleAddSubject = async () => {
    if (newSubjectName.trim() && newSubjectCode.trim() && newSubjectRegulation) {
      await createSubject.mutateAsync({
        name: newSubjectName,
        code: newSubjectCode,
        regulationId: newSubjectRegulation,
      });
      setNewSubjectName('');
      setNewSubjectCode('');
      setNewSubjectRegulation('');
      setIsSubjectDialogOpen(false);
    }
  };

  const handleAddRegulation = async () => {
    if (newRegulationName.trim()) {
      await createRegulation.mutateAsync(newRegulationName);
      setNewRegulationName('');
      setIsRegulationDialogOpen(false);
    }
  };

  const handleEditSubject = async () => {
    if (selectedSubjectForAction && editSubjectName.trim() && editSubjectCode.trim()) {
      await updateSubject.mutateAsync({
        id: selectedSubjectForAction,
        name: editSubjectName,
        code: editSubjectCode,
      });
      setIsEditDialogOpen(false);
      setSelectedSubjectForAction(null);
    }
  };

  const handleDeleteSubject = async () => {
    if (selectedSubjectForAction) {
      await deleteSubject.mutateAsync(selectedSubjectForAction);
      setDeleteDialogOpen(false);
      setSelectedSubjectForAction(null);
    }
  };

  const openEditDialog = (subject: typeof subjects[0]) => {
    setSelectedSubjectForAction(subject.id);
    setEditSubjectName(subject.name);
    setEditSubjectCode(subject.code);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (subjectId: string) => {
    setSelectedSubjectForAction(subjectId);
    setDeleteDialogOpen(true);
  };

  const canEditSubject = (subject: typeof subjects[0]) => {
    return isFaculty && subject.created_by === user?.id;
  };

  const canEditRegulation = (regulation: typeof regulations[0]) => {
    return isFaculty && regulation.created_by === user?.id;
  };

  const openEditRegulationDialog = (regulation: typeof regulations[0]) => {
    setSelectedRegulationForAction(regulation.id);
    setEditRegulationName(regulation.name);
    setIsEditRegulationDialogOpen(true);
  };

  const handleEditRegulation = async () => {
    if (selectedRegulationForAction && editRegulationName.trim()) {
      await updateRegulation.mutateAsync({
        id: selectedRegulationForAction,
        name: editRegulationName,
      });
      setIsEditRegulationDialogOpen(false);
      setSelectedRegulationForAction(null);
    }
  };

  const handleDeleteRegulation = async () => {
    if (selectedRegulationForAction) {
      await deleteRegulation.mutateAsync(selectedRegulationForAction);
      setDeleteRegulationDialogOpen(false);
      setSelectedRegulationForAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">EduLearn</h1>
                <p className="text-xs text-muted-foreground">{branchName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.name || 'User'}</p>
                <div className="flex items-center gap-1 justify-end">
                  <Badge variant={isFaculty ? 'default' : 'secondary'} className="text-xs">
                    {isFaculty ? <Users className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
                    {role}
                  </Badge>
                  {regulationName && (
                    <Badge variant="outline" className="text-xs">{regulationName}</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Faculty Actions */}
        {isFaculty && (
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Add Subject */}
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>Create a new subject for your branch</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Name</Label>
                    <Input
                      placeholder="e.g., Data Structures"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Code</Label>
                    <Input
                      placeholder="e.g., CS201"
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regulation</Label>
                    <Select value={newSubjectRegulation} onValueChange={setNewSubjectRegulation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select regulation" />
                      </SelectTrigger>
                      <SelectContent>
                        {regulations.map((reg) => (
                          <SelectItem key={reg.id} value={reg.id}>
                            {reg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddSubject} 
                    className="w-full"
                    disabled={createSubject.isPending}
                  >
                    {createSubject.isPending ? 'Creating...' : 'Add Subject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Regulation */}
            <Dialog open={isRegulationDialogOpen} onOpenChange={setIsRegulationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Regulation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Regulation</DialogTitle>
                  <DialogDescription>Create a new academic regulation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Regulation Name</Label>
                    <Input
                      placeholder="e.g., R23 (2023-2027)"
                      value={newRegulationName}
                      onChange={(e) => setNewRegulationName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleAddRegulation} 
                    className="w-full"
                    disabled={createRegulation.isPending}
                  >
                    {createRegulation.isPending ? 'Creating...' : 'Add Regulation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Filter by Regulation */}
            <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by regulation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regulations</SelectItem>
                {regulations.map((reg) => (
                  <SelectItem key={reg.id} value={reg.id}>
                    {reg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Regulations Management Section - Faculty Only */}
        {isFaculty && regulations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Regulations</h2>
            <div className="flex flex-wrap gap-2">
              {regulations.filter(reg => canEditRegulation(reg)).map((reg) => (
                <Badge key={reg.id} variant="secondary" className="flex items-center gap-2 py-2 px-3">
                  {reg.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditRegulationDialog(reg)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedRegulationForAction(reg.id);
                          setDeleteRegulationDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))
          ) : subjects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No subjects yet</h3>
              <p className="text-muted-foreground">
                {isFaculty 
                  ? 'Start by adding your first subject.' 
                  : 'Subjects will appear here once faculty adds them.'}
              </p>
            </div>
          ) : (
            subjects.map((subject) => {
              const regulation = regulations.find(r => r.id === subject.regulation_id);
              
              return (
                <Card key={subject.id} className="group hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{subject.code}</Badge>
                          {regulation && (
                            <Badge variant="outline" className="text-xs">{regulation.name}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                      </div>
                      {canEditSubject(subject) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(subject)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(subject.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <CardDescription>Click to view units and modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/subject/${subject.id}`}>
                      <Button variant="outline" className="w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Subject
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input
                value={editSubjectCode}
                onChange={(e) => setEditSubjectCode(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleEditSubject} 
              className="w-full"
              disabled={updateSubject.isPending}
            >
              {updateSubject.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subject and all its units, modules, and resources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSubject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Regulation Dialog */}
      <Dialog open={isEditRegulationDialogOpen} onOpenChange={setIsEditRegulationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Regulation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Regulation Name</Label>
              <Input
                value={editRegulationName}
                onChange={(e) => setEditRegulationName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleEditRegulation} 
              className="w-full"
              disabled={updateRegulation.isPending}
            >
              {updateRegulation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Regulation Confirmation */}
      <AlertDialog open={deleteRegulationDialogOpen} onOpenChange={setDeleteRegulationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Regulation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this regulation. All subjects using this regulation will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRegulation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
