import * as React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Wrench, Home, MapPin, HardHat, FileText, ArrowRightLeft,
  Users, Settings, Menu, LogOut, Loader2, Factory, Package, Sun, Moon
} from 'lucide-react';
import { useAuth } from "@/lib/auth";
import { getTheme, toggleTheme } from "@/lib/theme";
import { useDashboard } from "@/lib/queries";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button"; // Assuming Button component is available

function NavBadge({ value, variant = 'default' }) {
  if (!value || value <= 0) return null;
  const colors = {
    default: 'bg-slate-200 text-slate-700',
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-600 text-white',
  };
  return (
    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors[variant]}`}>
      {value > 99 ? '99+' : value}
    </span>
  );
}

function SidebarNav({ dashboardData, closeMenu }) {
  const { hasRole } = useAuth();

  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', to: '/', icon: Home },
      ]
    },
    {
      group: 'INVENTORY',
      items: [
        {
          name: 'Tools', to: '/inventory', icon: Wrench,
          badge: dashboardData?.lowStockCount, badgeVariant: 'default'
        },
        { name: 'Locations', to: '/locations', icon: MapPin },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Workers', to: '/workers', icon: HardHat },
        {
          name: 'Lending', to: '/lending', icon: ArrowRightLeft,
          badge: dashboardData?.overdueLendingCount, badgeVariant: 'red'
        },
        { name: 'Transfers', to: '/transfers', icon: Package },
      ]
    },
    {
      group: 'PROCUREMENT',
      roles: ['Manager', 'Admin'],
      items: [
        { name: 'Suppliers', to: '/procurement/suppliers', icon: Factory },
        { name: 'Purchases', to: '/procurement/purchases', icon: Package },
      ]
    },
    {
      group: 'INSIGHTS',
      items: [
        { name: 'Reports', to: '/reports', icon: FileText },
      ]
    },
    {
      group: 'ADMIN',
      roles: ['Admin'],
      items: [
        { name: 'Users', to: '/settings/users', icon: Users },
        { name: 'System', to: '/settings/system', icon: Settings },
      ]
    }
  ];

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
      {navSections.map((section, idx) => {
        // Only render if user has one of the required roles
        if (section.roles && !section.roles.some(r => hasRole(r))) return null;

        return (
          <div key={idx}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section.group}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  <NavBadge value={item.badge} variant={item.badgeVariant} />
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function UserCard({ user, logout }) {
  if (!user) return null;
  const initals = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  const roleColors = {
    Admin: 'bg-purple-500',
    Manager: 'bg-blue-500',
    User: 'bg-slate-500'
  };

  return (
    <div className="p-4 border-t border-border dark:border-slate-800 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${roleColors[user.role] || roleColors.User}`}>
        {initals}
      </div>
      <div className="flex-1 overflow-hidden pointer-events-none">
        <p className="text-sm font-medium text-foreground dark:text-white truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">{user.role}</p>
      </div>
      <button
        onClick={logout}
        className="text-slate-400 hover:text-foreground dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setThemeState] = React.useState(getTheme());

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setThemeState(next);
  };

  const { data: dashboardData } = useDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Derive title from pathname (e.g. "/settings/users" -> "Users")
  let pageTitle = 'Dashboard';
  const pathSegments = location.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const last = pathSegments[pathSegments.length - 1];
    if (!isNaN(last) && last.length > 0) {
      const parent = pathSegments[pathSegments.length - 2];
      pageTitle = parent ? parent.charAt(0).toUpperCase() + parent.slice(1) + ' Detail' : 'Detail';
    } else {
      pageTitle = last.charAt(0).toUpperCase() + last.slice(1);
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border dark:border-slate-800">
        <img src="/Favicon.png" alt="Logo" className="w-8 h-8 object-contain rounded" />
        <span className="text-sm font-bold text-foreground dark:text-white tracking-tight leading-snug">
          Jassem Alblooshi<br/>Technical Services L.L.C
        </span>
      </div>
      <SidebarNav dashboardData={dashboardData} closeMenu={() => setMobileMenuOpen(false)} />
      <UserCard user={user} logout={logout} />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted text-foreground dark:bg-slate-950 dark:text-slate-100 font-sans flex text-base">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] fixed inset-y-0 left-0 bg-background dark:bg-slate-900 border-r border-border shadow-xl transition-colors duration-200 z-50">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-background dark:bg-slate-900 border-b border-border dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-100 text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-slate-900 border-r-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-semibold text-foreground dark:text-slate-100 capitalize">{pageTitle.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleToggleTheme} className="text-muted-foreground hover:text-foreground dark:hover:text-white w-10 h-10 rounded-full">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {/* Future: Theme toggle, Notifications */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <React.Suspense fallback={<div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
