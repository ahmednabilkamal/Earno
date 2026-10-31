import type { Router } from "expo-router";

/** Pop the stack, or land on home when opened via deep link with no history. */
export function goBackOrHome(router: Pick<Router, "back" | "replace" | "canGoBack">): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/home");
}
