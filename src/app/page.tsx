import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminRootPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/staff/overview");
  } else {
    redirect("/login");
  }
}
