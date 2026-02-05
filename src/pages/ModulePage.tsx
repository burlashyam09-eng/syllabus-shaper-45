import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSyllabusStore, Resource } from '@/store/syllabusStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Youtube,
  FileText,
  Calculator,
  HelpCircle,
  History,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

const resourceTypes = [
  { value: 'youtube', label: 'YouTube Video', icon: Youtube, color: 'text-red-500' },
  { value: 'notes', label: 'Notes', icon: FileText, color: 'text-blue-500' },
  { value: 'formula', label: 'Formula Sheet', icon: Calculator, color: 'text-green-500' },
  { value: 'important-questions', label: 'Important Questions', icon: HelpCircle, color: 'text-orange-500' },
  { value: 'pyq', label: 'Previous Year Questions', icon: History, color: 'text-purple-500' },
];

const regulations = [
  'R22 (2022-2026)',
  'R21 (2021-2025)',
  'R20 (2020-2024)',
  'R19 (2019-2023)',
];

const ModulePage = () => {
  const { id: subjectId, unitId, moduleId } = useParams();
  const { isFaculty, user } = useAuth();
  const { subjects, addResource, toggleModuleComplete } = useSyllabusStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newResourceType, setNewResourceType] = useState<Resource['type']>('youtube');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceContent, setNewResourceContent] = useState('');
  const [newResourceRegulation, setNewResourceRegulation] = useState(regulations[0]);
  const [activeTab, setActiveTab] = useState('youtube');

  const subject = subjects.find((s) => s.id === subjectId);
  const unit = subject?.units.find((u) => u.id === unitId);
  const module = unit?.modules.find((m) => m.id === moduleId);

  if (!subject || !unit || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Module not found</h2>
          <Link to="/dashboard">
            <Button>← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddResource = () => {
    if (newResourceTitle.trim()) {
      addResource(subject.id, unit.id, module.id, {
        id: crypto.randomUUID(),
        type: newResourceType,
        title: newResourceTitle,
        url: newResourceUrl || undefined,
        content: newResourceContent || undefined,
        regulation: newResourceRegulation,
      });
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceContent('');
      setIsAddOpen(false);
    }
  };

  const handleToggleComplete = () => {
    toggleModuleComplete(subject.id, unit.id, module.id);
  };

  const getResourcesByType = (type: Resource['type']) => {
    return module.resources.filter((r) => {
      // Show all for faculty, filter by regulation for students
      const regulationMatch = isFaculty || r.regulation === user?.regulation;
      return r.type === type && regulationMatch;
    });
  };

  const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
    const resourceType = resourceTypes.find((r) => r.value === type);
    if (!resourceType) return null;
    const IconComponent = resourceType.icon;
    return <IconComponent className={`w-5 h-5 ${resourceType.color}`} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/subject/${subject.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>{subject.name}</span>
                <span>•</span>
                <span>{unit.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{module.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              {module.completed && (
                <Badge className="bg-success text-success-foreground gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="complete"
                  checked={module.completed}
                  onCheckedChange={handleToggleComplete}
                />
                <Label htmlFor="complete" className="text-sm cursor-pointer">
                  Mark as complete
                </Label>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Topics */}
        {module.topics.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {module.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-5 w-auto">
              {resourceTypes.map((type) => {
                const count = getResourcesByType(type.value as Resource['type']).length;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="gap-2">
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    <span className="hidden sm:inline">{type.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Add Resource Button - Faculty Only */}
            {isFaculty && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add More +
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Resource</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Resource Type</Label>
                      <Select value={newResourceType} onValueChange={(v) => setNewResourceType(v as Resource['type'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`w-4 h-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Regulation</Label>
                      <Select value={newResourceRegulation} onValueChange={setNewResourceRegulation}>
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
                      <Label>Title</Label>
                      <Input
                        placeholder="e.g., Arrays Tutorial - Complete Guide"
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>URL (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={newResourceUrl}
                        onChange={(e) => setNewResourceUrl(e.target.value)}
                      />
                    </div>

                    {(newResourceType === 'notes' || newResourceType === 'formula') && (
                      <div className="space-y-2">
                        <Label>Content (optional)</Label>
                        <Textarea
                          placeholder="Add notes or formulas here..."
                          value={newResourceContent}
                          onChange={(e) => setNewResourceContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    )}

                    <Button onClick={handleAddResource} className="w-full">
                      Add Resource
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {resourceTypes.map((type) => (
            <TabsContent key={type.value} value={type.value}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getResourcesByType(type.value as Resource['type']).map((resource) => (
                  <Card key={resource.id} className="group hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <ResourceIcon type={resource.type} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {resource.regulation}
                          </Badge>
                          {resource.content && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {resource.content}
                            </p>
                          )}
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                            >
                              Open Resource
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getResourcesByType(type.value as Resource['type']).length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <type.icon className={`w-12 h-12 mx-auto mb-4 ${type.color} opacity-50`} />
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      No {type.label.toLowerCase()} yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isFaculty
                        ? `Click "Add More +" to add ${type.label.toLowerCase()}.`
                        : `${type.label} will appear here once added.`}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default ModulePage;
