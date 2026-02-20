
## Optimisation de la sélection de date dans /publier pour mobile

### Problème actuel
La saisie de la date se fait via un champ texte (`Input` type `text` avec `inputMode="numeric"`) en format `JJ MM`. Sur mobile, le clavier numérique s'ouvre mais la saisie manuelle reste peu ergonomique. L'objectif est d'offrir un vrai sélecteur de date mobile-friendly, tout en **conservant exactement le même look visuel** dans la carte.

### Solution : Popover + Calendar Shadcn
Remplacer la logique `isEditingDate` / `Input` texte par un `Popover` contenant le composant `Calendar` Shadcn (déjà utilisé dans le projet). Le trigger du Popover sera le même `div` avec la date formatée qui existe déjà — l'apparence dans la carte ne change pas du tout.

### Ce qui change
- **Suppression** : `isEditingDate`, `dateInput`, `dateInputRef`, `Input` de date, les fonctions `formatDateInput`, `storageDateToInputFormat`, `isDateInputComplete`
- **Ajout** : state `selectedDate: Date | undefined`, Popover + Calendar pour la sélection
- **Conservation** : La même ligne visuelle avec `CalendarIcon` + texte formaté (ex: "Ven. 20 févr.")

### Fonctionnement
1. L'utilisateur clique sur la ligne de date → Popover s'ouvre avec le `Calendar`
2. Il sélectionne un jour → la date est convertie au format de stockage `dd/MM/yyyy` et sauvegardée dans `form.date`
3. Le Popover se ferme automatiquement après sélection
4. Le calendrier s'ouvre sur le mois de la date actuellement sélectionnée
5. Les dates passées ne sont pas désactivées (un trajet peut être modifié pour une date passée lors d'édition)

### Fichiers à modifier
- **`src/pages/Publier.tsx`** : Remplacer toute la logique de date (states, Input, logique conditionnelle) par un Popover + Calendar

### Comportement visuel garanti
La carte garde exactement :
```
[ 📅  Ven. 20 févr. ]   ← cliquable, ouvre le calendrier en Popover
```
Aucun changement de layout, padding, séparateurs ou style de la carte.

### Détails techniques
- Utiliser `format(date, "dd/MM/yyyy")` pour le stockage
- Utiliser `formatDateShort(date)` existant pour l'affichage
- Utiliser `parse(form.date, "dd/MM/yyyy", new Date())` pour initialiser la date sélectionnée dans Calendar
- Ajouter `className={cn("p-3 pointer-events-auto")}` sur le `Calendar` (requis dans les Popovers)
- Le Popover doit avoir `align="start"` pour l'alignement mobile
- Importer `Calendar` depuis `@/components/ui/calendar`
- Importer `fr` de `date-fns/locale` pour le calendrier en français
