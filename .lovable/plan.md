

## Fix: Cancellation misclassified as "Non realise"

### Root Cause

When a user cancels via "Je dois annuler" (ConfirmAnnulation.tsx), the code saves two `conversation_ratings` with `was_useful: false`. This creates negative ratings in the database.

In the edge function `get-admin-stats`, the logic is:
1. **Annulations** = completed + `was_cancelled=true` + NOT in `negativeDemandeIds`
2. **Non realises** = completed + in `negativeDemandeIds`

Since the cancellation flow creates negative ratings, the demande ends up in `negativeDemandeIds`, so it gets excluded from "Annulations" and counted as "Non realises" instead.

### Solution

Update the edge function logic to prioritize `was_cancelled`. If a demande has `was_cancelled=true`, it should always count as an "Annulation", regardless of whether negative ratings exist.

### Changes

**File: `supabase/functions/get-admin-stats/index.ts`**

Update the filters:
- **Annulations**: `status === "completed"` AND `was_cancelled === true` (remove the `!negativeDemandeIds` check)
- **Non realises**: `status === "completed"` AND in `negativeDemandeIds` AND `was_cancelled !== true` (exclude cancellations)

```
// Before (current - broken)
annulations = completed + was_cancelled + !negativeDemandeIds  --> misses cases with both
nonRealises = completed + negativeDemandeIds                   --> catches cancellations too

// After (fixed)
annulations = completed + was_cancelled                        --> all cancellations
nonRealises = completed + negativeDemandeIds + !was_cancelled  --> only pure negative evals
```

This ensures cancellations always take priority over negative ratings.
