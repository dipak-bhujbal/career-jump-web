import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Lock, LogOut, Save, ChevronDown, Trash2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/features/profile/useProfile";
import { useResetData } from "@/features/run/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({ component: ProfileRoute });

function Section({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
  danger = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-xl border bg-[hsl(var(--card))] overflow-hidden", danger ? "border-rose-500/30" : "border-[hsl(var(--border))]")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[hsl(var(--accent))]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={cn("flex items-center justify-center h-8 w-8 rounded-lg", danger ? "bg-rose-500/10 text-rose-500" : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]")}>
            {icon}
          </span>
          <div>
            <div className={cn("font-semibold text-sm", danger && "text-rose-500")}>{title}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{description}</div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn("text-[hsl(var(--muted-foreground))] transition-transform duration-200 shrink-0", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[hsl(var(--border))] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function ProfileRoute() {
  const { profile, updateProfile } = useProfile();
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [deleteAckd, setDeleteAckd] = useState(false);
  const resetData = useResetData();

  const profileDirty = username !== profile.username || email !== profile.email;

  function saveProfile() {
    if (!username.trim()) { toast("Username is required", "error"); return; }
    updateProfile({ username: username.trim(), email: email.trim() });
    toast("Profile updated");
  }

  function changePassword() {
    if (!currentPwd) { toast("Current password is required", "error"); return; }
    if (!newPwd) { toast("New password is required", "error"); return; }
    if (newPwd !== confirmPwd) { toast("Passwords do not match", "error"); return; }
    if (newPwd.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    toast("Password change will be applied when backend auth is connected");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  }

  function handleDeleteAccount() {
    if (!deleteAgreed || !deleteAckd) return;
    resetData.mutate(undefined, {
      onSuccess: () => {
        // Clear all local storage — profile, preferences, density, etc.
        localStorage.clear();
        toast("Account and all data deleted", "info");
        setTimeout(() => window.location.reload(), 1200);
      },
      onError: (e) => toast(e instanceof Error ? e.message : "Delete failed", "error"),
    });
  }

  const initial = (profile.username[0] ?? "U").toUpperCase();
  const canDelete = deleteAgreed && deleteAckd && !resetData.isPending;

  return (
    <>
      <Topbar title="Profile" subtitle="Manage your account and preferences" />
      <div className="p-6 max-w-xl space-y-3">

        {/* Avatar hero */}
        <div className="flex items-center gap-4 px-1 pb-2">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-white text-2xl font-bold shrink-0 shadow-lg">
            {initial}
          </div>
          <div>
            <div className="font-semibold text-lg">{profile.username}</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">{profile.email || "No email set"}</div>
          </div>
        </div>

        <Section title="Account" description="Display name and email address" icon={<User size={15} />}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your display name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={11} /> Email address
              </label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Used for job alert notifications and webhook delivery.</p>
            </div>
            <Button onClick={saveProfile} disabled={!profileDirty} size="sm" className="gap-2">
              <Save size={13} /> Save changes
            </Button>
          </div>
        </Section>

        <Section title="Change password" description="Update your login credentials" icon={<Lock size={15} />}>
          <div className="space-y-3">
            <div className="rounded-lg bg-[hsl(var(--secondary))]/60 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              Backend auth integration pending — changes will be saved when the backend is connected.
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Current password</label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">New password</label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Confirm new password</label>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
            </div>
            <Button onClick={changePassword} variant="outline" size="sm" className="gap-2">
              <Lock size={13} /> Update password
            </Button>
          </div>
        </Section>

        <Section title="Sign out" description="End your current session" icon={<LogOut size={15} />} danger>
          <div className="space-y-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              You'll need to sign back in to access Career Jump.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!window.confirm("Sign out of Career Jump?")) return;
                localStorage.removeItem("career-jump:profile");
                window.location.reload();
              }}
              className="gap-2"
            >
              <LogOut size={13} /> Sign out
            </Button>
          </div>
        </Section>

        {/* Delete Account — most destructive action, behind two mandatory checkboxes */}
        <Section title="Delete account" description="Permanently delete all your data — this cannot be undone" icon={<Trash2 size={15} />} danger>
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 space-y-1">
              <p className="font-semibold">⚠ Warning — this action is permanent</p>
              <p>Deleting your account will erase all of the following immediately:</p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-0.5 text-rose-300">
                <li>All tracked available jobs and scan history</li>
                <li>All applied jobs, notes, and interview rounds</li>
                <li>Action plan and pipeline state</li>
                <li>Login credentials and profile information</li>
                <li>All saved settings and preferences</li>
              </ul>
              <p className="text-xs mt-1">Company configuration and filters are retained.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={deleteAgreed}
                onChange={(e) => setDeleteAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-rose-500 cursor-pointer"
              />
              <span className="text-sm text-[hsl(var(--foreground))]">
                I agree to the terms and conditions and understand that Career Jump will permanently delete my account and all associated data.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={deleteAckd}
                onChange={(e) => setDeleteAckd(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-rose-500 cursor-pointer"
              />
              <span className="text-sm text-[hsl(var(--foreground))]">
                I acknowledge that deleted data <strong>cannot be recovered</strong> after deletion.
              </span>
            </label>

            <Button
              variant="destructive"
              size="sm"
              disabled={!canDelete}
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              <Trash2 size={13} />
              {resetData.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </Section>

      </div>
    </>
  );
}
