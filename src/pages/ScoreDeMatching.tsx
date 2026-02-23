import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ScoreDeMatching = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: "#A291A9" }}>
    <section
      className="flex flex-col flex-1 px-3 pt-6 pb-6"
      style={{ minHeight: "100dvh" }}
    >
      <div className="flex flex-col gap-3 items-center px-4 pb-4">
        <div className="w-full max-w-[42rem] flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="p-1 self-start">
            <ArrowLeft className="h-6 w-6" style={{ color: "#F0EEE9" }} />
          </button>
          <h1
            className="text-[24px] font-semibold"
            style={{ color: "#F0EEE9" }}
          >
            Le Score de Matching.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: "#3D2B3D" }}>
            <p className="text-[18px] font-semibold mb-2">Comment calculons-nous votre compatibilité ?</p>
            <p>
              Pour garantir un trajet fluide et économique, Tarmac analyse chaque demande en temps réel. Notre algorithme calcule un score de compatibilité sur 100 points basé sur deux piliers essentiels :
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              <li>
                <strong>Le Timing (50 pts) :</strong> La ponctualité est notre priorité. Plus vos horaires d'arrivée sont proches, plus le score grimpe. Un créneau identique vous offre le maximum de points.
              </li>
              <li>
                <strong>La Proximité (50 pts) :</strong> Nous calculons la distance routière réelle via Google Maps. L'objectif est de minimiser votre détour : le score est optimal si vos destinations sont à moins d'1 km l'une de l'autre.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
    </div>
  );
};

export default ScoreDeMatching;
