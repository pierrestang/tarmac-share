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


import ConfirmAnnulation from "./pages/ConfirmAnnulation";
import Numero from "./pages/Numero";
import Statistiques from "./pages/Statistiques";
import TourDeControle from "./pages/TourDeControle";
import VotreTiming from "./pages/VotreTiming";
import ScoreDeMatching from "./pages/ScoreDeMatching";
import RetrouvezVous from "./pages/RetrouvezVous";
import GestionTrajet from "./pages/GestionTrajet";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
              
              
              <Route path="confirm-annulation" element={<ConfirmAnnulation />} />
              <Route path="statistiques" element={<Statistiques />} />
              <Route path="tour-de-controle" element={<TourDeControle />} />
              <Route path="tarmac-dans-ma-ville" element={<TarmacDansMaVille />} />
            </Route>
            <Route path="votre-timing" element={<VotreTiming />} />
            <Route path="score-de-matching" element={<ScoreDeMatching />} />
            <Route path="retrouvez-vous" element={<RetrouvezVous />} />
            <Route path="gestion-trajet" element={<GestionTrajet />} />
            <Route path="numero" element={<Numero />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
