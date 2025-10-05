import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Dashboard from "@/pages/dashboard";
import SupportDashboard from "@/pages/support-dashboard";
import Licenses from "@/pages/licenses";
import ActivityHistory from "@/pages/activity-history";
import UsersPage from "@/pages/users";
import Login from "@/pages/login";
import AppLayout from "@/components/layout/app-layout";
import Mensagens from "@/pages/mensagens";
import Clientes from "./pages/clientes";
import Representantes from "./pages/representantes";
import ChamadosPage from "@/pages/chamados"; // Importa a página de Chamados
import ChamadoDetalhesPage from "@/pages/chamado-detalhes"; // Importa a página de detalhes do chamado

// Placeholder for ProtectedRoute, assuming it exists elsewhere
const ProtectedRoute = ({ children }) => {
  // In a real app, this would check user authentication status
  // For this example, we'll assume it always returns children
  return children;
};

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Usuários técnicos têm acesso ao dashboard personalizado, licenças e clientes
  if (user.role === 'support') {
    return (
      <AppLayout>
        <Switch>
          <Route path="/" component={SupportDashboard} />
          <Route path="/licenses" component={Licenses} />
          <Route path="/clientes" component={Clientes} />
          <Route component={() => <Redirect to="/" />} />
        </Switch>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/licenses" component={Licenses} />
        <Route path="/activities" component={ActivityHistory} />
        <Route path="/users" component={UsersPage} />
        <Route path="/mensagens" component={Mensagens} />
        <Route path="/clientes" component={Clientes} />
        <Route path="/representantes" component={Representantes} />
        <Route path="/chamados" component={ChamadosPage} />
        <Route path="/chamados/:id" component={ChamadoDetalhesPage} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;