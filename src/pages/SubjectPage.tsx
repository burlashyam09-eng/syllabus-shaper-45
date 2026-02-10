import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubject, useCreateUnit, useUpdateUnit, useDeleteUnit, useCreateModule, useDeleteModule } from '@/hooks/useSubjects';
import { useRegulations } from '@/hooks/useBranchesAndRegulations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  BookOpen,
  FileText,
  Lock,
  Unlock,
  MoreVertical,
  Pencil,
  Trash2,
  LogOut,
} from 'lucide-react';

const SubjectPage = () => {
  const { id } = useParams();
  const { isFaculty, user, signOut } = useAuth();
  const { data: subject, isLoading } = useSubject(id);
  const { data: regulations = [] } = useRegulations();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();

  const [newUnitName, setNewUnitName] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editUnitDialogOpen, setEditUnitDialogOpen] = useState(false);
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [editUnitName, setEditUnitName] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Subject not found</h2>
          <Link to="/dashboard">
            <Button>← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const regulation = regulations.find(r => r.id === subject.regulation_id);
  const canEdit = isFaculty && subject.created_by === user?.id;

  const handleAddUnit = async () => {
    if (newUnitName.trim()) {
      await createUnit.mutateAsync({ name: newUnitName, subjectId: subject.id });
      setNewUnitName('');
      setIsUnitDialogOpen(false);
    }
  };

  const handleAddModule = async () => {
    if (newModuleName.trim() && selectedUnitId) {
      await createModule.mutateAsync({ name: newModuleName, unitId: selectedUnitId });
      setNewModuleName('');
      setIsModuleDialogOpen(false);
    }
  };

  const handleEditUnit = async () => {
    if (selectedUnitId && editUnitName.trim()) {
      await updateUnit.mutateAsync({ id: selectedUnitId, name: editUnitName });
      setEditUnitDialogOpen(false);
      setSelectedUnitId(null);
    }
  };

  const handleDeleteUnit = async () => {
    if (selectedUnitId) {
      await deleteUnit.mutateAsync(selectedUnitId);
      setDeleteUnitDialogOpen(false);
      setSelectedUnitId(null);
    }
  };

  const handleDeleteModule = async () => {
    if (selectedModuleId) {
      await deleteModule.mutateAsync(selectedModuleId);
      setDeleteModuleDialogOpen(false);
      setSelectedModuleId(null);
    }
  };

  const openModuleDialog = (unitId: string) => {
    setSelectedUnitId(unitId);
    setIsModuleDialogOpen(true);
  };

  const openEditUnitDialog = (unitId: string, name: string) => {
    setSelectedUnitId(unitId);
    setEditUnitName(name);
    setEditUnitDialogOpen(true);
  };

  const openDeleteUnitDialog = (unitId: string) => {
    setSelectedUnitId(unitId);
    setDeleteUnitDialogOpen(true);
  };

  const openDeleteModuleDialog = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setDeleteModuleDialogOpen(true);
  };

  const getUnitProgress = (unit: typeof subject.units[0]) => {
    if (unit.modules.length === 0) return 0;
    const completed = unit.modules.filter((m) => m.completed).length;
    return Math.round((completed / unit.modules.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{subject.code}</Badge>
                  {regulation && <Badge variant="outline" className="text-xs">{regulation.name}</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Add Unit Button - Faculty Only (Creator) */}
        {canEdit && (
          <div className="mb-6">
            <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Unit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Unit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Unit Name</Label>
                    <Input
                      placeholder="e.g., Unit 3: Graphs and Trees"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddUnit} className="w-full" disabled={createUnit.isPending}>
                    {createUnit.isPending ? 'Adding...' : 'Add Unit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Units Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {subject.units.map((unit) => (
            <AccordionItem
              key={unit.id}
              value={unit.id}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 w-full">
                  <BookOpen className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {unit.modules.length} modules • {unit.modules.filter((m) => m.completed).length} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 mr-2 sm:mr-4">
                    <div className="w-20 sm:w-32">
                      <Progress value={getUnitProgress(unit)} className="h-2" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground w-10 sm:w-12">
                      {getUnitProgress(unit)}%
                    </span>
                    <div className="hidden sm:block">
                      {unit.pdf_unlocked ? (
                        <Badge className="bg-success text-success-foreground gap-1">
                          <Unlock className="w-3 h-3" />
                          PDF Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Complete to unlock
                        </Badge>
                      )}
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditUnitDialog(unit.id, unit.name)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteUnitDialog(unit.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3 mt-2">
                  {unit.modules.map((module) => (
                    <div key={module.id} className="flex items-center gap-2">
                      <Link
                        to={`/subject/${subject.id}/unit/${unit.id}/module/${module.id}`}
                        className="flex-1"
                      >
                        <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                          <CardContent className="flex items-center gap-4 p-4">
                            {module.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {module.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {module.topics?.length || 0} topics
                              </p>
                            </div>
                            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </CardContent>
                        </Card>
                      </Link>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => openDeleteModuleDialog(module.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Add Module Button - Faculty Only (Creator) */}
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                      onClick={() => openModuleDialog(unit.id)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Module
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {subject.units.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No units yet</h3>
            <p className="text-muted-foreground">
              {canEdit ? 'Add your first unit to start organizing content.' : 'Units will appear here once added.'}
            </p>
          </div>
        )}

        {/* Module Dialog */}
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Module Name</Label>
                <Input
                  placeholder="e.g., Module 1: Binary Trees"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddModule} className="w-full" disabled={createModule.isPending}>
                {createModule.isPending ? 'Adding...' : 'Add Module'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Unit Dialog */}
        <Dialog open={editUnitDialogOpen} onOpenChange={setEditUnitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Unit Name</Label>
                <Input
                  value={editUnitName}
                  onChange={(e) => setEditUnitName(e.target.value)}
                />
              </div>
              <Button onClick={handleEditUnit} className="w-full" disabled={updateUnit.isPending}>
                {updateUnit.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Unit Dialog */}
        <AlertDialog open={deleteUnitDialogOpen} onOpenChange={setDeleteUnitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this unit and all its modules and resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUnit}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Module Dialog */}
        <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Module?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this module and all its resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteModule}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default SubjectPage;
