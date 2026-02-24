

## Plan : Barre de saisie stylisee et menu trois points

### Changements visuels

**1. Barre de saisie "Ecrire un message"**
- Appliquer un fond `#4E657A` et un texte `#F0EEE9` a l'input de saisie
- Le placeholder sera egalement en `#F0EEE9` avec une opacite reduite pour rester lisible

**2. Menu trois points en haut a droite du header**
- Ajouter une icone `MoreVertical` (lucide-react) a droite du header de la conversation, a cote du prenom
- Au clic, ouvrir un `DropdownMenu` (composant deja disponible dans le projet) avec deux options :
  - "Je dois annuler" -- declenche le dialogue de confirmation d'annulation
  - "Le trajet a-t-il eu lieu ?" -- appelle `onCloseConversation`
- Ces deux options ne seront visibles que si la conversation n'est pas cloturee (`!isFullyClosed && !isClosedByUser`)

**3. Retrait des boutons du bas**
- Supprimer les boutons "Je dois annuler" et "Le trajet a-t-il eu lieu ?" de la zone sous le champ de saisie
- Seuls le champ de saisie et le bouton d'envoi resteront en bas de l'ecran

### Details techniques

Fichier modifie : `src/components/ChatView.tsx`

- Import de `MoreVertical` depuis `lucide-react`
- Import de `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` depuis `@/components/ui/dropdown-menu`
- Dans le header, ajouter le bouton trois points et le dropdown menu
- Appliquer `style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}` sur le composant `Input`
- Ajouter une classe CSS pour le placeholder en `#F0EEE9` avec opacite (via une classe Tailwind inline ou un style global)
- Supprimer le bloc "Cancel + Close buttons" (lignes 197-215) de la zone input

