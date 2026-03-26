import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "../types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("accessToken")
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (t: string, u: User) => {
    localStorage.setItem("accessToken", t);
    localStorage.setItem("userData", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}