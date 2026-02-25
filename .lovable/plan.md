

## Plan : Nouveau système de matching basé sur le détour en minutes

### Contexte

Le matching actuel utilise la distance en km entre destinations (via Google Maps Distance Matrix). Le nouveau système doit calculer le **détour en minutes** pour chaque passager en comparant les trajets directs vs. le trajet partagé, et scorer sur cette base.

### Architecture du changement

Le calcul du détour nécessite 4 temps de trajet :
- Aéroport → Destination A (direct)
- Aéroport → Destination B (direct)
- Aéroport → A → B (partagé, ordre 1)
- Aéroport → B → A (partagé, ordre 2)

Le détour pour chaque passager est le surplus de temps par rapport à son trajet direct. L'ordre optimal est celui qui minimise le détour max.

Cela ne peut pas être fait avec l'API Distance Matrix actuelle (qui calcule des paires origin→destination). Il faut utiliser l'API **Directions** (ou Routes) de Google Maps pour calculer des itinéraires avec waypoints.

### Fichiers impactés

#### 1. Edge function `supabase/functions/driving-distance/index.ts`

Refactorer pour accepter un nouveau mode `"detour"` en plus du mode existant. En mode detour :
- Reçoit : `departureStation` (coords), et une liste de paires `[destinationA, destinationB]`
- Pour chaque paire, fait 4 appels Directions API (ou 2 appels avec waypoints) :
  - Station → A (direct)
  - Station → B (direct)  
  - Station → A → B
  - Station → B → A
- Retourne pour chaque paire : `detourMinA`, `detourMinB`, `totalMinAB`, `totalMinBA`, `directMinA`, `directMinB`

L'API Distance Matrix peut servir pour les trajets directs (batch), et Directions API pour les trajets avec waypoint intermédiaire.

**Optimisation** : Les trajets directs (Station → chaque destination) peuvent être calculés en un seul appel Distance Matrix. Les trajets partagés (Station → A → B et Station → B → A) nécessitent des appels Directions individuels par paire.

#### 2. `src/hooks/use-trajets.ts`

**Constantes** :
- Supprimer `DEFAULT_MAX_DETOUR = 5`
- Ajouter `MAX_DETOUR_MIN = 15` et `MAX_TOTAL_TRIP_MIN = 45`

**`calculateDrivingDistance`** → Renommer/adapter en `calculateDetourTimes` :
- Appelle le nouveau mode de l'edge function
- Retourne les temps de détour pour chaque candidat

**`findMatches`** :
- Supprimer le pré-filtre Haversine basé sur les km
- Garder un pré-filtre Haversine généreux (ex: 30 km vol d'oiseau) pour limiter les appels API
- Appeler la nouvelle edge function pour calculer les détours en minutes
- Appliquer les nouveaux filtres : exclure si détour max > 15 min OU durée totale > 45 min
- Nouveau scoring détour : 0-5 min → 50 pts, 5-10 min → 35 pts, 10-15 min → 15 pts

**`calculateMatchScore`** :
- Modifier pour accepter `detourMin` au lieu de `drivingDistance`
- Nouveau barème timing : exact → 50, ±30 → 35, ±45 → 20
- Nouveau barème détour : 0-5 → 50, 5-10 → 35, 10-15 → 15

**`MatchedTraveler` type** (`src/types/trajet.ts`) :
- Changer `distance: number` en `detourMin: number` (détour en minutes pour le passager le plus impacté)

#### 3. Composants d'affichage (passage de km à minutes)

- `src/components/VoyageurCard.tsx` : `à Xkm` → `+X min de détour`
- `src/components/VoyageurCardSmall.tsx` : idem
- `src/components/DemandeCard.tsx` : idem
- `src/pages/DemandeHistorique.tsx` : idem
- `src/pages/DemandeEnvoyer.tsx` : adapter l'appel `calculateDrivingDistance` → `calculateDetourTimes`, et passer `detourMin` au lieu de `drivingDist`
- `src/pages/DemandeConsulter.tsx` / `DemandeAccepter.tsx` : adapter les appels à `calculateMatchScore`

#### 4. Page d'explication `src/pages/ScoreDeMatching.tsx`

Mettre à jour le texte explicatif pour refléter le nouveau système basé sur le détour en minutes au lieu de la distance en km.

### Détails techniques

**Appels API Google Maps** :

Pour N candidats, le système fera :
- 1 appel Distance Matrix avec 1 origin (station) et N+1 destinations (station + toutes les destinations) → donne les N temps directs
- 2×N appels Directions API pour les trajets avec waypoint (Station→A→B et Station→B→A pour chaque paire)

Pour limiter les coûts API, le pré-filtre Haversine reste en place mais avec un seuil plus généreux (ex: 30 km) puisque 15 min de détour en zone urbaine peut couvrir une plus grande distance.

**Format de réponse de l'edge function (mode detour)** :

```text
{
  results: [{
    directMinA: number,
    directMinB: number, 
    totalMinAB: number,  // Station → A → B
    totalMinBA: number,  // Station → B → A
    detourA: number,     // min(surplus pour A dans les 2 ordres)
    detourB: number,     // min(surplus pour B dans les 2 ordres)
    bestOrder: "AB" | "BA"
  }]
}
```

### Risques et points d'attention

- **Coût API** : Les appels Directions sont plus coûteux que Distance Matrix. Le pré-filtre Haversine est essentiel.
- **Latence** : Plus d'appels API par matching. Peut être parallélisé côté edge function.
- **Fallback** : Si l'API échoue, il n'y a pas de fallback simple en Haversine pour le détour en minutes. On pourrait estimer ~2 min/km en zone urbaine.

