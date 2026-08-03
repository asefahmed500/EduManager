import { requireRole } from "@/lib/dal";
import { ProfileView } from "@/components/profile/profile-view";

export default async function TeacherProfilePage() {
  await requireRole("TEACHER");
  return <ProfileView />;
}
