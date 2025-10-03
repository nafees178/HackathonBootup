import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Marketplace from "./pages/Marketplace";
import CreateRequest from "./pages/CreateRequest";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import RequestDetail from "./pages/RequestDetail";
import Conversations from "./pages/Conversations";
import Messages from "./pages/Messages";
import ActiveDeals from "./pages/ActiveDeals";
import RateDeal from "./pages/RateDeal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />
          <Route path="/create-request" element={<Layout><CreateRequest /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:userId" element={<Layout><PublicProfile /></Layout>} />
          <Route path="/request/:id" element={<Layout><RequestDetail /></Layout>} />
          <Route path="/messages" element={<Layout><Conversations /></Layout>} />
          <Route path="/messages/legacy" element={<Layout><Messages /></Layout>} />
          <Route path="/active-deals" element={<Layout><ActiveDeals /></Layout>} />
          <Route path="/rate-deal/:dealId" element={<Layout><RateDeal /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
