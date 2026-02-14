import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import erLogo from "@/assets/er.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always show success to not reveal if email exists
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />
        <Card className="w-full max-w-sm border-0">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <Mail size={40} className="text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Vérifiez votre boîte mail</h2>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => navigate("/connexion")}
            >
              Retour à la connexion
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <button
        onClick={() => navigate("/connexion")}
        className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <img src={erLogo} alt="Logo" className="mb-8 h-12 w-auto" />

      <div className="flex justify-center w-full">
        <Card className="w-full max-w-sm border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
