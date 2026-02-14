

## Restructuration de l'authentification

### Contexte
La page `/auth` actuelle contient un systeme d'onglets (Connexion / Inscription) dans une seule page. L'objectif est de la remplacer par 3 pages distinctes, et de renommer le titre de `/compte`.

**Note :** Je suppose que "S'inscrire sur EnRoute" doit rediriger vers `/inscription` et "J'ai deja un compte" vers `/connexion` (l'inverse de ce qui etait ecrit, car c'est la logique attendue).

---

### Changements prevus

**1. Page `/auth` -- Page d'accueil simplifiee**
- Garder le logo EnRoute en haut
- Afficher uniquement deux boutons :
  - "S'inscrire sur EnRoute" -> redirige vers `/inscription`
  - "J'ai deja un compte" -> redirige vers `/connexion`
- Supprimer les formulaires et onglets actuels

**2. Nouvelle page `/connexion`**
- Style similaire a `/compte` : Card sans bordure, champs avec separateurs horizontaux, pas de bordures sur les inputs
- Champs : Email, Mot de passe
- Bouton "Se connecter" en bas de la Card (pleine largeur, colle au bas)
- Lien retour vers `/auth`

**3. Nouvelle page `/inscription`**
- Meme style que `/connexion`
- Champs : Prenom, Nom, Email, Mot de passe
- Bouton "Creer mon compte" en bas de la Card
- Lien retour vers `/auth`
- Ecran de confirmation email apres inscription reussie

**4. Page `/compte` -- Changement de titre**
- Remplacer "Mon profil." par "Mon compte"

---

### Details techniques

- **Fichiers crees :**
  - `src/pages/Connexion.tsx` -- formulaire de connexion
  - `src/pages/Inscription.tsx` -- formulaire d'inscription

- **Fichiers modifies :**
  - `src/pages/Auth.tsx` -- simplifie en page d'accueil avec 2 boutons
  - `src/pages/Compte.tsx` -- titre change en "Mon compte"
  - `src/App.tsx` -- ajout des routes `/connexion` et `/inscription`

- **Style des formulaires :** reprend le pattern de `/compte` avec Card sans bordure, inputs transparents sans bordure avec separateurs `h-px bg-border mx-4`, et bouton d'action pleine largeur en bas de la Card.

