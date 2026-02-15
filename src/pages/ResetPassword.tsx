import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Le mot de passe doit comporter au moins 8 caractères dont 1 lettre, 1 chiffre et 1 caractère spécial.");
      return;
    }
    if (!confirm) {
      setError("Veuillez confirmer votre mot de passe.");
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
      <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
        <div className="px-4">
          <button onClick={() => navigate("/connexion")} className="text-heading">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex justify-center px-4">
          <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Mot de passe modifié.</h1>
        </div>

        <div className="flex justify-center px-4">
          <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous allez être redirigé vers la page de connexion.
              </p>
            </CardContent>
            <Button
              className="w-full rounded-none h-auto py-4"
              onClick={() => navigate("/connexion")}
            >
              Retour à la connexion
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  if (!sessionReady) {
    return (
      <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
        <div className="px-4">
          <button onClick={() => navigate("/forgot-password")} className="text-heading">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex justify-center px-4">
          <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Lien expiré.</h1>
        </div>

        <div className="flex justify-center px-4">
          <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ce lien est invalide ou a expiré. Veuillez refaire une demande.
              </p>
            </CardContent>
            <Button
              className="w-full rounded-none h-auto py-4"
              onClick={() => navigate("/forgot-password")}
            >
              Mot de passe oublié
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="px-4">
        <button onClick={() => navigate("/connexion")} className="text-heading">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Nouveau mot de passe.</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col">
            <div className="px-4 py-3 flex items-center gap-2">
              <p className="text-sm text-muted-foreground flex-1">
                Choisissez un nouveau mot de passe (8 caractères min.)
              </p>
              <Popover>
                <PopoverTrigger type="button" className="flex items-center justify-center w-5 h-5 rounded-full border border-muted-foreground text-muted-foreground text-xs font-medium shrink-0">
                  ?
                </PopoverTrigger>
                <PopoverContent side="left" className="max-w-[220px] text-xs p-3">
                  Le mot de passe doit comporter au moins 8 caractères dont 1 lettre, 1 chiffre et 1 caractère spécial.
                </PopoverContent>
              </Popover>
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
    </section>
  );
};

export default ResetPassword;
