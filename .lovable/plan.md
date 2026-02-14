

# Plan : Corriger les notifications et la robustesse du flux

## Probleme identifie

Depuis la mise en place de l'authentification par email/mot de passe, les **notifications INSERT echouaient** a cause des politiques RLS. La politique a ete corrigee dans la derniere migration, mais **plusieurs endroits du code n'ont pas de try/catch** autour des appels `createNotification`. Quand une notification echoue, elle casse tout le flux (la navigation ne se fait pas, les actions suivantes ne s'executent pas).

Les endroits sans protection :
1. **DemandeAccepter.tsx** - `handleRefuse` : pas de try/catch
2. **ConfirmAnnulation.tsx** - `handleConfirm` : pas de try/catch (toute la chaine d'actions plante si la notification echoue)
3. **use-demandes.ts** - `acceptDemande` : insertion directe de notification via `supabase.from("notifications").insert(...)` sans try/catch (ligne 106)

## Modifications prevues

### 1. DemandeAccepter.tsx - Proteger handleRefuse
Entourer l'appel `createNotification` dans `handleRefuse` avec un try/catch, et s'assurer que `navigate("/trajets")` s'execute toujours.

### 2. ConfirmAnnulation.tsx - Proteger handleConfirm
Entourer l'appel `createNotification` avec un try/catch pour que le reste du flux (close conversation, system message, ratings, complete demande) s'execute meme si la notification echoue.

### 3. use-demandes.ts - Proteger acceptDemande
Entourer l'insertion directe de notification (lignes 106-116, dans la boucle `for...of otherPending`) avec un try/catch pour eviter que le retrait automatique des autres demandes soit bloque.

### 4. Verifier la politique RLS notifications
La migration precedente a deja corrige la politique INSERT en PERMISSIVE avec `WITH CHECK (true)`. La base de donnees confirme que la politique est correcte. Aucune modification de base necessaire.

## Details techniques

Chaque modification suit le meme pattern :

```typescript
try {
  await createNotification({ ... });
} catch (e) {
  console.error("Erreur notification:", e);
}
```

Cela permet de :
- Ne jamais bloquer le flux utilisateur a cause d'une notification
- Logger l'erreur pour le debug
- Garantir que la navigation et les actions suivantes s'executent toujours

