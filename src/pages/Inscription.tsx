import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

const Inscription = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  if (user) {
    navigate("/trajets", { replace: true });
    return null;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Le prénom et le nom doivent contenir au moins 2 caractères.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, firstName.trim(), lastName.trim());
    if (error) {
      setError(error.message);
    } else {
      setConfirmationSent(true);
    }
    setLoading(false);
  };

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-0">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <Mail size={40} className="text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Vérifiez votre boîte mail</h2>
            <p className="text-sm text-muted-foreground">
              Un email de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => navigate("/connexion")}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Inscription.</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSignUp} className="flex flex-col">
            <div className="px-4 py-4">
              <Input
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

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
                placeholder="Mot de passe (6 caractères min.)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            {error && (
              <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>
        </Card>
      </div>

      <button
        onClick={() => navigate("/auth")}
        className="flex items-center justify-center gap-1 text-sm text-white/70"
      >
        <ArrowLeft size={16} />
        Retour
      </button>
    </section>
  );
};

export default Inscription;
