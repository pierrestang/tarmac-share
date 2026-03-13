import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
        <div className="px-4">
          <button onClick={() => navigate("/connexion")} className="text-heading">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex justify-center px-4">
          <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Vérifiez votre boîte mail.</h1>
        </div>

        <div className="flex justify-center px-4">
          <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.
              </p>
            </CardContent>
            <Button
              className="w-full h-auto py-4 rounded-none rounded-b-md"
              onClick={() => navigate("/connexion")}
            >
              Retour à la connexion
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
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Mot de passe oublié.</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col">
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
                className="border-0 h-auto p-0 bg-transparent text-[14px] font-semibold text-card-foreground placeholder:text-muted-foreground placeholder:font-semibold focus-visible:ring-0"
              />
            </div>

          </form>
        </Card>
      </div>

      <div className="flex justify-center px-4">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full max-w-[42rem] rounded-md h-auto py-4 disabled:opacity-100 border-0"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </Button>
      </div>
    </section>
  );
};

export default ForgotPassword;
