import { Redirect } from "expo-router";

/**
 * Create project page – redirects to the add-project form.
 * Use this route for "Create Project" entry points (e.g. /create-project).
 */
export default function CreateProjectScreen() {
  return <Redirect href="/add-project" />;
}
