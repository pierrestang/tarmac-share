import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessages } from "@/hooks/use-messages";
import { useProfiles } from "@/hooks/use-profiles";
import { useNotifications } from "@/hooks/use-notifications";
import { useDemandes } from "@/hooks/use-demandes";

import ConversationList from "@/components/ConversationList";
import ChatView from "@/components/ChatView";
import { NotificationList } from "@/components/NotificationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Conversation } from "@/types/message";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { 
    getConversations, 
    getMessages, 
    getLastMessage,
    sendMessage, 
    isConversationClosedByUser,
    getConversationById,
    markConversationAsRead,
    hasUnreadMessages,
    isConversationFullyClosed,
    closeConversation,
    addSystemMessage,
    saveRating,
  } = useMessages();
  
  const { getActiveProfile, getProfileById } = useProfiles();
  const { notifications, createNotification } = useNotifications();
  const { completeDemande, saveDemandeSnapshot } = useDemandes();

  const activeProfile = getActiveProfile();
  const profileId = activeProfile?.id;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  // Refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const conversations = profileId ? getConversations(profileId) : [];

  // Get unread counts for tabs
  const unreadMessagesCount = profileId 
    ? conversations.filter(c => hasUnreadMessages(c.id, profileId)).length 
    : 0;
  const unreadNotificationsCount = profileId 
    ? notifications.filter(n => n.profileId === profileId && !n.read).length 
    : 0;

  // Handle conversationId from URL params (from notification click)
  useEffect(() => {
    const conversationId = searchParams.get("conversationId");
    if (conversationId && profileId) {
      const conversation = getConversationById(conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        markConversationAsRead(conversationId, profileId);
        setSearchParams({});
      }
    }
  }, [searchParams, profileId, getConversationById, markConversationAsRead, setSearchParams]);

  const getOtherProfile = useCallback((conversation: Conversation) => {
    if (!profileId) return undefined;
    const otherProfileId = conversation.participants.find((p) => p !== profileId);
    return otherProfileId ? getProfileById(otherProfileId) : undefined;
  }, [profileId, getProfileById]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (profileId) {
      markConversationAsRead(conversation.id, profileId);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = async (content: string) => {
    if (selectedConversation && profileId) {
      await sendMessage(selectedConversation.id, profileId, content);
      const updated = getConversationById(selectedConversation.id);
      if (updated) setSelectedConversation(updated);
    }
  };

  const handleCloseConversation = () => {
    if (!selectedConversation || !profileId) return;

    const otherProfile = getOtherProfile(selectedConversation);
    if (!otherProfile) return;

    navigate(`/evaluation?conversationId=${selectedConversation.id}&ratedProfileId=${otherProfile.id}`);
  };

  const handleCancelTrip = async () => {
    if (!selectedConversation || !profileId || !activeProfile) return;

    const otherProfileId = selectedConversation.participants.find((p) => p !== profileId);
    if (!otherProfileId) return;

    await sendMessage(selectedConversation.id, profileId, "Je dois annuler");

    try {
      await createNotification({
        profileId: otherProfileId,
        type: "cancellation",
        title: "Trajet annulé",
        message: "Votre voyageur a annulé. Souhaitez-vous republier votre annonce ?",
        demandeId: selectedConversation.demandeId,
        relatedProfileId: profileId,
      });
    } catch (e) {
      console.error("Erreur notification:", e);
    }

    await closeConversation(selectedConversation.id, profileId);
    await closeConversation(selectedConversation.id, otherProfileId);
    await addSystemMessage(selectedConversation.id, "La conversation est clôturée");

    const ratingBase = {
      conversationId: selectedConversation.id,
      score: 0,
      wasUseful: false,
      comment: "",
    };
    await saveRating({ ...ratingBase, raterId: profileId, ratedProfileId: otherProfileId });
    await saveRating({ ...ratingBase, raterId: otherProfileId, ratedProfileId: profileId });

    await completeDemande(selectedConversation.demandeId);
    await saveDemandeSnapshot(selectedConversation.demandeId);

    setSelectedConversation(null);
  };

  // Get current messages for selected conversation
  const currentMessages = selectedConversation 
    ? getMessages(selectedConversation.id) 
    : [];

  const otherProfile = selectedConversation 
    ? getOtherProfile(selectedConversation) 
    : undefined;

  const isClosedByUser = selectedConversation && profileId
    ? isConversationClosedByUser(selectedConversation, profileId)
    : false;

  const isFullyClosed = selectedConversation
    ? isConversationFullyClosed(selectedConversation)
    : false;

  // Refresh selected conversation state
  useEffect(() => {
    if (selectedConversation) {
      const updated = getConversationById(selectedConversation.id);
      if (updated) setSelectedConversation(updated);
    }
  }, [refreshKey, getConversationById]);

  if (!activeProfile) {
    return null;
  }

  // Chat view
  if (selectedConversation && otherProfile) {
    return (
      <section aria-label="Conversation" className="h-[calc(100vh-180px)]">
        <ChatView
          conversation={selectedConversation}
          messages={currentMessages}
          currentProfileId={profileId!}
          otherProfile={otherProfile}
          isClosedByUser={isClosedByUser}
          isFullyClosed={isFullyClosed}
          onBack={handleBack}
          onSendMessage={handleSendMessage}
          onCloseConversation={handleCloseConversation}
          onCancelTrip={handleCancelTrip}
        />
      </section>
    );
  }

  // List view
  return (
    <section aria-label="Messages" className="flex flex-col items-center px-4">
      <h1 className="text-[24px] font-semibold mb-4 w-full max-w-[42rem] text-heading">Messages.</h1>
      
      <Tabs defaultValue="messages" className="w-full max-w-[42rem]">
        <TabsList className="w-full grid grid-cols-2 mb-4 bg-transparent border-0 h-auto p-0">
          <TabsTrigger value="messages" className="relative text-[18px] font-semibold text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-0 border-b-2 border-transparent data-[state=active]:border-white rounded-none pb-2">
            <span className="relative">
              Messages
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-2 -right-5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold bg-primary text-primary-foreground">
                  {unreadMessagesCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative text-[18px] font-semibold text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-0 border-b-2 border-transparent data-[state=active]:border-white rounded-none pb-2">
            <span className="relative">
              Notifications
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-2 -right-5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold bg-primary text-primary-foreground">
                  {unreadNotificationsCount}
                </span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages">
          <ConversationList
            conversations={conversations}
            getOtherProfile={getOtherProfile}
            getLastMessage={getLastMessage}
            hasUnreadMessages={(conversationId) => profileId ? hasUnreadMessages(conversationId, profileId) : false}
            onSelectConversation={handleSelectConversation}
            getConversationStatus={(conversation) => {
              if (!isConversationFullyClosed(conversation)) return null;
              const msgs = getMessages(conversation.id);
              const hasCancelMessage = msgs.some(m => m.content === "Je dois annuler" && m.type !== "system");
              return hasCancelMessage ? "cancelled" : "completed";
            }}
          />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationList />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Messages;