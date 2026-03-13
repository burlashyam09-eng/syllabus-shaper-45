import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useStudentModule, useStudentCustomCategories } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Youtube, FileText, HelpCircle, History, ExternalLink, Tag,
} from 'lucide-react';
import StudentChatbot from '@/components/StudentChatbot';

type ResourceType = 'youtube' | 'notes' | 'important-questions' | 'pyq';

const builtInTypes = [
  { type: 'youtube' as ResourceType, label: 'YouTube Videos', icon: Youtube, color: 'text-red-500' },
  { type: 'notes' as ResourceType, label: 'Notes', icon: FileText, color: 'text-blue-500' },
  { type: 'important-questions' as ResourceType, label: 'Important Questions', icon: HelpCircle, color: 'text-amber-500' },
  { type: 'pyq' as ResourceType, label: 'Previous Year Questions', icon: History, color: 'text-purple-500' },
];

const StudentModulePage = () => {
  const { id: subjectId, unitId, moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branch');
  const regulationId = searchParams.get('regulation');
  const { data: moduleData, isLoading } = useStudentModule(moduleId);
  const subjectIdForCategories = moduleData?.units?.subjects?.id;
  const { data: customCategories = [] } = useStudentCustomCategories(subjectIdForCategories);

  const [activeTab, setActiveTab] = useState<string>('youtube');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4"><Skeleton className="h-10 w-64" /></div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full mb-3" />)}
        </main>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Module not found</h2>
          <Link to={`/student/dashboard?branch=${branchId}&regulation=${regulationId}`}>
            <Button>← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subject = moduleData.units?.subjects;
  const unit = moduleData.units;
  const resources = moduleData.resources || [];

  const isCustomTab = !builtInTypes.some(bt => bt.type === activeTab);

  const getFilteredResources = () => {
    if (isCustomTab) {
      return resources.filter((r: any) => r.custom_category_id === activeTab);
    }
    return resources.filter((r: any) => r.type === activeTab && !r.custom_category_id);
  };

  const filteredResources = getFilteredResources();

  const getActiveIcon = () => {
    const bt = builtInTypes.find(b => b.type === activeTab);
    return bt ? bt.icon : Tag;
  };
  const getActiveColor = () => {
    const bt = builtInTypes.find(b => b.type === activeTab);
    return bt ? bt.color : 'text-green-500';
  };
  const getActiveLabel = () => {
    const bt = builtInTypes.find(b => b.type === activeTab);
    if (bt) return bt.label;
    const cc = customCategories.find(c => c.id === activeTab);
    return cc?.name || 'Custom';
  };

  const ActiveIcon = getActiveIcon();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to={`/student/subject/${subjectId}?branch=${branchId}&regulation=${regulationId}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{subject?.code}</Badge>
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">{unit?.name}</Badge>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{moduleData.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {moduleData.topics && moduleData.topics.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moduleData.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {builtInTypes.map(rt => (
              <TabsTrigger key={rt.type} value={rt.type} className="gap-2">
                <rt.icon className={`w-4 h-4 ${rt.color}`} />
                <span className="hidden sm:inline">{rt.label}</span>
              </TabsTrigger>
            ))}
            {customCategories.map(cc => (
              <TabsTrigger key={cc.id} value={cc.id} className="gap-2">
                <Tag className="w-4 h-4 text-green-500" />
                <span className="hidden sm:inline">{cc.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Built-in tabs */}
          {builtInTypes.map(rt => (
            <TabsContent key={rt.type} value={rt.type} className="mt-6">
              <ResourceList
                resources={resources.filter((r: any) => r.type === rt.type && !r.custom_category_id)}
                icon={rt.icon}
                color={rt.color}
                label={rt.label}
              />
            </TabsContent>
          ))}

          {/* Custom category tabs */}
          {customCategories.map(cc => (
            <TabsContent key={cc.id} value={cc.id} className="mt-6">
              <ResourceList
                resources={resources.filter((r: any) => r.custom_category_id === cc.id)}
                icon={Tag}
                color="text-green-500"
                label={cc.name}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <StudentChatbot
        moduleContext={{
          moduleName: moduleData.name,
          subjectName: subject?.name || '',
          subjectCode: subject?.code || '',
          unitName: unit?.name || '',
          topics: moduleData.topics || [],
        }}
      />
    </div>
  );

function ResourceList({ resources, icon: Icon, color, label }: {
  resources: any[];
  icon: React.ComponentType<any>;
  color: string;
  label: string;
}) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon className={`w-12 h-12 mx-auto ${color} opacity-50 mb-4`} />
        <h3 className="text-lg font-semibold text-foreground mb-2">No {label} yet</h3>
        <p className="text-muted-foreground">{label} will appear here once added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource: any) => (
        <Card key={resource.id} className="group hover:shadow-md hover:border-primary/50 transition-all">
          <CardContent className="flex items-center gap-4 p-4">
            <Icon className={`w-6 h-6 ${color} shrink-0`} />
            <div className="flex-1 min-w-0">
              {resource.url ? (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block">
                  <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors hover:underline">
                    {resource.title}
                  </h4>
                  {resource.content && <p className="text-sm text-muted-foreground line-clamp-2">{resource.content}</p>}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Click to open
                  </p>
                </a>
              ) : (
                <>
                  <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
                  {resource.content && <p className="text-sm text-muted-foreground line-clamp-2">{resource.content}</p>}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StudentModulePage;
