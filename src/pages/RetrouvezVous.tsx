import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const RetrouvezVous = () => {
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
            Retrouvez-vous.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: "#3D2B3D" }}>
            <p className="text-[18px] font-semibold mb-2">Comment se reconnaître au point de rendez-vous ?</p>
            <p>
              Pas d'inquiétude, Tarmac favorise votre rencontre. Une fois sur place :
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              <li>
                <strong>1️⃣ Signalez votre présence</strong><br />
                Appuyez sur le bouton "Je suis arrivé au point de rencontre".
              </li>
              <li>
                <strong>2️⃣ Générez votre code</strong><br />
                Dès que vous et votre partenaire avez confirmé votre arrivée, le bouton "Afficher le code" apparaît automatiquement.
              </li>
              <li>
                <strong>3️⃣ Comparez vos écrans</strong><br />
                Le même code s'affiche sur vos deux téléphones. Si les codes correspondent, vous avez trouvé votre partenaire !
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
    </div>
  );
};

export default RetrouvezVous;
