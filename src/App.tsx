import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import ModelProfile from "./pages/ModelProfile";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import ThankYou from "./pages/ThankYou";
import MembersArea from "./pages/MembersArea";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:slug" element={<ChatConversation />} />
          <Route path="/modelo/estermuniz" element={<Index />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/modelo/:slug" element={<ModelProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="/membros/:slug" element={<MembersArea />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
