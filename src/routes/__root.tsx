/**
 * Root route — wraps every page with the app shell.
 *
 * Mounts global UI:
 *   - Sidebar (nav + scan/cache action buttons)
 *   - ToastViewport (Sonner)
 *   - CommandPalette (⌘K)
 *   - KeyboardHelp (?)
 *
 * Also registers global navigation hotkeys (g→d / g→j / g→a / g→p / g→c).
 */
import { Outlet, createRootRoute, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastViewport } from "@/components/ui/toast";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardHelp } from "@/components/keyboard-help";
import { MeteorBackground } from "@/components/meteor-background";
import { RunProgress } from "@/components/run-progress";
import { useHotkey } from "@/lib/hotkeys";

function RootLayout() {
  const navigate = useNavigate();
  useHotkey({ id: "go-dashboard", description: "Go to Dashboard", category: "Navigate", sequence: ["g", "d"] }, () => navigate({ to: "/" }));
  useHotkey({ id: "go-jobs", description: "Go to Available Jobs", category: "Navigate", sequence: ["g", "j"] }, () => navigate({ to: "/jobs" }));
  useHotkey({ id: "go-applied", description: "Go to Applied Jobs", category: "Navigate", sequence: ["g", "a"] }, () => navigate({ to: "/applied" }));
  useHotkey({ id: "go-plan", description: "Go to Action Plan", category: "Navigate", sequence: ["g", "p"] }, () => navigate({ to: "/plan" }));
  useHotkey({ id: "go-config", description: "Go to Configuration", category: "Navigate", sequence: ["g", "c"] }, () => navigate({ to: "/configuration" }));

  return (
    <div className="h-screen overflow-hidden flex relative">
      <MeteorBackground />
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <RunProgress />
        {/* Inner scroll wrapper: topbar sticky top-0 works correctly inside a block overflow-y-auto container */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
      <ToastViewport />
      <CommandPalette />
      <KeyboardHelp />
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout });
