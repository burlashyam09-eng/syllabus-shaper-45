import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useStudentSubject } from '@/hooks/useStudentData';
import { useRegulations } from '@/hooks/useBranchesAndRegulations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Circle, BookOpen, FileText } from 'lucide-react';

const StudentSubjectPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branch');
  const regulationId = searchParams.get('regulation');
  const { data: subject, isLoading } = useStudentSubject(id);
  const { data: regulations = [] } = useRegulations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4"><Skeleton className="h-10 w-64" /></div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full mb-4" />)}
        </main>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Subject not found</h2>
          <Link to={`/student/dashboard?branch=${branchId}&regulation=${regulationId}`}>
            <Button>← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const regulation = regulations.find(r => r.id === subject.regulation_id);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/student/dashboard?branch=${branchId}&regulation=${regulationId}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{subject.code}</Badge>
                {regulation && <Badge variant="outline" className="text-xs">{regulation.name}</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Accordion type="multiple" className="space-y-4">
          {subject.units?.map((unit: any) => (
            <AccordionItem key={unit.id} value={unit.id} className="bg-card border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 w-full">
                  <BookOpen className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground">{unit.modules?.length || 0} modules</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3 mt-2">
                  {unit.modules?.map((module: any) => (
                    <Link
                      key={module.id}
                      to={`/student/subject/${subject.id}/unit/${unit.id}/module/${module.id}?branch=${branchId}&regulation=${regulationId}`}
                    >
                      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                        <CardContent className="flex items-center gap-4 p-4">
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {module.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{module.topics?.length || 0} topics</p>
                          </div>
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {(!subject.units || subject.units.length === 0) && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No units yet</h3>
            <p className="text-muted-foreground">Units will appear here once added.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentSubjectPage;
