

## Centraliser toutes les donnees avec Supabase

### Contexte

L'application stocke actuellement tout en localStorage (profils, trajets, demandes, messages, notifications, evaluations). Chaque appareil a ses propres donnees isolees. La migration vers Supabase permettra a tous les appareils de partager les memes donnees en temps reel.

### Architecture choisie

- **Pas d'authentification** : les profils restent accessibles sans connexion
- **Le "profil actif"** reste stocke en localStorage (choix local a chaque appareil)
- **Toutes les donnees** sont centralisees dans Supabase
- **RLS permissif** : puisqu'il n'y a pas d'authentification, les tables seront accessibles en lecture/ecriture via la cle publique (anon key)

### Etape 1 : Connecter Supabase

Activer Lovable Cloud (Supabase integre) pour le projet.

### Etape 2 : Creer les tables (migration SQL)

6 tables correspondant aux 6 types de donnees :

```text
profiles
  - id (uuid, PK)
  - first_name (text)
  - last_name (text)
  - description (text)
  - photo (text, nullable)
  - created_at (bigint)

trajets
  - id (uuid, PK)
  - profile_id (uuid, FK -> profiles)
  - date (text)
  - departure_station (text)
  - departure_station_lat (float, nullable)
  - departure_station_lng (float, nullable)
  - departure_time (text)
  - destination (text)
  - destination_lat (float, nullable)
  - destination_lng (float, nullable)
  - companions (int)
  - baggage_small (int)
  - baggage_medium (int)
  - baggage_large (int)
  - desired_departure (text)
  - additional_info (text)
  - is_republished (boolean, default false)
  - created_at (bigint)

demandes
  - id (uuid, PK)
  - type (text)
  - status (text)
  - from_profile_id (uuid, FK -> profiles)
  - to_profile_id (uuid, FK -> profiles)
  - from_trajet_id (uuid, FK -> trajets)
  - to_trajet_id (uuid, FK -> trajets)
  - snapshot (jsonb, nullable)
  - created_at (bigint)
  - updated_at (bigint)

conversations
  - id (uuid, PK)
  - demande_id (text)
  - participants (text[])
  - closed_by (text[])
  - created_at (bigint)
  - updated_at (bigint)

messages
  - id (uuid, PK)
  - conversation_id (uuid, FK -> conversations)
  - sender_id (text)
  - content (text)
  - type (text)
  - created_at (bigint)

notifications
  - id (uuid, PK)
  - profile_id (uuid, FK -> profiles)
  - type (text)
  - title (text)
  - message (text)
  - demande_id (text)
  - related_profile_id (text)
  - read (boolean, default false)
  - created_at (bigint)

conversation_ratings
  - id (uuid, PK, auto)
  - conversation_id (text)
  - rater_id (text)
  - rated_profile_id (text)
  - score (int)
  - was_useful (boolean)
  - comment (text)
  - unique(conversation_id, rater_id)
```

RLS sera active avec des policies "allow all" pour SELECT, INSERT, UPDATE, DELETE sur chaque table (pas d'authentification).

### Etape 3 : Configurer le client Supabase

Creer `src/integrations/supabase/client.ts` avec le client Supabase configure automatiquement via les variables d'environnement Lovable Cloud.

### Etape 4 : Adapter les hooks (le plus gros du travail)

Chaque hook sera reecrit pour lire/ecrire dans Supabase au lieu de localStorage :

**`use-profiles.ts`** : Les fonctions `loadProfiles`, `saveProfiles` seront remplacees par des appels Supabase (`select`, `insert`, `update`, `delete`). Le profil actif reste en localStorage (choix local).

**`use-trajets.ts`** : CRUD via Supabase. Le matching (`findMatches`) continuera de fonctionner cote client apres avoir charge les trajets depuis Supabase.

**`use-demandes.ts`** : CRUD via Supabase. Les snapshots seront stockes en JSONB.

**`use-messages.ts`** : Conversations et messages via Supabase. L'etat de lecture (read state) restera en localStorage (specifique a chaque appareil).

**`use-notifications.ts`** : CRUD via Supabase.

**`use-unread-messages.ts`** : Simplifie, basculera sur les donnees Supabase.

### Etape 5 : Adapter les pages

Les pages n'auront que des ajustements mineurs car elles utilisent deja les hooks. Les principaux changements :
- Gestion des etats de chargement (loading)
- Gestion des erreurs reseau
- Suppression des references directes a localStorage (sauf profil actif)

### Points importants

- **Pas de temps reel** dans un premier temps : les donnees seront chargees au montage des composants et rafraichies apres chaque action. Le temps reel (Supabase Realtime) pourra etre ajoute plus tard.
- **Migration des donnees existantes** : les donnees deja en localStorage ne seront pas migrees automatiquement. Il faudra recreer les profils et trajets.
- **Performance** : les listes seront chargees depuis le serveur, ce qui ajoute un leger delai par rapport au localStorage.
- **Sans authentification**, n'importe qui avec l'URL peut voir et modifier les donnees. C'est le compromis choisi.

### Ordre d'implementation

1. Activer Lovable Cloud / Supabase
2. Migration SQL (toutes les tables)
3. Client Supabase + types
4. Reecrire `use-profiles.ts`
5. Reecrire `use-trajets.ts`
6. Reecrire `use-demandes.ts`
7. Reecrire `use-messages.ts` et `use-notifications.ts`
8. Adapter `use-unread-messages.ts`
9. Ajuster les pages pour les etats de chargement
10. Nettoyage du code localStorage restant

