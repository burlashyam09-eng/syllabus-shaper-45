import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RegulationsState {
  regulations: string[];
  addRegulation: (regulation: string) => void;
  removeRegulation: (regulation: string) => void;
}

const defaultRegulations = [
  'R22 (2022-2026)',
  'R21 (2021-2025)',
  'R20 (2020-2024)',
  'R19 (2019-2023)',
];

export const useRegulationsStore = create<RegulationsState>()(
  persist(
    (set) => ({
      regulations: defaultRegulations,
      
      addRegulation: (regulation) => set((state) => ({
        regulations: state.regulations.includes(regulation) 
          ? state.regulations 
          : [...state.regulations, regulation]
      })),
      
      removeRegulation: (regulation) => set((state) => ({
        regulations: state.regulations.filter((r) => r !== regulation)
      })),
    }),
    { name: 'regulations-store' }
  )
);
