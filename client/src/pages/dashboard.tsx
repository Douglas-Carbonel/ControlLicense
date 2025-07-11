import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/stats-cards";
import RecentLicensesTable from "@/components/recent-licenses-table";
import ActivityLog from "@/components/activity-log";
import NewLicenseModal from "@/components/modals/new-license-modal";
import ImportModal from "@/components/modals/import-modal";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/licenses/stats"],
    queryFn: async () => {
      const response = await fetch("/api/licenses/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
          <p className="text-gray-600 mt-1">Visão geral das licenças e atividades do sistema</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <NewLicenseModal />
        </div>
      </div>

      <StatsCards stats={stats || { total: 0, active: 0, inactive: 0, expiring: 0 }} />
      <RecentLicensesTable />
      <ActivityLog />
    </div>
  );
}
