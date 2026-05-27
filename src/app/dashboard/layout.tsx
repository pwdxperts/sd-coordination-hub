"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Inbox, Briefcase, AlertTriangle, Activity, Map,
  Building2, FileText, BarChart3, Settings, Shield, ChevronLeft,
  ChevronRight, Bell, Search, LogOut, User, Menu, X, ChevronDown, Home,
  CheckSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/intake", label: "Intake Queue", icon: Inbox },
  { href: "/dashboard/cases", label: "Case Board", icon: Briefcase },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/dashboard/interventions", label: "Interventions", icon: Activity },
  { href: "/dashboard/geography", label: "Geographic View", icon: Map },
  { href: "/dashboard/sectors", label: "Sectors", icon: Building2 },
  { href: "/dashboard/executive", label: "Executive Brief", icon: FileText },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/audit", label: "Audit Log", icon: Shield },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const provincialNavHrefs = new Set([
  "/dashboard",
  "/dashboard/intake",
  "/dashboard/cases",
  "/dashboard/tasks",
  "/dashboard/escalations",
  "/dashboard/interventions",
  "/dashboard/geography",
  "/dashboard/reports",
  "/dashboard/settings",
]);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.count) setNotifCount(data.count);
      })
      .catch(() => {});
  }, []);

  const visibleNavItems = currentUser?.role === "provincial_coordinator"
    ? navItems.filter((item) => provincialNavHrefs.has(item.href))
    : navItems;

  const currentPage = visibleNavItems.find((item) =>
    item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
  ) || navItems.find((item) =>
    item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
  );

  const handleLogout = () => {
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 fixed left-0 top-0 bottom-0 z-30 ${
          sidebarCollapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        <div className={`flex items-center h-16 border-b border-gray-100 px-4 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <div className={`flex items-center ${sidebarCollapsed ? "" : "gap-2"}`}>
            <span className={`block ${sidebarCollapsed ? "h-10 w-10 overflow-hidden" : "h-12 w-[165px]"}`}>
              <img
                src="/logo.png"
                alt="CoGTA"
                className={`${sidebarCollapsed ? "h-10 w-auto max-w-none object-left" : "h-12 w-auto"} object-contain`}
              />
            </span>
          </div>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {visibleNavItems.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-gray-100 p-3 mt-auto">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">System</p>
            <div className="space-y-1">
              <Link href="/dashboard/settings" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </Link>
              <Link href="/dashboard/reports" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Reports
              </Link>
              <Link href="/dashboard/audit" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Audit Log
              </Link>
            </div>
          </div>
        )}
      </aside>

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex fixed left-[68px] top-[72px] z-30 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md text-gray-400 hover:text-gray-600 transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ─── MOBILE SIDEBAR ─── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 transform transition-transform lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <img src="/logo.png" alt="CoGTA" className="h-12 w-auto max-w-[170px] object-contain" />
          <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="overflow-y-auto py-3 px-2.5 space-y-0.5">
          {visibleNavItems.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"}`}>
        <header className="bg-white border-b border-gray-200/80 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-[13px]">
                <Home className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-semibold">{currentPage?.label || "Dashboard"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search cases..." className="bg-transparent border-none outline-none text-sm text-gray-600 ml-2 w-36" />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <Bell className="w-[18px] h-[18px]" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  {currentUser && <span className="text-sm text-gray-700 hidden md:block">{currentUser.name}</span>}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{currentUser?.name || "User"}</p>
                        <p className="text-xs text-gray-500">{currentUser?.role?.replace(/_/g, " ") || "Hub Analyst"}</p>
                      </div>
                      <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="bg-white border-t border-gray-100 px-4 lg:px-6 py-3 text-center text-[11px] text-gray-400 no-print">
          National Service Delivery Coordination Hub &copy; {new Date().getFullYear()} &mdash; Department of Cooperative Governance, Republic of South Africa
        </footer>
      </div>
    </div>
  );
}
