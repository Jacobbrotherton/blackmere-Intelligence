"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "blackmere_user";
const ACCOUNTS_KEY = "blackmere_accounts";

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Simple deterministic hash — good enough for a simulated auth system
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const getAccounts = (): StoredAccount[] => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveAccounts = (accounts: StoredAccount[]) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) return { error: "No account found with that email." };
    if (account.passwordHash !== simpleHash(password)) return { error: "Incorrect password." };

    const u: User = { id: account.id, name: account.name, email: account.email, createdAt: account.createdAt };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return {};
  };

  const register = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    if (!name.trim()) return { error: "Name is required." };
    if (!email.includes("@")) return { error: "Enter a valid email address." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };

    const accounts = getAccounts();
    if (accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { error: "An account with that email already exists." };
    }

    const newAccount: StoredAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };

    saveAccounts([...accounts, newAccount]);

    const u: User = { id: newAccount.id, name: newAccount.name, email: newAccount.email, createdAt: newAccount.createdAt };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
