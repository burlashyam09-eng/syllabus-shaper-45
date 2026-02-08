import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleWithResources, useCreateResource, useUpdateResource, useDeleteResource, useUploadFile, useToggleModuleComplete, useStudentProgress } from '@/hooks/useResources';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Youtube,
  FileText,
  BookOpen,
  HelpCircle,
  History,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

type ResourceType = 'youtube' | 'notes' | 'formula' | 'important-questions' | 'pyq';

const resourceTypes = [
  { type: 'youtube' as ResourceType, label: 'YouTube Videos', icon: Youtube, color: 'text-red-500' },
  { type: 'notes' as ResourceType, label: 'Notes', icon: FileText, color: 'text-blue-500' },
  { type: 'formula' as ResourceType, label: 'Formulas', icon: BookOpen, color: 'text-green-500' },
  { type: 'important-questions' as ResourceType, label: 'Important Questions', icon: HelpCircle, color: 'text-amber-500' },
  { type: 'pyq' as ResourceType, label: 'Previous Year Questions', icon: History, color: 'text-purple-500' },
];

const ModulePage = () => {
  const { id: subjectId, unitId, moduleId } = useParams();
  const { isFaculty, user } = useAuth();
  const { data: moduleData, isLoading } = useModuleWithResources(moduleId);
  const { data: progress } = useStudentProgress(moduleId);
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const uploadFile = useUploadFile();
  const toggleComplete = useToggleModuleComplete();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ResourceType>('youtube');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceContent, setNewResourceContent] = useState('');
  const [editResourceTitle, setEditResourceTitle] = useState('');
  const [editResourceUrl, setEditResourceUrl] = useState('');
  const [editResourceContent, setEditResourceContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!moduleData) {
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

  const subject = moduleData.units?.subjects;
  const unit = moduleData.units;
  const resources = moduleData.resources || [];
  const canAddResources = isFaculty;
  const canEditResource = (createdBy: string) => isFaculty && createdBy === user?.id;
  const isCompleted = progress?.completed || false;

  const handleAddResource = async () => {
    if (!moduleId || !newResourceTitle.trim()) return;

    await createResource.mutateAsync({
      moduleId,
      type: activeTab,
      title: newResourceTitle,
      url: newResourceUrl || undefined,
      content: newResourceContent || undefined,
    });

    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceContent('');
    setIsAddDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !moduleId) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploadingFile(true);
    try {
      const path = `${moduleId}/${Date.now()}_${file.name}`;
      const publicUrl = await uploadFile.mutateAsync({ file, path });
      
      await createResource.mutateAsync({
        moduleId,
        type: activeTab,
        title: file.name.replace('.pdf', ''),
        url: publicUrl,
      });

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (resource: typeof resources[0]) => {
    setSelectedResourceId(resource.id);
    setEditResourceTitle(resource.title);
    setEditResourceUrl(resource.url || '');
    setEditResourceContent(resource.content || '');
    setIsEditDialogOpen(true);
  };

  const handleEditResource = async () => {
    if (!selectedResourceId || !editResourceTitle.trim()) return;

    await updateResource.mutateAsync({
      id: selectedResourceId,
      title: editResourceTitle,
      url: editResourceUrl || undefined,
      content: editResourceContent || undefined,
    });

    setIsEditDialogOpen(false);
    setSelectedResourceId(null);
  };

  const handleDeleteResource = async () => {
    if (!selectedResourceId) return;
    
    await deleteResource.mutateAsync(selectedResourceId);
    setDeleteDialogOpen(false);
    setSelectedResourceId(null);
  };

  const handleToggleComplete = async () => {
    if (!moduleId) return;
    await toggleComplete.mutateAsync({ moduleId, completed: !isCompleted });
  };

  const isPdfType = activeTab === 'notes' || activeTab === 'important-questions' || activeTab === 'pyq';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/subject/${subjectId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{subject?.code}</Badge>
                  <Badge variant="outline" className="text-xs">{unit?.name}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{moduleData.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="complete"
                checked={isCompleted}
                onCheckedChange={handleToggleComplete}
              />
              <Label htmlFor="complete" className="cursor-pointer">
                Mark as Complete
              </Label>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Topics */}
        {moduleData.topics && moduleData.topics.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moduleData.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceType)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {resourceTypes.map((rt) => (
              <TabsTrigger key={rt.type} value={rt.type} className="gap-2">
                <rt.icon className={`w-4 h-4 ${rt.color}`} />
                <span className="hidden sm:inline">{rt.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {resourceTypes.map((rt) => {
            const filteredResources = resources.filter((r) => r.type === rt.type);
            
            return (
              <TabsContent key={rt.type} value={rt.type} className="mt-6">
                {/* Add Resource Button - Faculty Only */}
                {canAddResources && (
                  <div className="flex gap-2 mb-4">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add {rt.label}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add {rt.label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              placeholder="Enter title"
                              value={newResourceTitle}
                              onChange={(e) => setNewResourceTitle(e.target.value)}
                            />
                          </div>
                          {rt.type === 'youtube' && (
                            <div className="space-y-2">
                              <Label>YouTube URL</Label>
                              <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={newResourceUrl}
                                onChange={(e) => setNewResourceUrl(e.target.value)}
                              />
                            </div>
                          )}
                          {rt.type === 'formula' && (
                            <div className="space-y-2">
                              <Label>Formula Content</Label>
                              <Textarea
                                placeholder="Enter formula or equation"
                                value={newResourceContent}
                                onChange={(e) => setNewResourceContent(e.target.value)}
                                rows={4}
                              />
                            </div>
                          )}
                          {isPdfType && rt.type !== 'formula' && (
                            <div className="space-y-2">
                              <Label>PDF URL (optional)</Label>
                              <Input
                                placeholder="https://..."
                                value={newResourceUrl}
                                onChange={(e) => setNewResourceUrl(e.target.value)}
                              />
                            </div>
                          )}
                          <Button 
                            onClick={handleAddResource} 
                            className="w-full"
                            disabled={createResource.isPending}
                          >
                            {createResource.isPending ? 'Adding...' : 'Add Resource'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {isPdfType && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingFile ? 'Uploading...' : 'Upload PDF'}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Resources List */}
                <div className="space-y-3">
                  {filteredResources.length === 0 ? (
                    <div className="text-center py-12">
                      <rt.icon className={`w-12 h-12 mx-auto ${rt.color} opacity-50 mb-4`} />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No {rt.label} yet</h3>
                      <p className="text-muted-foreground">
                        {canAddResources ? `Add your first ${rt.label.toLowerCase()}.` : `${rt.label} will appear here once added.`}
                      </p>
                    </div>
                  ) : (
                    filteredResources.map((resource) => (
                      <Card key={resource.id} className="group">
                        <CardContent className="flex items-center gap-4 p-4">
                          <rt.icon className={`w-6 h-6 ${rt.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
                            {resource.content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{resource.content}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {resource.url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(resource.url!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {canEditResource(resource.created_by) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedResourceId(resource.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editResourceTitle}
                onChange={(e) => setEditResourceTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={editResourceUrl}
                onChange={(e) => setEditResourceUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editResourceContent}
                onChange={(e) => setEditResourceContent(e.target.value)}
                rows={4}
              />
            </div>
            <Button 
              onClick={handleEditResource} 
              className="w-full"
              disabled={updateResource.isPending}
            >
              {updateResource.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteResource}
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

export default ModulePage;
