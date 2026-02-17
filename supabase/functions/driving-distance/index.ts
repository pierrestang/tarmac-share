import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { origins, destinations } = await req.json();

    // origins and destinations are arrays of {lat, lng}
    if (!origins?.length || !destinations?.length) {
      throw new Error("origins and destinations are required arrays of {lat, lng}");
    }

    // Use Distance Matrix API for batch distance calculations
    const originsParam = origins
      .map((o: { lat: number; lng: number }) => `${o.lat},${o.lng}`)
      .join("|");
    const destinationsParam = destinations
      .map((d: { lat: number; lng: number }) => `${d.lat},${d.lng}`)
      .join("|");

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsParam)}&destinations=${encodeURIComponent(destinationsParam)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || ""}`);
    }

    // Extract distances in km for each origin-destination pair
    const results: { distanceKm: number | null; durationMin: number | null }[][] = [];

    for (const row of data.rows) {
      const rowResults: { distanceKm: number | null; durationMin: number | null }[] = [];
      for (const element of row.elements) {
        if (element.status === "OK") {
          rowResults.push({
            distanceKm: element.distance.value / 1000,
            durationMin: Math.round(element.duration.value / 60),
          });
        } else {
          rowResults.push({ distanceKm: null, durationMin: null });
        }
      }
      results.push(rowResults);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("driving-distance error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
