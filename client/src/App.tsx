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
import Clientes from "@/pages/clientes";

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