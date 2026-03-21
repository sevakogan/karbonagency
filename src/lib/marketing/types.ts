export interface Lead {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string | null;
  readonly company: string | null;
  readonly notes: string | null;
  readonly message: string | null;
  readonly project_interest: string | null;
  readonly source: string;
  readonly status: LeadStatus;
  readonly sms_consent: boolean;
  readonly email_consent: boolean;
  readonly assigned_campaigns: readonly string[];
  readonly assigned_pipelines: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

export type LeadStatus =
  | "incoming"
  | "followed_up"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost"
  | "unsubscribed";

export const LEAD_STATUS_CONFIG: readonly { readonly value: LeadStatus; readonly label: string; readonly color: string }[] = [
  { value: "incoming", label: "Incoming", color: "blue" },
  { value: "followed_up", label: "Followed Up", color: "yellow" },
  { value: "qualified", label: "Qualified", color: "purple" },
  { value: "proposal_sent", label: "Proposal Sent", color: "cyan" },
  { value: "negotiation", label: "Negotiation", color: "orange" },
  { value: "won", label: "Won", color: "green" },
  { value: "lost", label: "Lost", color: "red" },
  { value: "unsubscribed", label: "Unsubscribed", color: "gray" },
];

export interface LeadInput {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address?: string;
  readonly company?: string;
  readonly notes?: string;
  readonly message?: string;
  readonly projectInterest?: string;
  readonly smsConsent: boolean;
  readonly emailConsent: boolean;
  readonly source?: string;
}

export interface DripMessage {
  readonly delay_days: number;
  readonly subject?: string;
  readonly body: string;
}

export interface DripCampaign {
  readonly id: string;
  readonly name: string;
  readonly channel: "sms" | "email";
  readonly messages: readonly DripMessage[];
  readonly is_active: boolean;
  readonly created_at: string;
}

export type DripStateStatus = "active" | "completed" | "paused" | "unsubscribed";

export interface LeadDripState {
  readonly id: string;
  readonly lead_id: string;
  readonly campaign_id: string;
  readonly current_step: number;
  readonly next_send_at: string | null;
  readonly status: DripStateStatus;
  readonly last_sent_at: string | null;
  readonly created_at: string;
}

export interface SendResult {
  readonly sent: number;
  readonly errors: number;
}

export type MessageChannel = "sms" | "email";

export interface MessageLog {
  readonly id: string;
  readonly lead_id: string;
  readonly channel: MessageChannel;
  readonly to: string;
  readonly subject?: string;
  readonly body: string;
  readonly status: "sent" | "delivered" | "failed" | "bounced";
  readonly sent_at: string;
  readonly campaign_id?: string;
}
