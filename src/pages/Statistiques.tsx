import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

interface StatsData {
  kpis: {
    trajetsPublies: number;
    matchsConfirmes: number;
    matchRate: number;
    trajetsCompletesPct: number;
    trajetsCompletes: number;
    trajetsRealises: number;
    annulations: number;
    tauxAnnulation: number;
  };
  liquidite: { hour: number; annonces: number; matchs: number }[];
  distance: { moyenne: number; distribution: Record<string, number> };
}

const KpiRow = ({
  label, value, unit, tooltip,
}: {
  label: string; value: number; unit: string;
  tooltip?: string;
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <p className="text-xs text-muted-foreground">{label}</p>
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

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Métrique", "Valeur"],
      ["Annonces publiées", data.kpis.trajetsPublies],
      ["Nombre de matchs", data.kpis.matchsConfirmes],
      ["Taux de match (%)", data.kpis.matchRate],
      ["Trajets complétés", data.kpis.trajetsCompletes],
      ["Trajets complétés (%)", data.kpis.trajetsCompletesPct],
      ["Trajets réalisés", data.kpis.trajetsRealises],
      ["Nombre d'annulations", data.kpis.annulations],
      ["Taux annulation (%)", data.kpis.tauxAnnulation],
      [],
      ["Distance moyenne (km)", data.distance.moyenne],
      ["0-2 km", data.distance.distribution["0-2"]],
      ["2-3 km", data.distance.distribution["2-3"]],
      ["3-5 km", data.distance.distribution["3-5"]],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stats-${days}j.csv`;
    a.click();
  };

  if (!authorized) return null;

  return (
    <section className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4">
        <button onClick={() => navigate("/compte")} className="text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[24px] font-semibold text-heading">Statistiques</h1>
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-[42rem] flex flex-col gap-4">
          {/* Period filter */}
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 ${days === d ? "opacity-100" : "opacity-60"}`}
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
                  <KpiRow label="Annonces publiées" value={data.kpis.trajetsPublies} unit="" tooltip="Nombre total de trajets publiés sur la période" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Nombre de matchs" value={data.kpis.matchsConfirmes} unit="" tooltip="Demandes acceptées ou complétées sur la période" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Taux de match" value={data.kpis.matchRate} unit="%" tooltip="(Matchs confirmés × 2) / Annonces publiées" />
                </div>
              </Card>

              {/* Trajets complétés */}
              <p className="text-base font-semibold" style={{ color: '#F0EEE9' }}>Trajets complétés.</p>
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <KpiRow label="Trajets complétés" value={data.kpis.trajetsCompletes} unit="" tooltip="Nombre de demandes avec le statut complété sur la période" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Trajets complétés (%)" value={data.kpis.trajetsCompletesPct} unit="%" tooltip="Trajets complétés / Matchs confirmés" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Trajets réalisés" value={data.kpis.trajetsRealises} unit="" tooltip="Trajets complétés sans annulation ni évaluation négative" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Annulations" value={data.kpis.annulations} unit="" tooltip="Trajets complétés annulés via 'Je dois annuler'" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex items-center justify-between">
                  <KpiRow label="Annulations (%)" value={data.kpis.tauxAnnulation} unit="%" tooltip="Annulations / Trajets complétés" />
                </div>
              </Card>

              {/* Liquidité chart */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-card-foreground mb-3">Liquidité horaire</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.liquidite}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="annonces" fill="hsl(207 22% 39%)" name="Annonces" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="matchs" fill="hsl(210 46% 69%)" name="Matchs" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Distance */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-card-foreground mb-2">Distance entre matchés</p>
                <p className="text-lg font-semibold text-card-foreground">{data.distance.moyenne} km <span className="text-xs text-muted-foreground font-normal">en moyenne</span></p>
                <div className="mt-3 flex flex-col gap-2">
                  {Object.entries(data.distance.distribution).map(([range, count]) => (
                    <div key={range} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">{range} km</span>
                      <div className="flex-1 h-4 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-[hsl(var(--primary))] rounded-md"
                          style={{
                            width: `${Math.max(
                              Object.values(data.distance.distribution).reduce((a, b) => a + b, 0) > 0
                                ? (count / Object.values(data.distance.distribution).reduce((a, b) => a + b, 0)) * 100
                                : 0, 3
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-card-foreground w-6">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Export */}
              <Button onClick={exportCsv} className="flex items-center gap-2">
                <Download size={16} /> Exporter CSV
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
