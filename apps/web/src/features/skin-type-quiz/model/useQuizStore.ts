import { create } from 'zustand';

interface QuizState {
  currentStep: number;
  answers: string[];
  result: string | null;
  nextStep: (answer: string) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentStep: 0,
  answers: [],
  result: null,
  nextStep: (answer) => {
    set((state) => ({
      answers: [...state.answers, answer],
      currentStep: state.currentStep + 1,
    }));
  },
  reset: () => set({ currentStep: 0, answers: [], result: null }),
}));
