

## Ajouter l'authentification par email/mot de passe

### Objectif
Creer une page de connexion (email + mot de passe) et d'inscription avec envoi d'un mail de confirmation. Les utilisateurs non connectes seront rediriges vers cette page.

### Ce qui change

**1. Migration base de donnees**

- Ajouter une colonne `user_id` (uuid, reference vers `auth.users`) a la table `profiles`
- Creer un trigger qui cree automatiquement un profil vide a l'inscription
- Mettre a jour les policies RLS sur toutes les tables pour restreindre l'acces aux utilisateurs authentifies (chaque utilisateur ne voit/modifie que ses propres donnees)

**2. Nouvelle page `/auth`**

Une page avec deux onglets :
- **Connexion** : champs email + mot de passe + bouton "Se connecter"
- **Inscription** : champs prenom, nom, email, mot de passe + bouton "Creer mon compte"
- Message de confirmation affiche apres inscription ("Verifiez votre boite mail")
- Design coherent avec le style existant de l'application (cards, boutons arrondis)

**3. Protection des routes**

- Creer un composant `ProtectedRoute` qui verifie la session utilisateur
- Rediriger vers `/auth` si l'utilisateur n'est pas connecte
- La page `/auth` redirige vers `/trajets` si deja connecte

**4. Adaptation des hooks existants**

- `use-profiles.ts` : le profil actif sera celui de l'utilisateur connecte (plus besoin de localStorage pour le profil actif)
- Les autres hooks (`use-trajets`, `use-demandes`, etc.) continueront de fonctionner car ils utilisent deja le `profile_id` -- la difference sera que les policies RLS filtreront cote serveur

**5. Mise a jour du header et de la page Compte**

- Le header affichera un bouton "Deconnexion" au lieu du menu actuel
- La page Compte sera simplifiee : modification du profil de l'utilisateur connecte uniquement (plus de multi-comptes)

### Details techniques

**Migration SQL prevue :**

```text
-- Ajouter user_id a profiles
ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX profiles_user_id_idx ON profiles(user_id);

-- Trigger auto-creation profil
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, created_at)
  VALUES (gen_random_uuid(), NEW.id, '', '', extract(epoch from now()) * 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies mises a jour (exemple pour profiles)
DROP POLICY IF EXISTS "Allow all select" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
-- (idem pour les autres tables, filtrees par profile_id -> user_id)
```

**Nouveaux fichiers :**
- `src/pages/Auth.tsx` -- page connexion/inscription
- `src/components/ProtectedRoute.tsx` -- garde de route
- `src/hooks/use-auth.ts` -- hook pour gerer la session (login, signup, logout, session state)

**Fichiers modifies :**
- `src/App.tsx` -- ajout route `/auth` + protection des routes
- `src/hooks/use-profiles.ts` -- profil actif = profil de l'utilisateur connecte
- `src/components/layout/TopHeader.tsx` -- bouton deconnexion
- `src/pages/Compte.tsx` -- simplification (un seul profil)
