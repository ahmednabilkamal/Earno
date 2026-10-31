import { Redirect } from "expo-router";
import React from "react";

// Deep-link bridge: /p/{id}/{slug} → /home (single atomic redirect).
// The actual push to project-details is handled by _layout.tsx's deep-link
// queue once the user lands on home. This guarantees the stack is
// [home, project-details] and back from project-details goes to home —
// never back into this bridge route (which would cause a navigation loop).
export default function ProjectDeepLinkRedirectWithSlug() {
  return <Redirect href="/home" />;
}
