import type { TFunction } from "i18next";
import type { AppNotification } from "@/services/notification-service";

/**
 * Prefer client-side i18n using `data.type` and payload from the API.
 * Stored title/body were translated on the server at send time and may not match the app locale.
 */
export function getLocalizedNotificationText(
  item: AppNotification,
  t: TFunction
): { title: string; body: string } {
  const d = (item.data ?? {}) as Record<string, unknown>;
  const kind = typeof d.type === "string" ? d.type : "";

  if (kind === "project_status") {
    const status = typeof d.status === "string" ? d.status : "";
    const audience = typeof d.audience === "string" ? d.audience : undefined;
    const titleForProject =
      typeof d.project_title === "string" && d.project_title.trim()
        ? d.project_title.trim()
        : "—";
    const reason =
      d.rejection_reason != null && String(d.rejection_reason).trim()
        ? String(d.rejection_reason).trim()
        : "";

    if (status === "approved") {
      if (audience === "investor") {
        return {
          title: t("notif_project_live_title"),
          body: t("notif_project_live_body_investor", {
            title: titleForProject,
          }),
        };
      }
      // project_owner, missing audience (legacy), or unknown → owner copy
      return {
        title: t("notif_project_approved_title"),
        body: t("notif_project_approved_body_owner", {
          title: titleForProject,
        }),
      };
    }

    if (status === "rejected") {
      if (audience === "investor") {
        return {
          title: t("notif_project_rejected_title_investor"),
          body: t("notif_project_rejected_body_investor", {
            title: titleForProject,
          }),
        };
      }
      if (reason) {
        return {
          title: t("notif_project_rejected_title"),
          body: t("notif_project_rejected_body_owner_reason", {
            title: titleForProject,
            reason,
          }),
        };
      }
      return {
        title: t("notif_project_rejected_title"),
        body: t("notif_project_rejected_body_owner", {
          title: titleForProject,
        }),
      };
    }
  }

  if (kind === "interest_received") {
    const project =
      typeof d.project_title === "string" && d.project_title.trim()
        ? d.project_title.trim()
        : "—";
    return {
      title: t("notif_interest_received_title"),
      body: t("notif_interest_received_body", { project }),
    };
  }

  if (kind === "interest_response") {
    const project =
      typeof d.project_title === "string" && d.project_title.trim()
        ? d.project_title.trim()
        : "—";
    return {
      title: t("notif_interest_response_title"),
      body: t("notif_interest_response_body", { project }),
    };
  }

  if (kind === "meeting_reminder") {
    const meetingTitle =
      typeof d.meeting_title === "string" && d.meeting_title.trim()
        ? d.meeting_title.trim()
        : "—";
    return {
      title: t("notif_meeting_reminder_title"),
      body: t("notif_meeting_reminder_body", { title: meetingTitle }),
    };
  }

  if (kind === "admin_broadcast") {
    return { title: item.title, body: item.body };
  }

  return { title: item.title, body: item.body };
}
