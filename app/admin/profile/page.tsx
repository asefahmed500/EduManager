import { requireRole } from "@/lib/dal";
import { ProfileView } from "@/components/profile/profile-view";

export default async function AdminProfilePage() {
  await requireRole("ADMIN");
  return <ProfileView />;
}
