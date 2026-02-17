

## Objectif

"Trajets realises" = nombre de trajets completes MOINS ceux qui ont ete annules (via "Je dois annuler") et ceux ou un voyageur a repondu 👎 a "Le trajet a-t-il eu lieu ?".

## Probleme actuel

1. Le bouton 👎 dans `/evaluation` appelle exactement la meme fonction que 👍 -- il n'y a aucune distinction enregistree en base.
2. Les annulations sont marquees par un message systeme `[CANCELLED_BY:...]` mais le statut de la demande est `completed` comme les trajets normaux.
3. L'edge function `get-admin-stats` ne peut donc pas distinguer les "vrais" trajets completes des annulations/negatifs.

## Plan d'implementation

### 1. Migration base de donnees : ajouter une colonne `was_cancelled` sur la table `demandes`

Ajouter un champ boolean `was_cancelled` (defaut `false`) a la table `demandes` pour marquer les demandes annulees ou evaluees negativement.

### 2. Distinguer 👍 et 👎 dans `src/pages/Evaluation.tsx`

- Passer un parametre `wasUseful: boolean` a `handleAnswer`
- 👍 appelle `handleAnswer(true)`, 👎 appelle `handleAnswer(false)`
- Quand `wasUseful === false`, mettre a jour `was_cancelled = true` sur la demande correspondante via un update Supabase

### 3. Marquer les annulations dans `src/pages/ConfirmAnnulation.tsx`

Apres `completeDemande`, ajouter un update Supabase pour mettre `was_cancelled = true` sur la demande.

### 4. Marquer les annulations dans `src/pages/Messages.tsx` (handleCancelTrip)

Meme logique : apres la completion de la demande lors d'une annulation via le chat, mettre `was_cancelled = true`.

### 5. Mettre a jour l'edge function `get-admin-stats`

- `trajetsCompletes` = demandes avec `status === 'completed'` (inchange)
- Nouveau : `trajetsRealises` = demandes `completed` ET `was_cancelled === false`
- Renvoyer le nombre (et non plus un ratio)

### 6. Mettre a jour `src/pages/Statistiques.tsx`

- Afficher `trajetsRealises` comme un nombre entier
- Mettre a jour le tooltip : "Trajets completes sans annulation ni evaluation negative"

---

### Details techniques

**Migration SQL :**
```sql
ALTER TABLE public.demandes 
ADD COLUMN was_cancelled boolean NOT NULL DEFAULT false;
```

**Evaluation.tsx** -- distinction 👍/👎 :
```typescript
const handleAnswer = async (wasUseful: boolean) => {
  // ... existing logic ...
  if (!wasUseful) {
    await supabase.from("demandes").update({ was_cancelled: true }).eq("id", convRow.demande_id);
  }
  // ... rest ...
};
```

**ConfirmAnnulation.tsx** -- apres completeDemande :
```typescript
await supabase.from("demandes").update({ was_cancelled: true }).eq("id", conversation.demandeId);
```

**Edge function** -- calcul modifie :
```typescript
const trajetsRealises = allDemandes.filter(d => 
  d.status === "completed" && !d.was_cancelled && 
  new Date(d.created_at) >= periodStart
).length;
```

