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
            Comment se retrouver ?
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed flex flex-col gap-2" style={{ color: "#3D2B3D" }}>
            <div>
              <p className="font-semibold mb-1">1. Rejoignez le lieu de rencontre</p>
              <p>Dirigez-vous vers le point recommandé ou celui convenu lors de vos échanges.</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold mb-1">2. Signalez votre présence</p>
              <p>Une fois sur place, appuyez sur le bouton "Je suis arrivé au point de rencontre".</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold mb-1">3. Générez votre code</p>
              <p>Dès que vous et votre partenaire avez confirmé votre arrivée, le bouton "Afficher le code" apparaît automatiquement.</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold mb-1">4. Vérifiez la correspondance</p>
              <p>Ouvrez vos codes simultanément. S'ils sont identiques, vous avez trouvé votre partenaire et pouvez commander votre trajet !</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
    </div>
  );
};

export default RetrouvezVous;
