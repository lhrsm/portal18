import { createClient } from '@/lib/supabase/client';
import { 
  SupportCategory, 
  SupportTicket, 
  SupportTicketMessage, 
  CommunicationPriority, 
  SupportTicketStatus 
} from '@/types/app.types';
import { communicationService } from '../communication/communicationService';

export const supportService = {
  /**
   * Creates a new support ticket (Section 52).
   */
  async createTicket(
    profileId: string,
    params: {
      category: SupportCategory;
      subject: string;
      description: string;
      attachments?: { name: string; url: string; size: number; mime: string }[];
    }
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const supabase = createClient();

      // Backend calculates priority (Section 54)
      const priority: CommunicationPriority = 
        params.category === 'security' ? 'critical' :
        params.category === 'privacy' || params.category === 'report' ? 'high' : 'normal';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ticket, error: ticketError } = await (supabase.from('support_tickets') as any)
        .insert({
          profile_id: profileId,
          category: params.category,
          subject: params.subject,
          description: params.description,
          priority,
          status: 'open',
        })
        .select('id')
        .single();

      if (ticketError || !ticket) {
        console.error('Error creating support ticket:', ticketError);
        return { success: false, error: ticketError?.message };
      }

      // Add initial message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('support_ticket_messages') as any).insert({
        ticket_id: ticket.id,
        author_profile_id: profileId,
        author_type: 'user',
        message: params.description,
        attachments: params.attachments || [],
      });

      // Dispatch confirmation communication (Section 14 & 59)
      await communicationService.sendTransactional(
        profileId,
        'support_ticket_created',
        { ticket_id: ticket.id.substring(0, 8).toUpperCase(), subject: params.subject },
        'in_app'
      );

      return { success: true, ticketId: ticket.id };
    } catch (err: any) {
      console.error('Exception creating ticket:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Lists tickets belonging to current user.
   */
  async getUserTickets(profileId: string): Promise<SupportTicket[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('support_tickets') as any)
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }

    return (data || []) as SupportTicket[];
  },

  /**
   * Fetches ticket by ID.
   */
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('support_tickets') as any)
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (error || !data) return null;
    return data as SupportTicket;
  },

  /**
   * Fetches messages in ticket.
   */
  async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('support_ticket_messages') as any)
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }

    return (data || []) as SupportTicketMessage[];
  },

  /**
   * Adds a reply to a ticket.
   */
  async addMessage(
    ticketId: string,
    authorProfileId: string,
    authorType: 'user' | 'staff',
    message: string,
    attachments: { name: string; url: string; size: number; mime: string }[] = []
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: msgError } = await (supabase.from('support_ticket_messages') as any).insert({
        ticket_id: ticketId,
        author_profile_id: authorProfileId,
        author_type: authorType,
        message,
        attachments,
      });

      if (msgError) {
        return { success: false, error: msgError.message };
      }

      // Update ticket status & timestamp
      const nextStatus: SupportTicketStatus = authorType === 'staff' ? 'waiting_user' : 'in_progress';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('support_tickets') as any)
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Admin queue listing (Section 60).
   */
  async getAdminTickets(filters?: { status?: string; category?: string }): Promise<SupportTicket[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('support_tickets') as any).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching admin tickets:', error);
      return [];
    }
    return (data || []) as SupportTicket[];
  },

  /**
   * Updates status of a ticket (resolve, close, in_progress).
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicketStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({
        status,
        updated_at: new Date().toISOString(),
        resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', ticketId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};
