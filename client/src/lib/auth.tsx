import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para renovar token automaticamente
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        return true;
      } else {
        // Token não pode ser renovado, fazer logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    // Verificar se há token armazenado
    const token = localStorage.getItem("token");
    if (token) {
      // Verificar se o token é válido fazendo uma requisição simples
      fetch("/api/licenses/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            // Token válido, recuperar dados do usuário do localStorage
            const userData = localStorage.getItem("user");
            if (userData) {
              setUser(JSON.parse(userData));
            }
          } else if (response.status === 401) {
            // Token inválido, tentar renovar
            refreshToken();
          }
        })
        .catch(() => {
          // Erro de rede ou token inválido, limpar dados
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    // Configurar renovação automática de token a cada 20 horas
    const refreshInterval = setInterval(() => {
      if (localStorage.getItem("token")) {
        refreshToken();
      }
    }, 20 * 60 * 60 * 1000); // 20 horas em milissegundos

    // Heartbeat para verificar se o token ainda é válido a cada 5 minutos
    const heartbeatInterval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && user) {
        // Fazer uma requisição simples para verificar se o token ainda é válido
        fetch("/api/licenses/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }).then((response) => {
          if (response.status === 401) {
            console.log('Token inválido detectado no heartbeat, renovando...');
            refreshToken();
          }
        }).catch((error) => {
          console.error('Erro no heartbeat:', error);
        });
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar token quando a janela recebe foco
    const handleFocus = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken && !user) {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    };

    // Verificar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        console.log('Token removido do localStorage');
        setUser(null);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao fazer login");
    }

    const data = await response.json();
    
    // Armazenar token e dados do usuário
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    // Fazer logout no servidor
    apiRequest("POST", "/api/auth/logout").catch(() => {
      // Ignorar erros de logout
    });

    // Limpar dados locais
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}