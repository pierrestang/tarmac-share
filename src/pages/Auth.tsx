import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import erLogo from "@/assets/er.png";
import { Card } from "@/components/ui/card";

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

      <div className="flex justify-center w-full">
        <Card className="w-full max-w-sm border-0 rounded-md overflow-hidden">
          <div className="flex flex-col">
            <button
              onClick={() => navigate("/inscription")}
              className="px-4 py-4 text-[14px] font-semibold text-card-foreground text-left"
            >
              S'inscrire sur EnRoute
            </button>

            <div className="h-px bg-border mx-4" />

            <button
              onClick={() => navigate("/connexion")}
              className="px-4 py-4 text-[14px] font-semibold text-card-foreground text-left"
            >
              J'ai déjà un compte
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
