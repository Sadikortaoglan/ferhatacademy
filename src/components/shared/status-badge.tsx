import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";

const roleConfig: Record<
  Role,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "success"
      | "warning"
      | "danger"
      | "outline";
  }
> = {
  USER: { label: "Kullanıcı", variant: "secondary" },
  ADMIN: { label: "Admin", variant: "default" },
  SUPER_ADMIN: { label: "Süper Admin", variant: "warning" },
};

export function RoleBadge({ role }: { role: Role }) {
  const config = roleConfig[role];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
