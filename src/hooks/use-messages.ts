import { useCallback, useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Message, Conversation, ConversationRating } from "@/types/message";

const READ_STATE_KEY = "conversationReadState";

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    demandeId: row.demande_id,
    participants: row.participants as [string, string],
    closedBy: row.closed_by || [],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function mapMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    type: row.type as "user" | "system",
    createdAt: Number(row.created_at),
  };
}

function readReadState(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(READ_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeReadState(state: Record<string, Record<string, number>>): void {
  localStorage.setItem(READ_STATE_KEY, JSON.stringify(state));
}

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchData = useCallback(async () => {
    const [convRes, msgRes] = await Promise.all([
      supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
    ]);
    if (convRes.data) setConversations(convRes.data.map(mapConversation));
    if (msgRes.data) setMessages(msgRes.data.map(mapMessage));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getConversations = useCallback((profileId: string): Conversation[] => {
    return conversations
      .filter((c) => c.participants.includes(profileId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  const getConversationById = useCallback((id: string): Conversation | undefined => {
    return conversations.find((c) => c.id === id);
  }, [conversations]);

  const getConversationByDemandeId = useCallback((demandeId: string): Conversation | undefined => {
    return conversations.find((c) => c.demandeId === demandeId);
  }, [conversations]);

  const createConversation = useCallback(async (demandeId: string, participants: [string, string]): Promise<Conversation> => {
    // Check existing
    const existing = conversations.find((c) => c.demandeId === demandeId);
    if (existing) return existing;

    const now = Date.now();
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        demande_id: demandeId,
        participants,
        closed_by: [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    const conv = mapConversation(data);
    setConversations((prev) => [conv, ...prev]);
    return conv;
  }, [conversations]);

  const getMessages = useCallback((conversationId: string): Message[] => {
    return messages.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt - b.createdAt);
  }, [messages]);

  const getLastMessage = useCallback((conversationId: string): Message | undefined => {
    const msgs = getMessages(conversationId);
    return msgs[msgs.length - 1];
  }, [getMessages]);

  const sendMessage = useCallback(async (conversationId: string, senderId: string, content: string): Promise<Message> => {
    const now = Date.now();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, content, type: "user", created_at: now })
      .select()
      .single();
    if (error) throw error;
    const msg = mapMessage(data);
    setMessages((prev) => [...prev, msg]);

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: now }).eq("id", conversationId);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, updatedAt: now } : c)));

    return msg;
  }, []);

  const addSystemMessage = useCallback(async (conversationId: string, content: string): Promise<Message> => {
    const now = Date.now();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: "system", content, type: "system", created_at: now })
      .select()
      .single();
    if (error) throw error;
    const msg = mapMessage(data);
    setMessages((prev) => [...prev, msg]);

    await supabase.from("conversations").update({ updated_at: now }).eq("id", conversationId);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, updatedAt: now } : c)));

    return msg;
  }, []);

  const closeConversation = useCallback(async (conversationId: string, profileId: string): Promise<void> => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv || conv.closedBy.includes(profileId)) return;

    const newClosedBy = [...conv.closedBy, profileId];
    await supabase.from("conversations").update({ closed_by: newClosedBy, updated_at: Date.now() }).eq("id", conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, closedBy: newClosedBy, updatedAt: Date.now() } : c))
    );
  }, [conversations]);

  const isConversationClosedByUser = useCallback((conversation: Conversation, profileId: string): boolean => {
    return conversation.closedBy.includes(profileId);
  }, []);

  const isConversationFullyClosed = useCallback((conversation: Conversation): boolean => {
    return conversation.closedBy.length >= 2;
  }, []);

  const saveRating = useCallback(async (rating: ConversationRating): Promise<void> => {
    await supabase.from("conversation_ratings").upsert(
      {
        conversation_id: rating.conversationId,
        rater_id: rating.raterId,
        rated_profile_id: rating.ratedProfileId,
        score: rating.score,
        was_useful: rating.wasUseful,
        comment: rating.comment,
      },
      { onConflict: "conversation_id,rater_id" }
    );
  }, []);

  const getRating = useCallback(async (conversationId: string, raterId: string): Promise<ConversationRating | undefined> => {
    const { data } = await supabase
      .from("conversation_ratings")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("rater_id", raterId)
      .maybeSingle();
    if (!data) return undefined;
    return {
      conversationId: data.conversation_id,
      raterId: data.rater_id,
      ratedProfileId: data.rated_profile_id,
      score: data.score,
      wasUseful: data.was_useful,
      comment: data.comment,
    };
  }, []);

  const getRatingsForProfile = useCallback(async (profileId: string): Promise<ConversationRating[]> => {
    const { data } = await supabase.from("conversation_ratings").select("*").eq("rated_profile_id", profileId);
    if (!data) return [];
    return data.map((r: any) => ({
      conversationId: r.conversation_id,
      raterId: r.rater_id,
      ratedProfileId: r.rated_profile_id,
      score: r.score,
      wasUseful: r.was_useful,
      comment: r.comment,
    }));
  }, []);

  const getAverageRating = useCallback(async (profileId: string): Promise<{ average: number; count: number }> => {
    const ratings = await getRatingsForProfile(profileId);
    if (ratings.length === 0) return { average: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return { average: sum / ratings.length, count: ratings.length };
  }, [getRatingsForProfile]);

  const markConversationAsRead = useCallback((conversationId: string, profileId: string): void => {
    const state = readReadState();
    if (!state[conversationId]) state[conversationId] = {};
    state[conversationId][profileId] = Date.now();
    writeReadState(state);
  }, []);

  const hasUnreadMessages = useCallback((conversationId: string, profileId: string): boolean => {
    const state = readReadState();
    const lastRead = state[conversationId]?.[profileId] || 0;
    return messages.some((m) => m.conversationId === conversationId && m.senderId !== profileId && m.senderId !== "system" && m.createdAt > lastRead);
  }, [messages]);

  const getTotalUnreadCount = useCallback((profileId: string): number => {
    const userConvs = conversations.filter((c) => c.participants.includes(profileId));
    return userConvs.filter((c) => hasUnreadMessages(c.id, profileId)).length;
  }, [conversations, hasUnreadMessages]);

  const resetMessages = useCallback(async (): Promise<void> => {
    setConversations([]);
    setMessages([]);
  }, []);

  return useMemo(() => ({
    getConversations,
    getConversationById,
    getConversationByDemandeId,
    createConversation,
    getMessages,
    getLastMessage,
    sendMessage,
    addSystemMessage,
    closeConversation,
    isConversationClosedByUser,
    isConversationFullyClosed,
    saveRating,
    getRating,
    getRatingsForProfile,
    getAverageRating,
    markConversationAsRead,
    hasUnreadMessages,
    getTotalUnreadCount,
    resetMessages,
  }), [
    getConversations, getConversationById, getConversationByDemandeId, createConversation,
    getMessages, getLastMessage, sendMessage, addSystemMessage, closeConversation,
    isConversationClosedByUser, isConversationFullyClosed, saveRating, getRating,
    getRatingsForProfile, getAverageRating, markConversationAsRead, hasUnreadMessages,
    getTotalUnreadCount, resetMessages,
  ]);
}

// Separate hook for unread count with reactivity (used in BottomTabs)
export function useUnreadMessagesCount(profileId: string | undefined) {
  const [count, setCount] = useState(0);
  const { getTotalUnreadCount } = useMessages();

  useEffect(() => {
    if (!profileId) {
      setCount(0);
      return;
    }
    setCount(getTotalUnreadCount(profileId));
  }, [profileId, getTotalUnreadCount]);

  return { count };
}
