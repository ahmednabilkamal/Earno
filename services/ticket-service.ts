import apiClient from "@/utils/api";

export interface TicketReply {
  id: number;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
  user?: { id: number; name: string };
}

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  created_at: string;
  replies?: TicketReply[];
  replies_count?: number;
}

export interface TicketsPaginatedResponse {
  data: Ticket[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
  links?: unknown;
}

export const ticketService = {
  async getTickets(): Promise<TicketsPaginatedResponse> {
    const { data } = await apiClient.get<TicketsPaginatedResponse>("/tickets");
    return data;
  },

  async createTicket(
    subject: string,
    category: "technical" | "billing" | "general",
    message: string
  ): Promise<Ticket> {
    const { data } = await apiClient.post<{ data: Ticket }>("/tickets", {
      subject,
      category,
      message,
    });
    return (data as { data?: Ticket }).data ?? (data as unknown as Ticket);
  },

  async getTicket(id: number): Promise<Ticket> {
    const { data } = await apiClient.get<{ data: Ticket }>(`/tickets/${id}`);
    return (data as { data?: Ticket }).data ?? (data as unknown as Ticket);
  },

  async replyTicket(id: number, message: string): Promise<Ticket> {
    const { data } = await apiClient.post<{ data: Ticket }>(`/tickets/${id}/reply`, { message });
    return (data as { data?: Ticket }).data ?? (data as unknown as Ticket);
  },
};
