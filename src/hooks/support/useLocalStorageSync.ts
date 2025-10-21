
// This is a simplified version of the hook that only contains what's needed
// for message handling to work correctly

export const useLocalStorageSync = () => {
  const updateStoredTickets = (newTicket: any) => {
    try {
      console.log("Support tickets no longer supported");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const updateUnreadMessages = (id: string) => {
    try {
      const unreadCounts = JSON.parse(localStorage.getItem('unreadMessages') || '{}');
      unreadCounts[id] = (unreadCounts[id] || 0) + 1;
      localStorage.setItem('unreadMessages', JSON.stringify(unreadCounts));
    } catch (error) {
      console.error("Error updating unread messages:", error);
    }
  };

  const dispatchEvents = (id: string) => {
    window.dispatchEvent(new Event('ticketUpdated'));
  };

  return {
    updateStoredTickets,
    updateUnreadMessages,
    dispatchEvents
  };
};
