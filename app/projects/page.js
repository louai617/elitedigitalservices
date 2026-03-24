import { redirect } from "next/navigation";

export default function ProjectsPage() {
  // Redirect to the projects section on the home page
  redirect("/#projects");
}
