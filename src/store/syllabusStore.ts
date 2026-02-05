import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Resource {
  id: string;
  type: 'youtube' | 'notes' | 'formula' | 'important-questions' | 'pyq';
  title: string;
  url?: string;
  content?: string;
  regulation: string;
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
}

interface SyllabusState {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  addUnit: (subjectId: string, unit: Unit) => void;
  addModule: (subjectId: string, unitId: string, module: Module) => void;
  addResource: (subjectId: string, unitId: string, moduleId: string, resource: Resource) => void;
  toggleModuleComplete: (subjectId: string, unitId: string, moduleId: string) => void;
  parseSyllabus: (text: string, regulation: string) => Subject[];
}

const initialSubjects: Subject[] = [
  {
    id: '1',
    name: 'Data Structures',
    code: 'CS201',
    regulation: 'R22 (2022-2026)',
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
              { id: 'r1', type: 'youtube', title: 'Arrays Explained', url: 'https://youtube.com', regulation: 'R22 (2022-2026)' },
              { id: 'r2', type: 'notes', title: 'Array Notes PDF', url: '#', regulation: 'R22 (2022-2026)' },
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
      
      addUnit: (subjectId, unit) => set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId ? { ...s, units: [...s.units, unit] } : s
        ),
      })),
      
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
      
      parseSyllabus: (text, regulation) => {
        const lines = text.split('\n').filter((l) => l.trim());
        const subjects: Subject[] = [];
        let currentSubject: Subject | null = null;
        let currentUnit: Unit | null = null;
        
        lines.forEach((line) => {
          const trimmed = line.trim();
          
          // Check for subject (starts with subject code pattern)
          if (/^[A-Z]{2,4}\d{3}/.test(trimmed)) {
            if (currentSubject) {
              if (currentUnit) currentSubject.units.push(currentUnit);
              subjects.push(currentSubject);
            }
            currentSubject = {
              id: crypto.randomUUID(),
              code: trimmed.split(/[\s:]/)[0],
              name: trimmed.replace(/^[A-Z]{2,4}\d{3}[\s:]*/, '').trim(),
              regulation,
              units: [],
            };
            currentUnit = null;
          }
          // Check for unit
          else if (/^unit\s*[\d:]/i.test(trimmed)) {
            if (currentUnit && currentSubject) {
              currentSubject.units.push(currentUnit);
            }
            currentUnit = {
              id: crypto.randomUUID(),
              name: trimmed,
              modules: [],
              pdfUnlocked: false,
            };
          }
          // Everything else is a topic/module
          else if (currentUnit && trimmed.length > 3) {
            currentUnit.modules.push({
              id: crypto.randomUUID(),
              name: `Module ${currentUnit.modules.length + 1}: ${trimmed}`,
              topics: [trimmed],
              completed: false,
              resources: [],
            });
          }
        });
        
        // Add remaining items
        if (currentSubject) {
          if (currentUnit) currentSubject.units.push(currentUnit);
          subjects.push(currentSubject);
        }
        
        // Add parsed subjects to store
        subjects.forEach((s) => get().addSubject(s));
        
        return subjects;
      },
    }),
    { name: 'syllabus-store' }
  )
);
