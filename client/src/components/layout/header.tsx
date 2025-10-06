
import NotificationsBell from "@/components/notifications-bell";

export default function Header() {
  return (
    <header className="bg-white border-b border-[#e0e0e0] shadow-sm">
      <div className="px-4 py-3 flex justify-end items-center">
        <NotificationsBell />
      </div>
    </header>
  );
}
