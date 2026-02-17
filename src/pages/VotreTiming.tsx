import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const VotreTiming = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: "#A291A9" }}>
    <section
      className="flex flex-col flex-1 px-3 pt-6 pb-6"
      style={{ minHeight: "100dvh" }}
    >
      <div className="flex flex-col gap-2 items-center pb-4">
        <div className="w-full max-w-[42rem] px-4">
          <button onClick={() => navigate("/publier")} className="p-1 self-start">
            <ArrowLeft className="h-6 w-6" style={{ color: "#F0EEE9" }} />
          </button>
          <h1
            className="text-[24px] font-semibold"
            style={{ color: "#F0EEE9" }}
          >
            Votre timing après l'atterrissage.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: "#3D2B3D" }}>
            <p className="text-[18px] font-semibold mb-2">Temps de transit estimé</p>
            <p>
              Estimez votre heure de sortie pour que votre partenaire ne vous attende pas trop longtemps à l'arrivée.
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              <li><strong>UE + Bagage cabine :</strong> ± 20 min</li>
              <li><strong>UE + Bagage en soute :</strong> ± 40 min</li>
              <li><strong>Internationale + Bagage cabine :</strong> ± 45 min</li>
              <li><strong>Internationale + Bagage en soute :</strong> ± 60 min</li>
            </ul>
            <p className="mt-3 italic text-[13px]">Petit conseil : Mieux vaut prévoir 5 min de plus pour trouver le point de rencontre !</p>
          </CardContent>
        </Card>
      </div>
    </section>
    </div>
  );
};

export default VotreTiming;
