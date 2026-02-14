import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import erLogo from "@/assets/er.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Connexion = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/trajets", { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );
    } else {
      navigate("/publier", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <button
        onClick={() => navigate("/auth")}
        className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />

      <div className="flex justify-center w-full">
        <Card className="w-full max-w-sm border-0 rounded-md overflow-hidden">
          <form onSubmit={handleLogin} className="flex flex-col">
            <div className="px-4 py-4">
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="px-4 pb-2">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-muted-foreground underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Connexion;
