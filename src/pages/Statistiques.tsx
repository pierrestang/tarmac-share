import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

interface KpiData {
  value: number;
  previousValue: number;
}

interface StatsData {
  kpis: {
    trajetsPublies: KpiData;
    matchsConfirmes: KpiData;
    matchRate: KpiData;
    trajetsEffectues: KpiData;
    trajetsRealises: KpiData;
    tauxAnnulation: KpiData;
    activeUsersPerDay: KpiData;
  };
  liquidite: { hour: number; annonces: number; matchs: number }[];
  distance: { moyenne: number; distribution: Record<string, number> };
  funnel: {
    annoncesPubliees: number;
    demandesEnvoyees: number;
    matchsConfirmes: number;
    trajetsEffectues: number;
  };
}

const KpiCard = ({
  label, value, unit, previousValue, invertColors, tooltip,
}: {
  label: string; value: number; unit: string; previousValue: number;
  invertColors?: boolean; tooltip?: string;
}) => {
  const diff = value - previousValue;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  let colorClass = "text-emerald-500";
  if (invertColors) {
    if (isPositive) colorClass = "text-red-500";
    else if (!isNeutral) colorClass = "text-emerald-500";
  } else {
    if (!isPositive && !isNeutral) colorClass = "text-red-500";
  }
  if (isNeutral) colorClass = "text-amber-500";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-1 mb-1">
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
      <p className="text-2xl font-semibold text-card-foreground">
        {value}{unit}
      </p>
      {!isNeutral && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${colorClass}`}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(diff).toFixed(1)}{unit} vs période préc.</span>
        </div>
      )}
      {isNeutral && (
        <p className="text-xs mt-1 text-amber-500">= stable</p>
      )}
    </Card>
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
      ["Métrique", "Valeur", "Période précédente"],
      ["Annonces publiées", data.kpis.trajetsPublies.value, data.kpis.trajetsPublies.previousValue],
      ["Nombre de matchs", data.kpis.matchsConfirmes.value, data.kpis.matchsConfirmes.previousValue],
      ["Taux de match (%)", data.kpis.matchRate.value, data.kpis.matchRate.previousValue],
      ["Trajets effectués (%)", data.kpis.trajetsEffectues.value, data.kpis.trajetsEffectues.previousValue],
      ["Trajets réalisés", data.kpis.trajetsRealises.value, data.kpis.trajetsRealises.previousValue],
      ["Taux annulation (%)", data.kpis.tauxAnnulation.value, data.kpis.tauxAnnulation.previousValue],
      ["Utilisateurs actifs/jour", data.kpis.activeUsersPerDay.value, data.kpis.activeUsersPerDay.previousValue],
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
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  label="Annonces publiées"
                  value={data.kpis.trajetsPublies.value}
                  unit=""
                  previousValue={data.kpis.trajetsPublies.previousValue}
                  tooltip="Nombre total de trajets publiés sur la période"
                />
                <KpiCard
                  label="Nombre de matchs"
                  value={data.kpis.matchsConfirmes.value}
                  unit=""
                  previousValue={data.kpis.matchsConfirmes.previousValue}
                  tooltip="Demandes acceptées ou complétées sur la période"
                />
                <KpiCard
                  label="Trajets effectués"
                  value={data.kpis.trajetsEffectues.value}
                  unit="%"
                  previousValue={data.kpis.trajetsEffectues.previousValue}
                  tooltip="Trajets complétés / Matchs confirmés"
                />
                <KpiCard
                  label="Taux de match"
                  value={data.kpis.matchRate.value}
                  unit="%"
                  previousValue={data.kpis.matchRate.previousValue}
                  tooltip="Matchs confirmés / Annonces publiées"
                />
                <KpiCard
                  label="Trajets réalisés"
                  value={data.kpis.trajetsRealises.value}
                  unit=""
                  previousValue={data.kpis.trajetsRealises.previousValue}
                  tooltip="Nombre de demandes avec le statut complété sur la période"
                />
                <KpiCard
                  label="Taux d'annulation"
                  value={data.kpis.tauxAnnulation.value}
                  unit="%"
                  previousValue={data.kpis.tauxAnnulation.previousValue}
                  invertColors
                  tooltip="Demandes refusées / (Matchs + Refus)"
                />
                <KpiCard
                  label="Utilisateurs actifs/jour"
                  value={data.kpis.activeUsersPerDay.value}
                  unit=""
                  previousValue={data.kpis.activeUsersPerDay.previousValue}
                  tooltip="Profils distincts ayant publié ou demandé, divisé par le nombre de jours"
                />
              </div>

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
