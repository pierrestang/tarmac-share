

## Plan : Mode gratuit / payant avec bouton a bascule admin

### Objectif
Ajouter un parametre global "mode gratuit" controlable depuis le Tour de controle (page Statistiques) via un bouton a bascule (Switch). Quand le mode gratuit est actif, les etapes de paiement sont court-circuitees et aucune mention de prix n'apparait.

### Stockage du reglage
Creer une table `app_settings` dans la base de donnees avec une seule ligne contenant un booleen `free_mode`. Cela permet de persister le reglage et de le partager entre tous les utilisateurs.

### Modifications

#### 1. Base de donnees
- Creer la table `app_settings` avec une colonne `key` (text, primary key) et `value` (boolean).
- Inserer la ligne `{ key: 'free_mode', value: true }` par defaut (gratuit au lancement).
- RLS : lecture pour tous les utilisateurs authentifies, ecriture reservee a l'admin uniquement (via une fonction SQL qui verifie l'email admin).

#### 2. Hook `use-app-settings.ts`
- Nouveau hook qui lit le `free_mode` depuis `app_settings` via une requete Supabase.
- Expose `isFreeMode` (boolean) et `toggleFreeMode` (pour l'admin).

#### 3. Page Statistiques (Tour de controle)
- Ajouter un composant Switch (deja disponible dans `@radix-ui/react-switch`) avec le label "Mode gratuit" au-dessus des filtres de periode.
- Le switch appelle `toggleFreeMode` pour basculer entre gratuit et payant.

#### 4. Page `DemandeEnvoyer.tsx` - Envoi d'une demande
- Importer `isFreeMode` depuis le hook.
- Si `isFreeMode` est `true`, le bouton "Contacter" execute directement la logique de creation de demande (celle actuellement dans `Paiement.tsx` pour `type=envoi`) au lieu de rediriger vers `/paiement`.

#### 5. Page `DemandeAccepter.tsx` - Acceptation d'une demande
- Importer `isFreeMode`.
- Si `isFreeMode` est `true`, le bouton "Accepter" execute directement la logique d'acceptation (celle de `Paiement.tsx` pour `type=acceptation`) au lieu de rediriger vers `/paiement`.

#### 6. Page `RepublierAnnonce.tsx` - Republication
- Importer `isFreeMode`.
- Si `isFreeMode` est `true`, supprimer le texte mentionnant les demandes gratuites ou le tarif de 1,99 euros. Afficher simplement "Souhaitez-vous republier cette annonce ?" sans notion de prix.

#### 7. Page `Paiement.tsx`
- Aucune modification structurelle. Cette page reste fonctionnelle pour le mode payant. Elle ne sera simplement plus accessible quand `isFreeMode` est actif (les redirections sont court-circuitees en amont).

### Details techniques

```text
Flux envoi demande :
  Mode payant :  DemandeEnvoyer -> /paiement -> creation demande -> /trajets
  Mode gratuit : DemandeEnvoyer -> creation demande directe -> /trajets

Flux acceptation :
  Mode payant :  DemandeAccepter -> /paiement -> acceptation -> /messages
  Mode gratuit : DemandeAccepter -> acceptation directe -> /messages
```

#### Schema SQL
```sql
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value boolean NOT NULL DEFAULT false
);

INSERT INTO public.app_settings (key, value) VALUES ('free_mode', true);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les authentifies
CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Ecriture uniquement pour l'admin
CREATE POLICY "Admin can update settings"
  ON public.app_settings FOR UPDATE
  USING (
    auth.email() = 'pierres-19@hotmail.fr'
  );
```

