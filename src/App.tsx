import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppShell } from "@/components/layout/AppShell";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CommentCaMarche from "./pages/CommentCaMarche";
import CommunicationLancement from "./pages/CommunicationLancement";
import TarmacDansMaVille from "./pages/TarmacDansMaVille";
import Trajets from "./pages/Trajets";
import Publier from "./pages/Publier";
import Messages from "./pages/Messages";
import Compte from "./pages/Compte";
import Matches from "./pages/Matches";
import DemandeEnvoyer from "./pages/DemandeEnvoyer";
import DemandeAccepter from "./pages/DemandeAccepter";
import DemandeConsulter from "./pages/DemandeConsulter";
import DemandeHistorique from "./pages/DemandeHistorique";
import Paiement from "./pages/Paiement";
import Evaluation from "./pages/Evaluation";
import RepublierAnnonce from "./pages/RepublierAnnonce";
import ConfirmAnnulation from "./pages/ConfirmAnnulation";
import Numero from "./pages/Numero";
import Statistiques from "./pages/Statistiques";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="auth" element={<Auth />} />
          <Route path="connexion" element={<Connexion />} />
          <Route path="inscription" element={<Inscription />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="comment-ca-marche" element={<CommentCaMarche />} />
          <Route path="communication-lancement" element={<CommunicationLancement />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Index />} />
              <Route path="trajets" element={<Trajets />} />
              <Route path="publier" element={<Publier />} />
              <Route path="messages" element={<Messages />} />
              <Route path="compte" element={<Compte />} />
              <Route path="matches" element={<Matches />} />
              <Route path="demande-envoyer" element={<DemandeEnvoyer />} />
              <Route path="demande-accepter" element={<DemandeAccepter />} />
              <Route path="demande-consulter" element={<DemandeConsulter />} />
              <Route path="demande-historique" element={<DemandeHistorique />} />
              <Route path="paiement" element={<Paiement />} />
              <Route path="evaluation" element={<Evaluation />} />
              <Route path="republier-annonce" element={<RepublierAnnonce />} />
              <Route path="confirm-annulation" element={<ConfirmAnnulation />} />
              <Route path="numero" element={<Numero />} />
              <Route path="statistiques" element={<Statistiques />} />
              <Route path="tarmac-dans-ma-ville" element={<TarmacDansMaVille />} />
            </Route>
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
