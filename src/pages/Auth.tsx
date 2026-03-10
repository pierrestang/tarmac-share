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
    <div className="flex min-h-[100dvh] flex-col items-center justify-between bg-background px-4 pb-6 pt-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <h1 className="text-5xl font-bold mb-4 w-full text-left" style={{ color: "#F0EEE9" }}>Tarmac</h1>
        <h2 className="text-2xl font-semibold text-left w-full" style={{ color: "#F0EEE9" }}>Votre trajet depuis l'aéroport, à moitié prix.</h2>
        <p className="text-base text-left mt-4 w-full" style={{ color: "#F0EEE9" }}>Ne payez plus le prix fort : trouvez un partenaire de route sur <span className="font-bold">Tarmac</span> et partagez les frais vers la ville.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 pb-4">
        <Button
          className="w-full h-auto py-4"
          onClick={() => navigate("/inscription")}>
          S'inscrire sur Tarmac
        </Button>
        <Button
          variant="outline"
          className="w-full h-auto py-4"
          onClick={() => navigate("/connexion")}>
          J'ai déjà un compte
        </Button>
      </div>
    </div>);

};

export default Auth;