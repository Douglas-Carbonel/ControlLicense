import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/stats-cards";
import RecentLicensesTable from "@/components/recent-licenses-table";
import ActivityLog from "@/components/activity-log";
import NewLicenseModal from "@/components/modals/new-license-modal";
import ImportModal from "@/components/modals/import-modal";

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Visão geral do sistema de licenças</p>
          </div>
          <div className="flex space-x-3">
            <ImportModal />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <NewLicenseModal />
          </div>
        </div>
      </div>

      <StatsCards />
      <RecentLicensesTable />
      <ActivityLog />
    </div>
  );
}
