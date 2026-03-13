import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/use-app-settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

const TourDeControle = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingAnnonces, setExportingAnnonces] = useState(false);
  const [exportingTrajets, setExportingTrajets] = useState(false);
  const [exportingStats, setExportingStats] = useState(false);
  const { isFreeMode, toggleFreeMode } = useAppSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        navigate("/compte", { replace: true });
      }
    });
  }, [navigate]);

  const handleResetData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.functions.invoke("reset-all-data", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setShowResetConfirm(false);
    navigate("/publier");
    window.location.reload();
  };

  if (!authorized) return null;

  return (
    <section className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex justify-center">
        <div className="w-full max-w-[42rem] flex flex-col gap-2">
          <button onClick={() => navigate("/compte")} className="text-foreground self-start">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[24px] font-semibold text-heading">Tour de contrôle.</h1>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[42rem] flex flex-col gap-4">
          {/* Statistiques */}
          <Button
            className="w-full rounded-md"
            onClick={() => navigate("/statistiques")}
          >
            Statistiques
          </Button>

          {/* Export Google Sheets */}
          <Button
            className="w-full rounded-md"
            variant="outline"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const { data, error } = await supabase.functions.invoke("export-users-gsheet", {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (error) throw error;
                toast({
                  title: `${data.usersExported} utilisateurs exportés vers Google Sheets`,
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
                });
              } catch (e: any) {
                toast({
                  title: "Erreur lors de l'export",
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#E34454', color: '#F0EEE9' },
                });
                console.error(e);
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? "Export en cours..." : "Exporter les utilisateurs"}
          </Button>

          {/* Export annonces */}
          <Button
            className="w-full rounded-full"
            variant="outline"
            disabled={exportingAnnonces}
            onClick={async () => {
              setExportingAnnonces(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users-gsheet?type=annonces`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                });
                if (!res.ok) throw new Error("Export failed");
                const result = await res.json();
                toast({
                  title: `${result.exported} annonces exportées vers Google Sheets`,
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
                });
              } catch (e: any) {
                toast({
                  title: "Erreur lors de l'export",
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#E34454', color: '#F0EEE9' },
                });
                console.error(e);
              } finally {
                setExportingAnnonces(false);
              }
            }}
          >
            {exportingAnnonces ? "Export en cours..." : "Exporter les annonces"}
          </Button>

          {/* Export trajets */}
          <Button
            className="w-full rounded-full"
            variant="outline"
            disabled={exportingTrajets}
            onClick={async () => {
              setExportingTrajets(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users-gsheet?type=trajets`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                });
                if (!res.ok) throw new Error("Export failed");
                const result = await res.json();
                toast({
                  title: `${result.exported} trajets exportés vers Google Sheets`,
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
                });
              } catch (e: any) {
                toast({
                  title: "Erreur lors de l'export",
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#E34454', color: '#F0EEE9' },
                });
                console.error(e);
              } finally {
                setExportingTrajets(false);
              }
            }}
          >
            {exportingTrajets ? "Export en cours..." : "Exporter les trajets"}
          </Button>

          {/* Export stats */}
          <Button
            className="w-full rounded-full"
            disabled={exportingStats}
            onClick={async () => {
              setExportingStats(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users-gsheet?type=stats`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                });
                if (!res.ok) throw new Error("Export failed");
                toast({
                  title: "Statistiques exportées vers Google Sheets",
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
                });
              } catch (e) {
                toast({
                  title: "Erreur lors de l'export",
                  className: "bg-transparent border-0 shadow-none",
                  style: { backgroundColor: '#E34454', color: '#F0EEE9' },
                });
                console.error(e);
              } finally {
                setExportingStats(false);
              }
            }}
          >
            {exportingStats ? "Export en cours..." : "Exporter les statistiques"}
          </Button>

          {/* Reset */}
          <Button
            className="w-full rounded-full"
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
          >
            Réinitialiser les trajets
          </Button>

          {/* Free mode toggle */}
          <p className="text-base font-semibold" style={{ color: '#F0EEE9' }}>Mode gratuit.</p>
          <Card className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-card-foreground">
              {isFreeMode ? "Gratuit" : "Payant"}
            </span>
            <Switch checked={isFreeMode} onCheckedChange={toggleFreeMode} />
          </Card>
        </div>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">Réinitialiser les trajets ?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-left">
              Cette action supprimera tous les trajets et demandes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleResetData} className="rounded-md">Réinitialiser</AlertDialogAction>
            <AlertDialogCancel className="rounded-md">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default TourDeControle;
