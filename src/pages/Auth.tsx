import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import erLogo from "@/assets/logo-tarmac.png";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate("/trajets", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <img src={erLogo} alt="Logo" className="h-36 w-auto -mt-16" />
        <h1 className="text-2xl font-semibold text-foreground text-center">Votre trajet commence ici.</h1>
        <p className="text-base text-white text-center">Trouvez votre partenaire de route en un clic.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 pb-8">
        <Button
          className="w-full h-auto py-4 rounded-full"
          onClick={() => navigate("/inscription")}
        >
          S'inscrire sur Tarmac
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-4 rounded-full"
          onClick={() => navigate("/connexion")}
        >
          J'ai déjà un compte
        </Button>
      </div>
    </div>
  );
};

export default Auth;
