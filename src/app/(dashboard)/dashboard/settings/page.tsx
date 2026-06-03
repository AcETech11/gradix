import { Settings2 } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      actionLabel="Update settings"
      description="School, branding, and subscription settings will connect here when the settings module arrives."
      emptyDescription="School settings have not been configured yet."
      emptyTitle="No settings yet"
      eyebrow="Settings"
      filterPlaceholder="Search settings"
      icon={Settings2}
      tableDescription="Account, branding, and school preferences will be organized here later."
      tableTitle="School settings"
      title="Settings is the control surface for later phases."
    />
  );
}
