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
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-white mb-8">Tarmac</h1>
        <h2 className="text-2xl font-semibold text-foreground text-justify">Votre trajet commence ici.</h2>
        <p className="text-white mt-4 text-justify text-sm">Divisez vos frais dès la sortie de l'avion.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 pb-8">
        <Button
          className="w-full h-auto py-4 rounded-full"
          onClick={() => navigate("/inscription")}>

          S'inscrire sur Tarmac
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-4 rounded-full"
          onClick={() => navigate("/connexion")}>

          J'ai déjà un compte
        </Button>
      </div>
    </div>);

};

export default Auth;