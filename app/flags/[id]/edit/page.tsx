import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/server";
import { RESOURCE, getFlag } from "@/lib/feature-flags/service";
import { FlagForm } from "@/app/flags/flag-form";

export default async function EditFlagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(RESOURCE, "update");
  const flag = await getFlag((await params).id);
  if (!flag) notFound();

  return (
    <>
      <h1>Edit {flag.name}</h1>
      <FlagForm
        flagId={flag.id}
        initial={{
          name: flag.name,
          description: flag.description,
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          environment: flag.environment,
        }}
      />
    </>
  );
}
