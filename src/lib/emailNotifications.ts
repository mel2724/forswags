import { supabase } from "@/integrations/supabase/client";

export type EmailTemplate = 
  | "badge_earned"
  | "college_match_ready"
  | "eval_complete"
  | "eval_started"
  | "membership_renewal"
  | "payment_receipt"
  | "profile_nudge"
  | "profile_viewed"
  | "quiz_passed"
  | "ranking_updated";

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  variables: Record<string, string>;
  subject?: string;
}

export async function sendNotificationEmail(params: SendEmailParams) {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: params,
    });

    if (error) throw error;

    console.log("Email notification sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return { success: false, error };
  }
}

// Helper functions for common notifications

export async function sendBadgeEarnedEmail(
  userEmail: string,
  firstName: string,
  badgeName: string,
  dashboardUrl: string,
  profileUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "badge_earned",
    variables: {
      first_name: firstName,
      badge_name: badgeName,
      dashboard_url: dashboardUrl,
      profile_url: profileUrl,
    },
  });
}

export async function sendCollegeMatchReadyEmail(
  userEmail: string,
  matchCount: string,
  collegeMatchUrl: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "college_match_ready",
    variables: {
      match_count: matchCount,
      college_match_url: collegeMatchUrl,
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendEvalCompleteEmail(
  userEmail: string,
  evaluationUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "eval_complete",
    variables: {
      evaluation_url: evaluationUrl,
    },
  });
}

export async function sendEvalStartedEmail(
  userEmail: string,
  evaluatorName: string,
  evaluationId: string,
  evaluationUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "eval_started",
    variables: {
      evaluator_name: evaluatorName,
      evaluation_id: evaluationId,
      evaluation_url: evaluationUrl,
    },
  });
}

export async function sendMembershipRenewalEmail(
  userEmail: string,
  renewalDate: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "membership_renewal",
    variables: {
      renewal_date: renewalDate,
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendPaymentReceiptEmail(
  userEmail: string,
  amount: string,
  invoiceUrl: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "payment_receipt",
    variables: {
      amount: amount,
      invoice_url: invoiceUrl,
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendProfileNudgeEmail(
  userEmail: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "profile_nudge",
    variables: {
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendProfileViewedEmail(
  userEmail: string,
  firstName: string,
  profileUrl: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "profile_viewed",
    variables: {
      first_name: firstName,
      profile_url: profileUrl,
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendQuizPassedEmail(
  userEmail: string,
  scorePct: string,
  quizTitle: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "quiz_passed",
    variables: {
      score_pct: scorePct,
      quiz_title: quizTitle,
      dashboard_url: dashboardUrl,
    },
  });
}

export async function sendRankingUpdatedEmail(
  userEmail: string,
  rankBucket: string,
  scoreTotal: string,
  changeDirection: string,
  deltaPoints: string,
  dashboardUrl: string
) {
  return sendNotificationEmail({
    to: userEmail,
    template: "ranking_updated",
    variables: {
      rank_bucket: rankBucket,
      score_total: scoreTotal,
      change_direction: changeDirection,
      delta_points: deltaPoints,
      dashboard_url: dashboardUrl,
    },
  });
}
