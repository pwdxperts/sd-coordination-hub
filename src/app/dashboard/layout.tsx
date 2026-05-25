"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  AlertTriangle,
  Activity,
  Map,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "War Room", icon: LayoutDashboard },
  { href: "/dashboard/intake", label: "Intake Queue", icon: Inbox },
  { href: "/dashboard/cases", label: "Case Board", icon: Briefcase },
  { href: "/dashboard/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/dashboard/interventions", label: "Interventions", icon: Activity },
  { href: "/dashboard/geography", label: "Geographic View", icon: Map },
  { href: "/dashboard/sectors", label: "Sectors", icon: Building2 },
  { href: "/dashboard/executive", label: "Executive Brief", icon: FileText },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/audit", label: "Audit Log", icon: Shield },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Get current page title
  const currentPage = navItems.find((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  });

  const handleLogout = async () => {
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-[#1e40af] text-white transition-all duration-200 fixed left-0 top-0 bottom-0 z-30 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo area */}
        <div className={`flex items-center border-b border-blue-500/30 px-4 h-16 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M12 2L2 7v10l10 5 10-5V7zm0 2.18l6.5 3.25v6.5L12 17.18l-6.5-3.25v-6.5z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">NSDCH</p>
                <p className="text-[10px] text-blue-200 truncate">CoGTA</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7zm0 2.18l6.5 3.25v6.5L12 17.18l-6.5-3.25v-6.5z"/>
              </svg>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="text-blue-200 hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="absolute -right-3 top-5 bg-[#1e40af] border border-blue-400/30 rounded-full p-0.5 text-blue-200 hover:text-white"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-medium shadow-sm"
                    : "text-blue-100 hover:bg-white/5 hover:text-white"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {!sidebarCollapsed && (
          <div className="border-t border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-300/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-200" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">User</p>
                <p className="text-xs text-blue-300 truncate">hub_analyst</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e40af] text-white transform transition-transform lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-blue-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7zm0 2.18l6.5 3.25v6.5L12 17.18l-6.5-3.25v-6.5z"/>
              </svg>
            </div>
            <span className="font-semibold text-sm">NSDCH - CoGTA</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="text-blue-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-medium"
                    : "text-blue-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 no-print">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Home className="w-4 h-4" />
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {currentPage?.label || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="bg-transparent border-none outline-none text-sm text-gray-600 ml-2 w-40"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">User</p>
                    <p className="text-xs text-gray-500">Hub Analyst</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3 text-center text-xs text-gray-400 no-print">
          <p>National Service Delivery Coordination Hub &copy; {new Date().getFullYear()} &mdash; Department of Cooperative Governance, Republic of South Africa</p>
        </footer>
      </div>
    </div>
  );
}
