import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, CheckSquare, Target, Settings, Sparkles, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarActions } from "./sidebar-actions";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Available Jobs", icon: Briefcase },
  { to: "/applied", label: "Applied Jobs", icon: CheckSquare },
  { to: "/plan", label: "Action Plan", icon: Target },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/configuration", label: "Configuration", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-60 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 backdrop-blur flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[hsl(var(--border))]">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-white shadow-sm">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="font-semibold text-sm">Career Jump</div>
          <div className="text-[12.5px] text-[hsl(var(--muted-foreground))]">Private job radar</div>
        </div>
      </div>
      <nav className="p-2 flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]/60 hover:text-[hsl(var(--foreground))]",
              )}
            >
              <Icon size={16} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <SidebarActions />
      <div className="p-3 text-[12.5px] text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))]">
        v5.0.0-alpha · React rebuild
      </div>
    </aside>
  );
}
