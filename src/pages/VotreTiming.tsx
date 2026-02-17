import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const VotreTiming = () => {
  const navigate = useNavigate();

  return (
    <section
      className="flex flex-col flex-1 min-h-screen px-3 pt-6 pb-6"
      style={{ backgroundColor: "#A291A9" }}
    >
      <div className="flex flex-col gap-2 px-4 pb-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start">
          <ArrowLeft className="h-6 w-6" style={{ color: "#F0EEE9" }} />
        </button>
        <h1
          className="text-[22px] font-semibold"
          style={{ color: "#F0EEE9" }}
        >
          Votre timing.
        </h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: "#3D2B3D" }}>
            <p className="text-[18px] font-semibold mb-2">Temps de transit estimé</p>
            <p>
              Estimez votre heure de sortie pour que votre partenaire ne vous attende pas sur le tarmac. Nos repères chrono (après l'atterrissage) :
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              <li><strong>UE + Cabine :</strong> ± 20 min</li>
              <li><strong>UE + Bagage :</strong> ± 40 min</li>
              <li><strong>Inter + Cabine :</strong> ± 45 min</li>
              <li><strong>Inter + Bagage :</strong> ± 60 min</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VotreTiming;
