import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { useState } from "react";
import { ClientsView } from "./components/ClientsView";
import { DealsView } from "./components/DealsView";
import { NotificationsView } from "./components/NotificationsView";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Funil de Vendas</h2>
          <Authenticated>
            <div className="flex items-center gap-4">
              <NotificationBadge />
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>

      <Authenticated>
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "deals", label: "Negociações" },
                { id: "clients", label: "Clientes" },
                { id: "notifications", label: "Notificações" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </Authenticated>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Authenticated>
          <Content activeTab={activeTab} />
        </Authenticated>
        <Unauthenticated>
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Sistema de Funil de Vendas
              </h1>
              <p className="text-gray-600">
                Gerencie suas negociações e acompanhe o progresso das vendas
              </p>
            </div>
            <SignInForm />
          </div>
        </Unauthenticated>
      </main>
      <Toaster />
    </div>
  );
}

function Content({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;
    case "deals":
      return <DealsView />;
    case "clients":
      return <ClientsView />;
    case "notifications":
      return <NotificationsView />;
    default:
      return <Dashboard />;
  }
}

function NotificationBadge() {
  const notifications = useQuery(api.notifications.getUnread);
  const count = notifications?.length || 0;

  if (count === 0) return null;

  return (
    <div className="relative">
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </div>
      <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
    </div>
  );
}
