import { useEffect, useMemo, useState } from "react";

// Keep resetLocalData for the reset functionality
export function resetLocalData() {
  // Preserve profiles and active profile
  const activeProfileId = localStorage.getItem("activeProfileId");
  
  // Only clear local state (read states etc.)
  localStorage.removeItem("conversationReadState");
  
  // Restore active profile
  if (activeProfileId) {
    localStorage.setItem("activeProfileId", activeProfileId);
  }
}

// These are now no-ops since unread is computed from messages
export function resetUnreadMessages() {}
export function incrementUnreadMessages() {}

export function useUnreadMessagesCount() {
  const [count] = useState<number>(0);
  return useMemo(() => ({ count }), [count]);
}
