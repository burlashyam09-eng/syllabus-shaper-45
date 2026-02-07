import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSyllabusStore, Unit, Module } from '@/store/syllabusStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

const SubjectPage = () => {
  const { id } = useParams();
  const { isFaculty } = useAuth();
  const { subjects, addUnit, addModule } = useSyllabusStore();
  const subject = subjects.find((s) => s.id === id);

  const [newUnitName, setNewUnitName] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

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

  const handleAddUnit = () => {
    if (newUnitName.trim()) {
      addUnit(subject.id, {
        id: crypto.randomUUID(),
        name: newUnitName,
        modules: [],
        pdfUnlocked: false,
      });
      setNewUnitName('');
      setIsUnitDialogOpen(false);
    }
  };

  const handleAddModule = () => {
    if (newModuleName.trim() && selectedUnitId) {
      addModule(subject.id, selectedUnitId, {
        id: crypto.randomUUID(),
        name: newModuleName,
        topics: [],
        completed: false,
        resources: [],
      });
      setNewModuleName('');
      setIsModuleDialogOpen(false);
    }
  };

  const openModuleDialog = (unitId: string) => {
    setSelectedUnitId(unitId);
    setIsModuleDialogOpen(true);
  };

  const getUnitProgress = (unit: Unit) => {
    if (unit.modules.length === 0) return 0;
    const completed = unit.modules.filter((m) => m.completed).length;
    return Math.round((completed / unit.modules.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{subject.code}</Badge>
                <Badge variant="outline" className="text-xs">{subject.regulation}</Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Add Unit Button - Faculty Only */}
        {isFaculty && (
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
                  <Button onClick={handleAddUnit} className="w-full">
                    Add Unit
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
                  <div className="flex items-center gap-4 mr-4">
                    <div className="w-32">
                      <Progress value={getUnitProgress(unit)} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12">
                      {getUnitProgress(unit)}%
                    </span>
                    {unit.pdfUnlocked ? (
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
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3 mt-2">
                  {unit.modules.map((module) => (
                    <Link
                      key={module.id}
                      to={`/subject/${subject.id}/unit/${unit.id}/module/${module.id}`}
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
                              {module.resources.length} resources • {module.topics.length} topics
                            </p>
                          </div>
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

                  {/* Add Module Button - Faculty Only */}
                  {isFaculty && (
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
              {isFaculty ? 'Add your first unit to start organizing content.' : 'Units will appear here once added.'}
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
              <Button onClick={handleAddModule} className="w-full">
                Add Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SubjectPage;
