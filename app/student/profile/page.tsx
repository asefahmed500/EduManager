import { requireRole } from "@/lib/dal";
import { ProfileView } from "@/components/profile/profile-view";

export default async function StudentProfilePage() {
  await requireRole("STUDENT");
  return <ProfileView />;
}
