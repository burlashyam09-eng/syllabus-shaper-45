import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Resource {
  id: string;
  type: 'youtube' | 'notes' | 'formula' | 'important-questions' | 'pyq';
  title: string;
  url?: string;
  content?: string;
  regulation: string;
  createdBy: string; // Faculty ID who created this
}

export interface Module {
  id: string;
  name: string;
  topics: string[];
  resources: Resource[];
  completed: boolean;
}

export interface Unit {
  id: string;
  name: string;
  modules: Module[];
  pdfUnlocked: boolean;
  pdfUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  units: Unit[];
  regulation: string;
  branch: string; // Branch this subject belongs to
  createdBy: string; // Faculty ID who created this
}

interface SyllabusState {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  updateSubject: (subjectId: string, updates: Partial<Pick<Subject, 'name' | 'code'>>) => void;
  deleteSubject: (subjectId: string, userId: string) => boolean;
  addUnit: (subjectId: string, unit: Unit) => void;
  updateUnit: (subjectId: string, unitId: string, updates: Partial<Pick<Unit, 'name'>>) => void;
  deleteUnit: (subjectId: string, unitId: string, userId: string) => boolean;
  addModule: (subjectId: string, unitId: string, module: Module) => void;
  updateModule: (subjectId: string, unitId: string, moduleId: string, updates: Partial<Pick<Module, 'name'>>) => void;
  deleteModule: (subjectId: string, unitId: string, moduleId: string, userId: string) => boolean;
  addResource: (subjectId: string, unitId: string, moduleId: string, resource: Resource) => void;
  deleteResource: (subjectId: string, unitId: string, moduleId: string, resourceId: string, userId: string) => boolean;
  toggleModuleComplete: (subjectId: string, unitId: string, moduleId: string) => void;
  getSubjectsByBranchAndRegulation: (branch: string, regulation?: string) => Subject[];
}

const initialSubjects: Subject[] = [
  {
    id: '1',
    name: 'Data Structures',
    code: 'CS201',
    regulation: 'R22 (2022-2026)',
    branch: 'Computer Science',
    createdBy: 'system',
    units: [
      {
        id: 'u1',
        name: 'Unit 1: Introduction to Data Structures',
        pdfUnlocked: false,
        modules: [
          {
            id: 'm1',
            name: 'Module 1: Arrays and Strings',
            topics: ['1D Arrays', '2D Arrays', 'String Operations'],
            completed: false,
            resources: [
              { id: 'r1', type: 'youtube', title: 'Arrays Explained', url: 'https://youtube.com', regulation: 'R22 (2022-2026)', createdBy: 'system' },
              { id: 'r2', type: 'notes', title: 'Array Notes PDF', url: '#', regulation: 'R22 (2022-2026)', createdBy: 'system' },
            ],
          },
          {
            id: 'm2',
            name: 'Module 2: Linked Lists',
            topics: ['Singly Linked List', 'Doubly Linked List', 'Circular List'],
            completed: false,
            resources: [],
          },
        ],
      },
      {
        id: 'u2',
        name: 'Unit 2: Stacks and Queues',
        pdfUnlocked: false,
        modules: [
          {
            id: 'm3',
            name: 'Module 1: Stack Operations',
            topics: ['Push', 'Pop', 'Applications'],
            completed: false,
            resources: [],
          },
        ],
      },
    ],
  },
];

export const useSyllabusStore = create<SyllabusState>()(
  persist(
    (set, get) => ({
      subjects: initialSubjects,
      
      addSubject: (subject) => set((state) => ({ 
        subjects: [...state.subjects, subject] 
      })),

      updateSubject: (subjectId, updates) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId ? { ...s, ...updates } : s
        ),
      })),

      deleteSubject: (subjectId, userId) => {
        const state = get();
        const subject = state.subjects.find((s) => s.id === subjectId);
        // Only the creator can delete
        if (!subject || (subject.createdBy !== userId && subject.createdBy !== 'system')) {
          return false;
        }
        set({ subjects: state.subjects.filter((s) => s.id !== subjectId) });
        return true;
      },
      
      addUnit: (subjectId, unit) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId ? { ...s, units: [...s.units, unit] } : s
        ),
      })),

      updateUnit: (subjectId, unitId, updates) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                units: s.units.map((u) =>
                  u.id === unitId ? { ...u, ...updates } : u
                ),
              }
            : s
        ),
      })),

      deleteUnit: (subjectId, unitId, userId) => {
        const state = get();
        const subject = state.subjects.find((s) => s.id === subjectId);
        if (!subject || (subject.createdBy !== userId && subject.createdBy !== 'system')) {
          return false;
        }
        set({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? { ...s, units: s.units.filter((u) => u.id !== unitId) }
              : s
          ),
        });
        return true;
      },
      
      addModule: (subjectId, unitId, module) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                units: s.units.map((u) =>
                  u.id === unitId ? { ...u, modules: [...u.modules, module] } : u
                ),
              }
            : s
        ),
      })),

      updateModule: (subjectId, unitId, moduleId, updates) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                units: s.units.map((u) =>
                  u.id === unitId
                    ? {
                        ...u,
                        modules: u.modules.map((m) =>
                          m.id === moduleId ? { ...m, ...updates } : m
                        ),
                      }
                    : u
                ),
              }
            : s
        ),
      })),

      deleteModule: (subjectId, unitId, moduleId, userId) => {
        const state = get();
        const subject = state.subjects.find((s) => s.id === subjectId);
        if (!subject || (subject.createdBy !== userId && subject.createdBy !== 'system')) {
          return false;
        }
        set({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  units: s.units.map((u) =>
                    u.id === unitId
                      ? { ...u, modules: u.modules.filter((m) => m.id !== moduleId) }
                      : u
                  ),
                }
              : s
          ),
        });
        return true;
      },
      
      addResource: (subjectId, unitId, moduleId, resource) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                units: s.units.map((u) =>
                  u.id === unitId
                    ? {
                        ...u,
                        modules: u.modules.map((m) =>
                          m.id === moduleId
                            ? { ...m, resources: [...m.resources, resource] }
                            : m
                        ),
                      }
                    : u
                ),
              }
            : s
        ),
      })),

      deleteResource: (subjectId, unitId, moduleId, resourceId, userId) => {
        const state = get();
        const subject = state.subjects.find((s) => s.id === subjectId);
        const unit = subject?.units.find((u) => u.id === unitId);
        const module = unit?.modules.find((m) => m.id === moduleId);
        const resource = module?.resources.find((r) => r.id === resourceId);
        
        // Only the creator can delete their own resource
        if (!resource || (resource.createdBy !== userId && resource.createdBy !== 'system')) {
          return false;
        }
        
        set({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  units: s.units.map((u) =>
                    u.id === unitId
                      ? {
                          ...u,
                          modules: u.modules.map((m) =>
                            m.id === moduleId
                              ? { ...m, resources: m.resources.filter((r) => r.id !== resourceId) }
                              : m
                          ),
                        }
                      : u
                  ),
                }
              : s
          ),
        });
        return true;
      },
      
      toggleModuleComplete: (subjectId, unitId, moduleId) => set((state) => {
        const newSubjects = state.subjects.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                units: s.units.map((u) => {
                  if (u.id !== unitId) return u;
                  
                  const newModules = u.modules.map((m) =>
                    m.id === moduleId ? { ...m, completed: !m.completed } : m
                  );
                  
                  const allCompleted = newModules.every((m) => m.completed);
                  
                  return {
                    ...u,
                    modules: newModules,
                    pdfUnlocked: allCompleted,
                  };
                }),
              }
            : s
        );
        
        return { subjects: newSubjects };
      }),

      getSubjectsByBranchAndRegulation: (branch, regulation) => {
        const state = get();
        return state.subjects.filter((s) => {
          const branchMatch = s.branch === branch;
          const regulationMatch = !regulation || s.regulation === regulation;
          return branchMatch && regulationMatch;
        });
      },
    }),
    { name: 'syllabus-store' }
  )
);
