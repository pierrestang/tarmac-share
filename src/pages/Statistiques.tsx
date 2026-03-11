import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

interface StatsData {
  kpis: {
    trajetsPublies: number;
    matchsConfirmes: number;
    matchRate: number;
    trajetsCompletesPct: number;
    trajetsCompletes: number;
    trajetsRealises: number;
    tauxRealises: number;
    annulations: number;
    tauxAnnulation: number;
    nonRealises: number;
    tauxNonRealises: number;
  };
}

const KpiRow = ({
  label, value, unit, tooltip, bold,
}: {
  label: string; value: number; unit: string;
  tooltip?: string; bold?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <p className={`text-xs ${bold ? "font-semibold text-card-foreground" : "text-muted-foreground"}`}>{label}</p>
        {tooltip && (
          <Popover>
            <PopoverTrigger type="button" className="flex items-center justify-center w-4 h-4 rounded-full border border-muted-foreground text-muted-foreground text-[10px] font-medium shrink-0 cursor-help">
              ?
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-[200px] text-xs p-3">
              {tooltip}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-base font-semibold text-card-foreground">
        {value}{unit}
      </p>
    </div>
  );
};

const FunnelBar = ({ label, value, max }: { label: string; value: number; max: number }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 text-right">{label}</span>
      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
        <div
          className="h-full bg-[hsl(var(--primary))] rounded-md transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-card-foreground w-10">{value}</span>
    </div>
  );
};

const Statistiques = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        navigate("/compte", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    const fetchStats = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?days=${days}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (response.ok) {
        setData(await response.json());
      }
      setLoading(false);
    };
    fetchStats();
  }, [authorized, days]);

  if (!authorized) return null;

  return (
    <section className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex justify-center">
        <div className="w-full max-w-[42rem] flex flex-col gap-2">
          <button onClick={() => navigate("/tour-de-controle")} className="text-foreground self-start">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[24px] font-semibold text-heading">Statistiques.</h1>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[42rem] flex flex-col gap-4">
          {/* Period filter */}
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 rounded-full ${days === d ? "opacity-100" : "opacity-60"}`}
                >
                  {d}j
                </Button>
            ))}
          </div>

          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Chargement...</Card>
          ) : data ? (
            <>
              {/* Matching */}
              <p className="text-base font-semibold" style={{ color: '#F0EEE9' }}>Matching.</p>
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <KpiRow label="Annonces" value={data.kpis.trajetsPublies} unit="" tooltip="Nombre total d'annonces" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Matchs" value={data.kpis.matchsConfirmes} unit="" tooltip="Demandes acceptées ou complétées" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Matchs %" value={data.kpis.matchRate} unit="%" tooltip="(Matchs x 2) / Annonces" bold />
                </div>
              </Card>

              {/* Trajets complétés */}
              <p className="text-base font-semibold" style={{ color: '#F0EEE9' }}>Trajets complétés.</p>
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <KpiRow label="Complétés" value={data.kpis.trajetsCompletes} unit="" tooltip="Demandes avec le statut complété" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Complétés %" value={data.kpis.trajetsCompletesPct} unit="%" tooltip="Complétés / Matchs" bold />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Annulés" value={data.kpis.annulations} unit="" tooltip="Trajets annulés" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Annulés %" value={data.kpis.tauxAnnulation} unit="%" tooltip="Annulés / Complétés" bold />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Non réalisés (hors annulés)" value={data.kpis.nonRealises} unit="" tooltip="Trajets non réalisés (hors annulés)" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Non réalisés (hors annulés) %" value={data.kpis.tauxNonRealises} unit="%" tooltip="Non réalisés (hors annulés) / Complétés" bold />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Réalisés" value={data.kpis.trajetsRealises} unit="" tooltip="Les deux voyageurs ont répondu Oui" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Réalisés %" value={data.kpis.tauxRealises} unit="%" tooltip="Réalisés / Complétés" bold />
                </div>
              </Card>


              {/* Export */}
              <Button
                onClick={async () => {
                  setExporting(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users-gsheet?type=stats&days=${days}`;
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
                    setExporting(false);
                  }
                }}
                disabled={exporting}
                className="w-full flex items-center gap-2 rounded-full"
              >
                <Upload size={16} /> {exporting ? "Export en cours..." : "Exporter les statistiques"}
              </Button>

            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">Erreur de chargement</Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default Statistiques;
