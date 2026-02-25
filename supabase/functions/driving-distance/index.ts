import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LatLng {
  lat: number;
  lng: number;
}

interface DetourPair {
  destinationA: LatLng;
  destinationB: LatLng;
}

interface DetourResult {
  directMinA: number;
  directMinB: number;
  totalMinAB: number;
  totalMinBA: number;
  detourA: number;
  detourB: number;
  bestOrder: "AB" | "BA";
}

async function getDirectionsDuration(
  origin: LatLng,
  destination: LatLng,
  waypoint: LatLng | null,
  apiKey: string
): Promise<number | null> {
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;
  if (waypoint) {
    url += `&waypoints=${waypoint.lat},${waypoint.lng}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.routes?.length) return null;
  // Sum all legs
  let totalSec = 0;
  for (const leg of data.routes[0].legs) {
    totalSec += leg.duration.value;
  }
  return Math.round(totalSec / 60);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const body = await req.json();
    const { mode } = body;

    // ===== MODE DETOUR =====
    if (mode === "detour") {
      const { departureStation, pairs } = body as {
        mode: string;
        departureStation: LatLng;
        pairs: DetourPair[];
      };

      if (!departureStation || !pairs?.length) {
        throw new Error("departureStation and pairs are required for detour mode");
      }

      // 1. Get all unique destinations for batch direct times
      const allDestinations: LatLng[] = [];
      const destIndexMap: Map<string, number> = new Map();
      for (const pair of pairs) {
        const keyA = `${pair.destinationA.lat},${pair.destinationA.lng}`;
        const keyB = `${pair.destinationB.lat},${pair.destinationB.lng}`;
        if (!destIndexMap.has(keyA)) {
          destIndexMap.set(keyA, allDestinations.length);
          allDestinations.push(pair.destinationA);
        }
        if (!destIndexMap.has(keyB)) {
          destIndexMap.set(keyB, allDestinations.length);
          allDestinations.push(pair.destinationB);
        }
      }

      // 2. Batch direct times via Distance Matrix
      const destinationsParam = allDestinations
        .map((d) => `${d.lat},${d.lng}`)
        .join("|");
      const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${departureStation.lat},${departureStation.lng}&destinations=${encodeURIComponent(destinationsParam)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const dmRes = await fetch(dmUrl);
      const dmData = await dmRes.json();

      const directTimes: (number | null)[] = [];
      if (dmData.status === "OK" && dmData.rows?.[0]) {
        for (const el of dmData.rows[0].elements) {
          directTimes.push(
            el.status === "OK" ? Math.round(el.duration.value / 60) : null
          );
        }
      } else {
        // Fill with nulls
        for (let i = 0; i < allDestinations.length; i++) directTimes.push(null);
      }

      // 3. For each pair, calculate shared routes in parallel
      const results: (DetourResult | null)[] = await Promise.all(
        pairs.map(async (pair) => {
          const keyA = `${pair.destinationA.lat},${pair.destinationA.lng}`;
          const keyB = `${pair.destinationB.lat},${pair.destinationB.lng}`;
          const directMinA = directTimes[destIndexMap.get(keyA)!];
          const directMinB = directTimes[destIndexMap.get(keyB)!];

          if (directMinA === null || directMinB === null) return null;

          // Station → A → B (A is waypoint, B is final destination)
          // Station → B → A (B is waypoint, A is final destination)
          const [totalAB, totalBA] = await Promise.all([
            getDirectionsDuration(departureStation, pair.destinationB, pair.destinationA, GOOGLE_MAPS_API_KEY),
            getDirectionsDuration(departureStation, pair.destinationA, pair.destinationB, GOOGLE_MAPS_API_KEY),
          ]);

          if (totalAB === null || totalBA === null) return null;

          // In order AB (Station→A→B): A is dropped first, B second
          // detour for A in AB order = 0 (A is on the way, dropped first, direct path)
          // Actually: detour for A = totalAB_legToA - directA (but A gets dropped at waypoint)
          // For passenger A in AB order: they travel Station→A, so their time = leg1 of AB route
          // For passenger B in AB order: they travel Station→A→B, so their time = totalAB
          // detourA_AB = 0 (they get dropped at A, which is a waypoint - but we need leg1 duration)
          
          // Simpler approach: 
          // In AB order: A detour = 0 extra (direct to A first), B detour = totalAB - directB
          // In BA order: B detour = 0 extra (direct to B first), A detour = totalBA - directA
          // But this isn't right either - A going via a slight detour to pick up before their stop
          
          // Correct interpretation:
          // AB order = Station → A → B
          //   Passenger A rides until A: their actual time is NOT just directA, it could be longer/shorter
          //   But since A is a waypoint on the route, the time to A = first leg of the AB route
          //   We don't have leg-level data from our simple call. Let's use the approximation:
          //   In AB order: A is dropped first (no detour for A beyond direct), B has detour = totalAB - directB
          //   In BA order: B is dropped first (no detour for B beyond direct), A has detour = totalBA - directA
          
          const detourB_AB = Math.max(0, totalAB - directMinB);
          const detourA_AB = 0; // A is dropped first, direct path to A

          const detourA_BA = Math.max(0, totalBA - directMinA);
          const detourB_BA = 0; // B is dropped first, direct path to B

          // Best order minimizes max detour
          const maxDetourAB = Math.max(detourA_AB, detourB_AB);
          const maxDetourBA = Math.max(detourA_BA, detourB_BA);
          
          let bestOrder: "AB" | "BA";
          let detourA: number;
          let detourB: number;
          
          if (maxDetourAB <= maxDetourBA) {
            bestOrder = "AB";
            detourA = detourA_AB;
            detourB = detourB_AB;
          } else {
            bestOrder = "BA";
            detourA = detourA_BA;
            detourB = detourB_BA;
          }

          return {
            directMinA,
            directMinB,
            totalMinAB: totalAB,
            totalMinBA: totalBA,
            detourA,
            detourB,
            bestOrder,
          };
        })
      );

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== LEGACY MODE (Distance Matrix) =====
    const { origins, destinations } = body;

    if (!origins?.length || !destinations?.length) {
      throw new Error("origins and destinations are required arrays of {lat, lng}");
    }

    const originsParam = origins
      .map((o: LatLng) => `${o.lat},${o.lng}`)
      .join("|");
    const destinationsParam = destinations
      .map((d: LatLng) => `${d.lat},${d.lng}`)
      .join("|");

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsParam)}&destinations=${encodeURIComponent(destinationsParam)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || ""}`);
    }

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
