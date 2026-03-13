import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ScoreDeMatching = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: "#5170F6" }}>
    <section
      className="flex flex-col flex-1 px-3 pt-6 pb-6"
      style={{ minHeight: "100dvh" }}
    >
      <div className="flex flex-col gap-3 items-center px-4 pb-4">
        <div className="w-full max-w-[42rem] flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="p-1 self-start">
            <ArrowLeft className="h-6 w-6" style={{ color: "#FFFFFF" }} />
          </button>
          <h1
            className="text-[24px] font-semibold"
            style={{ color: "#FFFFFF" }}
          >
            Le score de matching.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: "#5170F6" }}>
            <p className="text-[14px] font-semibold mb-2">Comment calculons-nous votre compatibilité ?</p>
            <p>
              Pour vous garantir un trajet fluide et économique, Tarmac analyse chaque demande en temps réel afin d'établir un score de compatibilité sur 100 points, basé sur deux piliers essentiels :
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              <li>
                <strong>Le timing (50 pts) :</strong> Plus vos créneaux horaires sont proches, plus le score est élevé. Un créneau identique donne le maximum de points, tandis qu'un décalage de plus de 60 minutes exclut le match.
              </li>
              <li>
                <strong>Le détour (50 pts) :</strong> Nous calculons le détour en minutes que chaque passager devra effectuer pour un trajet partagé. Moins le détour est long, plus le score est élevé. Au-delà de 15 minutes de détour, le match est exclu.
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
