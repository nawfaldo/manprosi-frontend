import { create } from "zustand";

type User = {
  id: number;
  username: string;
  role: string;
} | null;

type AuthStore = {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
