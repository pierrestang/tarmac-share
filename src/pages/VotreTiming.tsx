import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VotreTiming = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6 min-h-screen" style={{ backgroundColor: '#A291A9' }}>
      <div className="flex flex-col gap-2 px-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start">
          <ArrowLeft className="h-6 w-6 text-heading" />
        </button>
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Votre timing après l'atterrissage
        </h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: '#3D2B3D' }}>
            <p className="text-[18px] font-semibold mb-3">Temps de transit estimé</p>
            <p className="mb-3">
              Estimez votre heure de sortie pour que votre partenaire ne vous attende pas sur le tarmac. Nos repères chrono (après l'atterrissage) :
            </p>
            <p>🇪🇺 UE + Cabine : ~20 min (en mode express)</p>
            <p>🧳 UE + Bagage : ~35–45 min (le temps du tapis)</p>
            <p>🌍 Inter + Cabine : ~40–50 min (passage douane inclus)</p>
            <p>🛂 Inter + Bagage : ~60 min (la totale !)</p>
            <p className="mt-3 italic">
              "Mieux vaut prévoir 5 minutes de plus que 5 minutes de moins !"
            </p>
          </CardContent>
        </Card>

        <Button
          className="w-full max-w-[42rem] rounded-full h-auto py-4 mt-2"
          style={{ backgroundColor: '#3D2B3D', color: '#F0EEE9' }}
          onClick={() => navigate(-1)}
        >
          Compris !
        </Button>
      </div>
    </section>
  );
};

export default VotreTiming;
