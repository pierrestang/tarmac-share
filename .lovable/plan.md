
## Fix: Negative evaluation (thumbs down) not tracked correctly

### Problem
When a user answers "thumbs down" to "Le trajet a-t-il eu lieu ?", two things go wrong:

1. The Evaluation page sets `was_cancelled = true` on the demande -- but this flag should only be set when someone cancels via "Je dois annuler"
2. The Evaluation page never saves a `conversation_rating` record with `was_useful: false`, so the stats edge function has no way to detect the negative evaluation

Result: the demande gets counted as an "Annulation" instead of "Non realise (hors annules)".

### Solution

**File: `src/pages/Evaluation.tsx`**

Two changes in the `handleAnswer` function:

1. **Remove** the block that sets `was_cancelled: true` when the user answers negatively. This line should be deleted:
   ```
   if (!wasUseful) {
     await supabase.from("demandes").update({ was_cancelled: true }).eq("id", convRow.demande_id);
   }
   ```

2. **Add** a call to `saveRating` to persist the evaluation in the `conversation_ratings` table. After closing the conversation, save a rating record with `wasUseful` set to the user's answer (true for thumbs up, false for thumbs down).

This way:
- Thumbs down creates a `conversation_rating` with `was_useful: false` (detected by the stats function as "Non realise")
- `was_cancelled` stays `false` (only set by the cancellation flow in ConfirmAnnulation)
- The stats will correctly show 0 Annulations and 1 Non realise

### Data fix
The existing demande in the database currently has `was_cancelled = true` from the previous incorrect behavior. It will need to be corrected manually or via a one-time update if accurate historical stats are needed.
