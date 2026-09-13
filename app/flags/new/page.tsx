import { requirePermission } from "@/lib/rbac/server";
import { RESOURCE } from "@/lib/feature-flags/service";
import { FlagForm } from "@/app/flags/flag-form";

export default async function NewFlagPage() {
  await requirePermission(RESOURCE, "create");
  return (
    <>
      <h1>New feature flag</h1>
      <FlagForm
        initial={{
          name: "",
          description: "",
          enabled: false,
          rolloutPercentage: 0,
          environment: "development",
        }}
      />
    </>
  );
}
