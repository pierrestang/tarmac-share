
## Sélecteur de date plein écran dans /publier

### Objectif
Remplacer le Popover + Calendar compact par un écran plein écran style "Quand partez-vous ?" inspiré de la capture, adapté à la palette de l'app (beige `#F0EEE9`, bleu-gris `#4E657A`, fond bleu `#89B1D6`).

### Ce que ça donne visuellement

```text
┌────────────────────────────────────┐
│  ×                                 │
│                                    │
│  Quand partez-vous ?               │  ← titre bold, beige
│                                    │
│  février                           │  ← nom du mois, bold
│                                    │
│   1   2   3   4   5   6   7        │  ← pas d'en-têtes lun/mar/...
│   8   9  10  11  12  13  14        │
│  15  16  17  [18] 19  20  21       │  ← jour sélectionné = cercle plein
│  22  23  24  25  26  27  28        │
│                                    │
│  mars                              │
│   ...                              │
└────────────────────────────────────┘
```

- Fond : couleur `background` de l'app (`#89B1D6`, bleu doux)
- Texte titre + mois : couleur `heading` (`#F0EEE9`, beige)
- Jours : texte beige `#F0EEE9`, taille normale
- Jour sélectionné : cercle plein bleu-gris `#4E657A` (= `primary`), texte blanc
- Aujourd'hui (non sélectionné) : cercle fin en contour beige
- Bouton × : icône beige en haut à gauche
- Pas d'en-têtes de jours (lun., mar., etc.) — supprimés
- Calendrier scrollable sur 12 mois (mois courant + 11 suivants)
- Sélection d'un jour → fermeture automatique de l'écran

### Ce qui change dans `src/pages/Publier.tsx`

**Supprimé :**
- Le `<Popover open={datePopoverOpen}>` + `<Calendar>` existant pour la date
- `datePopoverOpen` state

**Ajouté :**
- `dateSheetOpen` state (boolean) pour contrôler le Sheet
- Import de `Sheet`, `SheetContent`, `SheetClose` depuis `@/components/ui/sheet`
- Import de `X` depuis `lucide-react`
- Une fonction `buildMonths(count: number)` qui génère `count` mois depuis le mois courant (tableau de `Date`)
- Une fonction `buildDaysGrid(year, month)` qui retourne le tableau de jours du mois avec le décalage lundi-en-premier (cellules vides pour l'offset)
- Le `<Sheet>` plein écran avec :
  - `side="bottom"` + `className="h-[100dvh] p-0 bg-background border-0"` → plein écran, fond bleu de l'app
  - Bouton × en haut à gauche (beige)
  - Titre "Quand partez-vous ?" en bold beige
  - Zone scrollable avec les 12 mois
  - Pour chaque mois : nom du mois en bold beige + grille 7 colonnes des jours (sans en-têtes de semaine)

**Conservé :**
- Le trigger visuel identique (icône CalendarIcon + texte formaté `formatDateShort`)
- La valeur stockée en format `dd/MM/yyyy`
- Toute la logique du reste du formulaire

### Palette de couleurs appliquée

| Élément | Couleur |
|---|---|
| Fond Sheet | `bg-background` = `#89B1D6` bleu doux |
| Titre + mois | `text-heading` = `#F0EEE9` beige |
| Jours normaux | `text-foreground` = `#F0EEE9` beige, opacité 80% |
| Jour sélectionné | `bg-primary text-primary-foreground` = `#4E657A` fond, blanc texte |
| Aujourd'hui | cercle avec `border border-foreground/50` |
| Bouton × | `text-foreground` = `#F0EEE9` |

### Fichier modifié
- **`src/pages/Publier.tsx`** uniquement
