import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsEditor } from "@/components/admin/settings-editor";

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULTS = [
  { key: "siteName", value: "EduManager" },
  { key: "academicYear", value: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}` },
  { key: "maxUploadMb", value: "10" },
  { key: "allowLateDefault", value: "false" },
  { key: "notificationInApp", value: "true" },
  { key: "notificationEmail", value: "false" },
];

export default async function AdminSettings() {
  await requireRole("ADMIN");
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const settings = DEFAULTS.map((d) => ({
    key: d.key,
    value: map.get(d.key) ?? d.value,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Application-level configuration."
      />
      <Card>
        <CardContent>
          <SettingsEditor settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
