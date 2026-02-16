import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin via JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");
    const now = Date.now();
    const periodStart = now - days * 24 * 60 * 60 * 1000;
    const prevPeriodStart = periodStart - days * 24 * 60 * 60 * 1000;

    // Fetch all data needed
    const [trajetsRes, demandesRes] = await Promise.all([
      supabase.from("trajets").select("*"),
      supabase.from("demandes").select("*"),
    ]);

    const allTrajets = trajetsRes.data || [];
    const allDemandes = demandesRes.data || [];

    // Period filters
    const currentTrajets = allTrajets.filter((t: any) => t.created_at >= periodStart);
    const prevTrajets = allTrajets.filter((t: any) => t.created_at >= prevPeriodStart && t.created_at < periodStart);
    const currentDemandes = allDemandes.filter((d: any) => d.created_at >= periodStart);
    const prevDemandes = allDemandes.filter((d: any) => d.created_at >= prevPeriodStart && d.created_at < periodStart);

    // --- KPIs ---
    const calcKpis = (trajets: any[], demandes: any[]) => {
      const annonces = trajets.length;
      const matchsConfirmes = demandes.filter((d: any) => d.status === "accepted" || d.status === "completed").length;
      const trajetsEffectues = demandes.filter((d: any) => d.status === "completed").length;
      const annulations = demandes.filter((d: any) => d.status === "refused").length;

      const matchRate = annonces > 0 ? (matchsConfirmes / annonces) * 100 : 0;
      const tauxTrajetsEffectues = matchsConfirmes > 0 ? (trajetsEffectues / matchsConfirmes) * 100 : 0;
      const tauxAnnulation = matchsConfirmes > 0 ? (annulations / (matchsConfirmes + annulations)) * 100 : 0;

      // Median time to match (ms -> minutes)
      const acceptedDemandes = demandes.filter((d: any) => d.status === "accepted" || d.status === "completed");
      const matchTimes = acceptedDemandes
        .map((d: any) => d.updated_at - d.created_at)
        .filter((t: number) => t > 0)
        .sort((a: number, b: number) => a - b);
      const medianTimeToMatch = matchTimes.length > 0
        ? matchTimes[Math.floor(matchTimes.length / 2)] / 60000
        : 0;

      // Active users per day
      const activeProfileIds = new Set<string>();
      trajets.forEach((t: any) => activeProfileIds.add(t.profile_id));
      demandes.forEach((d: any) => {
        activeProfileIds.add(d.from_profile_id);
        activeProfileIds.add(d.to_profile_id);
      });
      const periodDays = Math.max(1, trajets.length > 0 || demandes.length > 0 ? days : 1);
      const activeUsersPerDay = activeProfileIds.size / periodDays;

      return { matchRate, tauxTrajetsEffectues, medianTimeToMatch, tauxAnnulation, activeUsersPerDay, annonces, matchsConfirmes, trajetsEffectues };
    };

    const current = calcKpis(currentTrajets, currentDemandes);
    const prev = calcKpis(prevTrajets, prevDemandes);

    // --- Liquidite (hourly distribution for current period) ---
    const liquidite = Array.from({ length: 24 }, (_, hour) => {
      const annonces = currentTrajets.filter((t: any) => {
        const h = new Date(t.created_at).getHours();
        return h === hour;
      }).length;
      const matchs = currentDemandes.filter((d: any) => {
        if (d.status !== "accepted" && d.status !== "completed") return false;
        const h = new Date(d.updated_at).getHours();
        return h === hour;
      }).length;
      return { hour, annonces, matchs };
    });

    // --- Distance ---
    const matchedDemandes = currentDemandes.filter((d: any) => d.status === "accepted" || d.status === "completed");
    const distances: number[] = [];
    for (const dem of matchedDemandes) {
      const fromTrajet = allTrajets.find((t: any) => t.id === dem.from_trajet_id);
      const toTrajet = allTrajets.find((t: any) => t.id === dem.to_trajet_id);
      if (fromTrajet?.destination_lat && toTrajet?.destination_lat) {
        const dist = haversine(
          fromTrajet.destination_lat, fromTrajet.destination_lng,
          toTrajet.destination_lat, toTrajet.destination_lng
        );
        distances.push(dist);
      }
    }
    const distMoyenne = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
    const distDistribution = {
      "0-2": distances.filter(d => d <= 2).length,
      "2-3": distances.filter(d => d > 2 && d <= 3).length,
      "3-5": distances.filter(d => d > 3 && d <= 5).length,
    };

    // --- Funnel ---
    const funnel = {
      annoncesPubliees: current.annonces,
      demandesEnvoyees: currentDemandes.length,
      matchsConfirmes: current.matchsConfirmes,
      trajetsEffectues: current.trajetsEffectues,
    };

    const result = {
      kpis: {
        matchRate: { value: round(current.matchRate), previousValue: round(prev.matchRate) },
        trajetsEffectues: { value: round(current.tauxTrajetsEffectues), previousValue: round(prev.tauxTrajetsEffectues) },
        medianTimeToMatch: { value: round(current.medianTimeToMatch), previousValue: round(prev.medianTimeToMatch) },
        tauxAnnulation: { value: round(current.tauxAnnulation), previousValue: round(prev.tauxAnnulation) },
        activeUsersPerDay: { value: round(current.activeUsersPerDay, 1), previousValue: round(prev.activeUsersPerDay, 1) },
      },
      liquidite,
      distance: { moyenne: round(distMoyenne, 2), distribution: distDistribution },
      funnel,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
