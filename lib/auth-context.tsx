"use client";
import { createContext, useContext, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{ user: null, isLoading: false, login: async () => ({}), register: async () => ({}), logout: () => {} }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
