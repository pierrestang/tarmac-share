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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img src={erLogo} alt="Logo" className="mb-12 h-12 w-auto" />

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button
          className="w-full h-auto py-4"
          onClick={() => navigate("/inscription")}
        >
          S'inscrire sur EnRoute
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-4"
          onClick={() => navigate("/connexion")}
        >
          J'ai déjà un compte
        </Button>
      </div>
    </div>
  );
};

export default Auth;
