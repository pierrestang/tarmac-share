import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import erLogo from "@/assets/logo-tarmac.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase sets session from the recovery link hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if already in a session (e.g. page refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Le mot de passe doit comporter au moins 8 caractères dont 1 lettre, 1 chiffre et 1 caractère spécial.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/connexion", { replace: true }), 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />
        <Card className="w-full max-w-sm border-0">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <CheckCircle size={40} className="text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Mot de passe modifié</h2>
            <p className="text-sm text-muted-foreground">
              Vous allez être redirigé vers la page de connexion.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />
        <Card className="w-full max-w-sm border-0">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Lien invalide ou expiré. Veuillez refaire une demande.
            </p>
            <Button variant="outline" onClick={() => navigate("/forgot-password")}>
              Mot de passe oublié
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />

      <div className="flex justify-center w-full">
        <Card className="w-full max-w-sm border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Choisissez un nouveau mot de passe (8 caractères min.)
              </p>
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            {error && (
              <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground text-sm text-center py-3 px-4 z-50">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
