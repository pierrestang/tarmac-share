import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, X } from "lucide-react";

const Connexion = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      navigate("/comment-ca-marche", { replace: true });
    }
    setLoading(false);
  };

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="px-4">
        <button onClick={() => navigate("/auth")} className="text-heading">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Connectez-vous.</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <form onSubmit={handleLogin} className="flex flex-col">
            <div className="px-4 py-4 flex items-center gap-2">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] font-semibold text-card-foreground placeholder:text-muted-foreground placeholder:font-semibold focus-visible:ring-0 flex-1"
              />
              {email && (
                <button type="button" onClick={() => setEmail("")} className="text-muted-foreground">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4 flex items-center gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] font-semibold text-card-foreground placeholder:text-muted-foreground placeholder:font-semibold focus-visible:ring-0 flex-1"
              />
              {password && (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>

            {error && (
              <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
            )}

          </form>
        </Card>
      </div>

      <div className="flex justify-center px-4">
        <Button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full max-w-[42rem] rounded-md h-auto py-4 disabled:opacity-100 border-0"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="text-sm text-foreground font-semibold"
      >
        Mot de passe oublié ?
      </button>

    </section>
  );
};

export default Connexion;
