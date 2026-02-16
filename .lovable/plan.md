

# Page Statistiques -- Dashboard Admin

## Apercu

Creation d'une page `/statistiques` accessible uniquement au compte administrateur (`pierres-19@hotmail.fr`), avec un bouton d'acces sur la page `/compte` place sous "Reinitialiser les trajets". La page affiche un dashboard complet avec KPIs, graphiques et funnel.

## Architecture

### 1. Backend function `get-admin-stats`

Une fonction backend sera creee pour agreger toutes les statistiques cote serveur. Cette approche est necessaire car :
- Les politiques de securite empechent un utilisateur de lire toutes les donnees
- Aucune donnee personnelle ne doit etre exposee au client
- La verification admin se fait cote serveur (email du compte connecte)

La fonction recevra un parametre `period` (7, 30, ou dates personnalisees) et retournera toutes les metriques agregees.

**Donnees retournees :**

```text
{
  kpis: {
    matchRate: { value, previousValue }
    trajetsEffectues: { value, previousValue }
    medianTimeToMatch: { value, previousValue }
    tauxAnnulation: { value, previousValue }
    activeUsersPerDay: { value, previousValue }
  },
  liquidite: [{ hour: 0-23, annonces: N, matchs: N }],
  distance: {
    moyenne: N,
    distribution: { "0-2": N, "2-3": N, "3-5": N }
  },
  funnel: {
    annoncesPubliees: N,
    demandesEnvoyees: N,
    matchsConfirmes: N,
    trajetsEffectues: N
  }
}
```

**Logique de calcul :**
- Match confirme = demande avec `status = 'accepted'` ou `status = 'completed'`
- Trajet effectue = demande avec `status = 'completed'`
- Annulation = demande avec `status = 'refused'` parmi les demandes qui avaient ete acceptees (ou toutes les refused comme proxy)
- Temps median avant match = mediane de `(demande.updated_at - demande.created_at)` pour les demandes acceptees
- Utilisateurs actifs = profils distincts ayant cree un trajet ou une demande dans la periode
- Distance entre matches = calculee a partir des coordonnees de destination des trajets lies aux demandes acceptees/completees

### 2. Page `src/pages/Statistiques.tsx`

Composants principaux :

**Filtre de periode** : boutons 7j / 30j / Personnalise (avec date picker)

**Section 1 -- KPIs** (5 cartes) :
- Trajets reellement effectues (priorite 1)
- Match Rate (priorite 2)
- Temps median avant match
- Taux d'annulation
- Utilisateurs actifs / jour

Chaque carte affiche la valeur, la variation par rapport a la periode precedente (fleche haut/bas), et un code couleur (vert/orange/rouge).

**Section 2 -- Graphique Liquidite** :
Bar chart (recharts) avec heures 0h-23h, barres annonces et barres matchs superposees.

**Section 3 -- Densite & Distance** :
Distance moyenne + barres de distribution (0-2km, 2-3km, 3-5km).

**Section 4 -- Funnel** :
Entonnoir visuel : Annonces -> Demandes -> Matchs -> Trajets effectues.

**Export CSV** : bouton qui telecharge les donnees affichees.

### 3. Modifications existantes

**`src/pages/Compte.tsx`** : ajout d'un bouton "Statistiques" visible uniquement par l'admin, place sous "Reinitialiser les trajets", qui navigue vers `/statistiques`.

**`src/App.tsx`** : ajout de la route `/statistiques` dans les routes protegees.

### 4. Protection d'acces

- Cote client : la page redirige vers `/compte` si l'utilisateur n'est pas admin (verification email)
- Cote serveur : la fonction backend verifie que le token JWT correspond au compte admin avant de retourner les donnees

---

## Details techniques

### Fichiers crees
- `supabase/functions/get-admin-stats/index.ts` -- fonction backend d'agregation
- `src/pages/Statistiques.tsx` -- page dashboard

### Fichiers modifies
- `src/App.tsx` -- ajout route `/statistiques`
- `src/pages/Compte.tsx` -- ajout bouton "Statistiques" (admin only)

### Dependances utilisees (deja installees)
- `recharts` pour les graphiques
- `date-fns` pour la gestion des periodes
- Composants UI existants (Card, Button, etc.)

### Securite
- Verification admin cote serveur via le JWT et l'email
- Aucune donnee personnelle dans la reponse (uniquement des compteurs agreges)
- Pas de creation de table de roles (le systeme existant utilise la verification email, on garde la coherence mais on securise cote serveur)

