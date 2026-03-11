import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate JWT for Google service account
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Google token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user || user.email !== "pierres-19@hotmail.fr") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine export type
    const url = new URL(req.url);
    const exportType = url.searchParams.get("type") || "users";
    const days = parseInt(url.searchParams.get("days") || "7");

    let values: any[][] = [];
    let sheetTab = "";
    let exportCount = 0;

    if (exportType === "stats") {
      // --- Stats export ---
      sheetTab = "Statistiques";

      const now = Date.now();
      const periodStart = now - days * 24 * 60 * 60 * 1000;

      const [trajetsRes, demandesRes, ratingsRes, convsRes] = await Promise.all([
        supabase.from("trajets").select("*"),
        supabase.from("demandes").select("*"),
        supabase.from("conversation_ratings").select("conversation_id, was_useful"),
        supabase.from("conversations").select("id, demande_id"),
      ]);

      const allTrajets = trajetsRes.data || [];
      const allDemandes = demandesRes.data || [];
      const allRatings = ratingsRes.data || [];
      const allConvs = convsRes.data || [];

      const negativeRatingConvIds = new Set(allRatings.filter((r: any) => !r.was_useful).map((r: any) => r.conversation_id));
      const negativeDemandeIds = new Set(allConvs.filter((c: any) => negativeRatingConvIds.has(c.id)).map((c: any) => c.demande_id));

      const ratingsByConv: Record<string, { useful: number; total: number }> = {};
      for (const r of allRatings) {
        if (!ratingsByConv[r.conversation_id]) ratingsByConv[r.conversation_id] = { useful: 0, total: 0 };
        ratingsByConv[r.conversation_id].total++;
        if (r.was_useful) ratingsByConv[r.conversation_id].useful++;
      }
      const fullyPositiveConvIds = new Set(
        Object.entries(ratingsByConv).filter(([_, v]) => v.total >= 2 && v.useful >= 2).map(([id]) => id)
      );
      const fullyPositiveDemandeIds = new Set(allConvs.filter((c: any) => fullyPositiveConvIds.has(c.id)).map((c: any) => c.demande_id));

      const currentTrajets = allTrajets.filter((t: any) => t.created_at >= periodStart);
      const currentDemandes = allDemandes.filter((d: any) => d.created_at >= periodStart);

      const annonces = currentTrajets.length;
      const matchsConfirmes = currentDemandes.filter((d: any) => d.status === "accepted" || d.status === "completed").length;
      const trajetsEffectues = currentDemandes.filter((d: any) => d.status === "completed").length;
      const annulations = currentDemandes.filter((d: any) => d.status === "completed" && d.was_cancelled === true).length;
      const nonRealises = currentDemandes.filter((d: any) => d.status === "completed" && negativeDemandeIds.has(d.id) && !d.was_cancelled).length;
      const matchRate = annonces > 0 ? ((matchsConfirmes * 2) / annonces) * 100 : 0;
      const tauxTrajetsEffectues = matchsConfirmes > 0 ? (trajetsEffectues / matchsConfirmes) * 100 : 0;
      const tauxAnnulation = trajetsEffectues > 0 ? (annulations / trajetsEffectues) * 100 : 0;
      const tauxNonRealises = trajetsEffectues > 0 ? (nonRealises / trajetsEffectues) * 100 : 0;
      const trajetsRealises = currentDemandes.filter((d: any) => d.status === "completed" && fullyPositiveDemandeIds.has(d.id) && !d.was_cancelled).length;
      const tauxRealises = trajetsEffectues > 0 ? (trajetsRealises / trajetsEffectues) * 100 : 0;

      const round = (n: number) => Math.round(n);

      values = [
        ["Métrique", "Valeur", `Période: ${days} jours`, `Exporté le ${new Date().toLocaleDateString("fr-FR")}`],
        ["Annonces publiées", annonces],
        ["Nombre de matchs", matchsConfirmes],
        ["Taux de match (%)", round(matchRate)],
        ["Trajets complétés", trajetsEffectues],
        ["Trajets complétés (%)", round(tauxTrajetsEffectues)],
        ["Trajets réalisés", trajetsRealises],
        ["Trajets réalisés (%)", round(tauxRealises)],
        ["Nombre d'annulations", annulations],
        ["Taux annulation (%)", round(tauxAnnulation)],
        ["Non réalisés (hors annulation)", nonRealises],
        ["Non réalisés (%)", round(tauxNonRealises)],
      ];
      exportCount = values.length - 1;
    } else if (exportType === "annonces") {
      // --- Annonces export ---
      sheetTab = "Annonces";

      const { data: trajets, error: trajetsError } = await supabase
        .from("trajets")
        .select("*")
        .order("created_at", { ascending: false });

      if (trajetsError) throw trajetsError;

      // Fetch profiles for names
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name");
      const profileMap = new Map<string, string>();
      for (const p of (profiles || []) as any[]) {
        profileMap.set(p.id, `${p.first_name} ${p.last_name}`);
      }

      const header = ["Date", "Voyageur", "Gare de départ", "Destination", "Heure de départ", "Accompagnants", "Petit bagage", "Moyen bagage", "Grand bagage", "Republié", "Créé le"];
      const rows = (trajets || []).map((t: any) => [
        t.date,
        profileMap.get(t.profile_id) || t.profile_id,
        t.departure_station,
        t.destination,
        t.departure_time,
        t.companions,
        t.baggage_small,
        t.baggage_medium,
        t.baggage_large,
        t.is_republished ? "Oui" : "Non",
        new Date(Number(t.created_at)).toLocaleDateString("fr-FR"),
      ]);

      values = [header, ...rows];
      exportCount = rows.length;
    } else if (exportType === "trajets") {
      // --- Trajets (matchs) export ---
      sheetTab = "Trajets";

      const { data: demandes, error: demandesError } = await supabase
        .from("demandes")
        .select("*")
        .in("status", ["pending", "accepted", "completed"])
        .order("created_at", { ascending: false });

      if (demandesError) throw demandesError;

      // Fetch trajets, profiles, conversations and ratings
      const trajetIds = new Set<string>();
      for (const d of (demandes || []) as any[]) {
        trajetIds.add(d.from_trajet_id);
        trajetIds.add(d.to_trajet_id);
      }

      const [trajetsRes, profilesRes, convsRes, ratingsRes] = await Promise.all([
        supabase.from("trajets").select("*").in("id", [...trajetIds]),
        supabase.from("profiles").select("id, first_name, last_name"),
        supabase.from("conversations").select("id, demande_id"),
        supabase.from("conversation_ratings").select("conversation_id, was_useful"),
      ]);

      const trajetMap = new Map<string, any>();
      for (const t of (trajetsRes.data || []) as any[]) trajetMap.set(t.id, t);

      const profileMap = new Map<string, string>();
      for (const p of (profilesRes.data || []) as any[]) profileMap.set(p.id, `${p.first_name} ${p.last_name}`);

      // Map demande_id -> conversation_id
      const demandeToConv = new Map<string, string>();
      for (const c of (convsRes.data || []) as any[]) demandeToConv.set(c.demande_id, c.id);

      // Map conversation_id -> ratings
      const ratingsByConv: Record<string, { useful: number; total: number }> = {};
      for (const r of (ratingsRes.data || []) as any[]) {
        if (!ratingsByConv[r.conversation_id]) ratingsByConv[r.conversation_id] = { useful: 0, total: 0 };
        ratingsByConv[r.conversation_id].total++;
        if (r.was_useful) ratingsByConv[r.conversation_id].useful++;
      }

      const getResultat = (d: any): string => {
        if (d.status !== "completed") return "En cours";
        if (d.was_cancelled) return "Annulé";
        const convId = demandeToConv.get(d.id);
        if (!convId || !ratingsByConv[convId]) return "En attente d'évaluation";
        const r = ratingsByConv[convId];
        if (r.total >= 2 && r.useful >= 2) return "Réalisé";
        if (r.total >= 1 && r.useful < r.total) return "Non réalisé";
        return "En attente d'évaluation";
      };

      const formatDateTime = (ts: number) => {
        const d = new Date(Number(ts));
        return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      };

      const header = ["Statut", "Résultat", "Annulé", "Envoyeur (demande)", "Date/heure demande", "Trajet envoyeur (Gare → Destination)", "Accepteur (demande)", "Date/heure acceptation", "Trajet accepteur (Gare → Destination)"];
      const rows = (demandes || []).map((d: any) => {
        const t1 = trajetMap.get(d.from_trajet_id);
        const t2 = trajetMap.get(d.to_trajet_id);
        return [
          d.status,
          getResultat(d),
          d.was_cancelled ? "Oui" : "Non",
          profileMap.get(d.from_profile_id) || d.from_profile_id,
          formatDateTime(d.created_at),
          t1 ? `${t1.departure_station} → ${t1.destination} (${t1.date} ${t1.departure_time})` : d.from_trajet_id,
          profileMap.get(d.to_profile_id) || d.to_profile_id,
          (d.status === "accepted" || d.status === "completed") ? formatDateTime(d.updated_at) : "",
          t2 ? `${t2.departure_station} → ${t2.destination} (${t2.date} ${t2.departure_time})` : d.to_trajet_id,
        ];
      });

      values = [header, ...rows];
      exportCount = rows.length;
    } else {
      // --- Users export ---
      sheetTab = "Utilisateurs";

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (profilesError) throw profilesError;

      const { data: { users: authUsers }, error: authError } =
        await supabase.auth.admin.listUsers({ perPage: 1000 });

      if (authError) throw authError;

      const emailMap = new Map<string, string>();
      for (const u of authUsers) {
        emailMap.set(u.id, u.email || "");
      }

      const header = ["ID", "Prénom", "Nom", "Email", "Date de création"];
      const rows = (profiles || []).map((p: any) => [
        p.id,
        p.first_name,
        p.last_name,
        emailMap.get(p.user_id) || "",
        new Date(Number(p.created_at)).toLocaleDateString("fr-FR"),
      ]);

      values = [header, ...rows];
      exportCount = rows.length;
    }

    // Google Sheets API
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");

    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");
    if (!sheetId) throw new Error("GOOGLE_SHEET_ID not configured");

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Ensure the tab exists, create it if not
    const spreadsheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const spreadsheetData = await spreadsheetRes.json();
    const existingTabs = (spreadsheetData.sheets || []).map((s: any) => s.properties.title);

    if (!existingTabs.includes(sheetTab)) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: sheetTab } } }],
          }),
        }
      );
    }

    const range = `${sheetTab}!A:Z`;

    // Clear existing data in the tab
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Write new data
    const writeRange = `${sheetTab}!A1`;
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ range: writeRange, majorDimension: "ROWS", values }),
      }
    );

    const writeData = await writeRes.json();
    if (!writeRes.ok) throw new Error(`Sheets API error: ${JSON.stringify(writeData)}`);

    return new Response(
      JSON.stringify({ success: true, exported: exportCount }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
