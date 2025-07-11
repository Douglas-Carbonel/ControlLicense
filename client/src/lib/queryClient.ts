import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função para renovar token automaticamente
async function renewTokenIfNeeded() {
  const token = localStorage.getItem("token");
  if (!token) return null;

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
      return data.token;
    } else {
      // Token não pode ser renovado
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let token = localStorage.getItem("token");
  
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
    
    // Primeira tentativa
    let res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // Se got 401, tentar renovar token e repetir
    if (res.status === 401 && token) {
      const newToken = await renewTokenIfNeeded();
      if (newToken) {
        // Repetir requisição com novo token
        res = await fetch(queryKey.join("/") as string, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    if (res.status === 401) {
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
      refetchInterval: 30000, // Refetch a cada 30 segundos
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error) => {
        // Não fazer retry em erros de autenticação
        if (error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
