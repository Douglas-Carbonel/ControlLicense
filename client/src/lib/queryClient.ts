import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Controle de renovação para evitar múltiplas requisições simultâneas
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Função para verificar se o token está próximo do vencimento
function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Converter para millisegundos
    const now = Date.now();
    const timeUntilExpiration = exp - now;
    
    // Debug: Log do tempo restante apenas se próximo do vencimento
    if (timeUntilExpiration < 2 * 60 * 60 * 1000) {
      console.log('Token expira em:', Math.round(timeUntilExpiration / 1000 / 60), 'minutos');
    }
    
    // Renovar se expira em menos de 2 horas (mais agressivo)
    return timeUntilExpiration < 2 * 60 * 60 * 1000;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return true; // Se não conseguir decodificar, considerar expirado
  }
}

// Função para renovar token automaticamente
async function renewTokenIfNeeded() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  // Se já está renovando, esperar o resultado
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
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
        console.log('Token renovado com sucesso');
        return data.token;
      } else {
        // Token não pode ser renovado
        console.error('Falha ao renovar token:', response.status);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let token = localStorage.getItem("token");
  
  // Verificar se o token está próximo do vencimento e renovar preventivamente
  if (token && isTokenExpiringSoon(token)) {
    const newToken = await renewTokenIfNeeded();
    if (newToken) {
      token = newToken;
    }
  }
  
  // Primeira tentativa
  let res = await fetch(url, {
    method,
    headers: {
      ...(data && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Se got 401, tentar renovar token e repetir
  if (res.status === 401 && token) {
    const newToken = await renewTokenIfNeeded();
    if (newToken) {
      // Repetir requisição com novo token
      res = await fetch(url, {
        method,
        headers: {
          ...(data && { "Content-Type": "application/json" }),
          Authorization: `Bearer ${newToken}`,
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let token = localStorage.getItem("token");
    
    // Debug: verificar se o token existe
    if (!token) {
      console.error('Token não encontrado no localStorage');
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      window.location.reload();
      return null;
    }
    
    // Verificar se o token está próximo do vencimento e renovar preventivamente
    if (token && isTokenExpiringSoon(token)) {
      const newToken = await renewTokenIfNeeded();
      if (newToken) {
        token = newToken;
      }
    }
    
    // Primeira tentativa
    let res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // Se got 401, tentar renovar token e repetir
    if (res.status === 401 && token) {
      console.log('Token expirado, renovando automaticamente...');
      const newToken = await renewTokenIfNeeded();
      if (newToken) {
        // Repetir requisição com novo token
        res = await fetch(queryKey.join("/") as string, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
        console.log('Token renovado com sucesso');
      }
    }

    if (res.status === 401) {
      console.error('Falha na autenticação, redirecionando para login...');
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // Recarregar a página para forçar novo login
      window.location.reload();
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 10 * 60 * 1000, // 10 minutos - mais tempo para evitar requests desnecessários
      cacheTime: 15 * 60 * 1000, // 15 minutos de cache
      retry: (failureCount, error) => {
        if (error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 1; // Reduzir tentativas
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
    mutations: {
      retry: false,
    },
  },
});
