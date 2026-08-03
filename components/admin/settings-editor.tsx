"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { updateSetting } from "@/app/actions/admin";

type Setting = { key: string; value: string };

export function SettingsEditor({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value])),
  );
  const [saving, setSaving] = React.useState<string | null>(null);

  async function save(key: string) {
    setSaving(key);
    const r = await updateSetting(key, values[key] ?? "");
    setSaving(null);
    if (r?.error) notify.error(r.error);
    else {
      notify.success("Setting updated.");
      router.refresh();
    }
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {settings.map((s) => (
        <li key={s.key} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
          <div className="sm:w-64">
            <p className="text-sm font-medium">{s.key}</p>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Input
              className="h-9"
              value={values[s.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [s.key]: e.target.value }))
              }
            />
            <Button
              variant="outline"
              className="h-9"
              onClick={() => save(s.key)}
              disabled={saving === s.key}
            >
              {saving === s.key ? "Saving…" : "Save"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
