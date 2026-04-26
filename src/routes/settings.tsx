import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmailWebhookSettings, useSaveEmailWebhook } from "@/features/settings/queries";
import { toast } from "@/components/ui/toast";

export const Route = createFileRoute("/settings")({ component: SettingsRoute });

function SettingsRoute() {
  const { data } = useEmailWebhookSettings();
  const save = useSaveEmailWebhook();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");

  useEffect(() => {
    if (data?.webhookUrl != null) setWebhookUrl(data.webhookUrl);
  }, [data?.webhookUrl]);

  function handleSave() {
    const payload: { webhookUrl?: string; sharedSecret?: string } = {
      webhookUrl: webhookUrl.trim() || undefined,
    };
    if (sharedSecret.trim()) payload.sharedSecret = sharedSecret.trim();
    save.mutate(payload, {
      onSuccess: () => {
        toast("Settings saved");
        setSharedSecret("");
      },
      onError: (err) => toast(err instanceof Error ? err.message : "Save failed", "error"),
    });
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Webhook URL</label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shared Secret</label>
              <Input
                type="password"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
                placeholder="leave blank to keep existing"
              />
              {data?.sharedSecretConfigured && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">A shared secret is configured</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            <p>Career Jump v5.0.0-alpha · React rebuild</p>
            <p>Backend: AWS Lambda + DynamoDB</p>
            <p>Logs retained for 6 hours</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
