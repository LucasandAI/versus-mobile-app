
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatDrawerProvider } from "./context/ChatDrawerContext";
import { UnreadMessagesProvider } from "./context/UnreadMessagesContext";
import { DirectConversationsProvider } from "./context/DirectConversationsContext";
import { AppProvider } from "./context/AppContext";
import AppContent from "./components/AppContent";
import Index from "./pages/Index";
import ConnectDevice from "./pages/ConnectDevice";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <UnreadMessagesProvider>
          <DirectConversationsProvider>
            <ChatDrawerProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<AppContent><Index /></AppContent>} />
                  <Route path="/connect-device" element={<AppContent><ConnectDevice /></AppContent>} />
                  <Route path="/terms" element={<AppContent><TermsAndConditions /></AppContent>} />
                  <Route path="/privacy" element={<AppContent><PrivacyPolicy /></AppContent>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<AppContent><NotFound /></AppContent>} />
                </Routes>
              </BrowserRouter>
            </ChatDrawerProvider>
          </DirectConversationsProvider>
        </UnreadMessagesProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
