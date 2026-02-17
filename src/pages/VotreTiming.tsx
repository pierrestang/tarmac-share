import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const VotreTiming = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6 min-h-screen">
      <div className="flex flex-col gap-2 px-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start focus:outline-none focus-visible:outline-none">
          <ArrowLeft className="h-6 w-6 text-heading" />
        </button>
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Votre timing après l'atterrissage.
        </h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md shadow-none">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: '#3D2B3D' }}>
            <p className="text-[18px] font-semibold mb-3">Temps de transit estimé</p>
            <p className="mb-3">
              Estimez votre heure de sortie pour que votre partenaire ne vous attende pas sur le tarmac. Nos repères chrono (après l'atterrissage) :
            </p>
            <p className="mb-1"><strong>UE + Cabine</strong> : ~20 min</p>
            <p className="mb-1"><strong>UE + Bagage</strong> : ~35–45 min</p>
            <p className="mb-1"><strong>Inter + Cabine</strong> : ~40–50 min</p>
            <p className="mb-1"><strong>Inter + Bagage</strong> : ~60 min</p>
            <p className="mt-3 italic">
              "Mieux vaut prévoir 5 minutes de plus que 5 minutes de moins !"
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VotreTiming;
