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

    // No period filter — total stats
    // Fetch all data needed
    const [trajetsRes, demandesRes, ratingsRes] = await Promise.all([
      supabase.from("trajets").select("*"),
      supabase.from("demandes").select("*"),
      supabase.from("conversation_ratings").select("conversation_id, was_useful"),
    ]);

    const allTrajets = trajetsRes.data || [];
    const allDemandes = demandesRes.data || [];
    const allRatings = ratingsRes.data || [];

    // Build set of demande_ids with negative ratings (👎)
    // Need conversations to map conversation -> demande
    const convsRes = await supabase.from("conversations").select("id, demande_id");
    const allConvs = convsRes.data || [];
    const negativeRatingConvIds = new Set(allRatings.filter((r: any) => !r.was_useful).map((r: any) => r.conversation_id));
    const negativeDemandeIds = new Set(
      allConvs.filter((c: any) => negativeRatingConvIds.has(c.id)).map((c: any) => c.demande_id)
    );

    // Build set of demande_ids where BOTH participants rated was_useful=true
    // Group ratings by conversation_id, check if all ratings for that conv are positive
    const ratingsByConv: Record<string, { useful: number; total: number }> = {};
    for (const r of allRatings) {
      if (!ratingsByConv[r.conversation_id]) ratingsByConv[r.conversation_id] = { useful: 0, total: 0 };
      ratingsByConv[r.conversation_id].total++;
      if (r.was_useful) ratingsByConv[r.conversation_id].useful++;
    }
    const fullyPositiveConvIds = new Set(
      Object.entries(ratingsByConv)
        .filter(([_, v]) => v.total >= 2 && v.useful >= 2)
        .map(([id]) => id)
    );
    const fullyPositiveDemandeIds = new Set(
      allConvs.filter((c: any) => fullyPositiveConvIds.has(c.id)).map((c: any) => c.demande_id)
    );

    // Use all data (no period filter)
    const currentTrajets = allTrajets;
    const currentDemandes = allDemandes;

    // --- KPIs ---
    const annonces = currentTrajets.length;
    const matchsConfirmes = currentDemandes.filter((d: any) => d.status === "accepted" || d.status === "completed").length;
    const trajetsEffectues = currentDemandes.filter((d: any) => d.status === "completed").length;
    
    // Annulations = was_cancelled=true BUT not a negative rating (pure cancellation via button)
    const annulations = currentDemandes.filter((d: any) => d.status === "completed" && d.was_cancelled === true).length;
    
    // Non réalisés (hors annulation) = negative rating (👎) but NOT cancellations
    const nonRealises = currentDemandes.filter((d: any) => d.status === "completed" && negativeDemandeIds.has(d.id) && !d.was_cancelled).length;

    const matchRate = annonces > 0 ? ((matchsConfirmes * 2) / annonces) * 100 : 0;
    const tauxTrajetsEffectues = matchsConfirmes > 0 ? (trajetsEffectues / matchsConfirmes) * 100 : 0;
    const tauxAnnulation = trajetsEffectues > 0 ? (annulations / trajetsEffectues) * 100 : 0;
    const tauxNonRealises = trajetsEffectues > 0 ? (nonRealises / trajetsEffectues) * 100 : 0;

    // Réalisés = both participants answered 👍 AND not cancelled
    const trajetsRealises = currentDemandes.filter((d: any) => d.status === "completed" && fullyPositiveDemandeIds.has(d.id) && !d.was_cancelled).length;
    const tauxRealises = trajetsEffectues > 0 ? (trajetsRealises / trajetsEffectues) * 100 : 0;

    const result = {
      kpis: {
        trajetsPublies: annonces,
        matchsConfirmes: matchsConfirmes,
        matchRate: round(matchRate),
        trajetsCompletesPct: round(tauxTrajetsEffectues),
        trajetsCompletes: trajetsEffectues,
        trajetsRealises: trajetsRealises,
        tauxRealises: round(tauxRealises),
        annulations: annulations,
        tauxAnnulation: round(tauxAnnulation),
        nonRealises: nonRealises,
        tauxNonRealises: round(tauxNonRealises),
      },
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
