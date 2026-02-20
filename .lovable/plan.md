
## Optimisation de la sélection du créneau horaire — tous les créneaux conservés

### Objectif
Remplacer la liste scrollable de 48 créneaux par une interface en 2 étapes plus ergonomique sur mobile, **en conservant tous les créneaux de 00:00 à 23:30**.

### Interface en 2 étapes

**Étape 1 — Grille des heures (00h à 23h)**
24 boutons d'heures affichés en grille compacte `grid-cols-6`, soit 4 lignes de 6 boutons. Faciles à toucher sur mobile.

```text
┌─────────────────────────────────────┐
│  00  01  02  03  04  05             │
│  06  07  08  09  10  11             │
│  12  13  14  15  16  17             │
│  18  19  20  21  22  23             │
└─────────────────────────────────────┘
```

**Étape 2 — Choix de la demi-heure**
Après avoir tapé une heure, 2 grands boutons côte à côte apparaissent :

```text
┌──────────────────────────────────────┐
│  ← 10h                               │
│  ┌───────────────┐ ┌───────────────┐ │
│  │  10:00–10:30  │ │  10:30–11:00  │ │
│  └───────────────┘ └───────────────┘ │
└──────────────────────────────────────┘
```

Après la sélection, le créneau est enregistré et le Popover se ferme automatiquement.

### Ce qui change dans `src/pages/Publier.tsx`

- **Ajout** d'un state `selectedHour: number | null` et `timePopoverOpen: boolean`
- **Remplacement** du contenu du `PopoverContent` du sélecteur d'heure (la liste `timeSlots.map(...)` de 48 lignes) par la grille 2 étapes
- **Conservation** : le `useMemo timeSlots` peut être retiré puisque les créneaux sont générés à la volée lors de l'étape 2 (format `"HH:MM-HH:MM"`), le trigger visuel (`Clock` + texte), le bouton `HelpCircle`, et la valeur stockée en format `"HH:MM-HH:MM"`
- **Reset** : `selectedHour` est remis à `null` à la fermeture du Popover (`onOpenChange`)

### Comportement de l'heure sélectionnée actuellement
- L'heure correspondant au créneau actuel est mise en surbrillance dans la grille (ex: si `form.departureTime === "10:00-10:30"`, le bouton `10` est actif)

### Fichier à modifier
- **`src/pages/Publier.tsx`** uniquement
