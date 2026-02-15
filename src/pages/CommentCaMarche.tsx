import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CommentCaMarche = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Comment ça marche ?</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <CardContent className="p-4 space-y-6 text-card-foreground text-[14px] leading-relaxed">
            <div>
              <p className="text-[18px] font-semibold mb-2">1. Publiez votre trajet</p>
              <p>Indiquez votre heure de départ et votre destination. <strong>C'est gratuit !</strong></p>
            </div>

            <div>
              <p className="text-[18px] font-semibold mb-2">2. Trouvez un partenaire</p>
              <p>Envoyez une demande pour l'annonce qui vous intéresse.</p>
              <p className="mt-2">✅ Acceptée : Vous payez les frais de mise en relation.</p>
              <p>❌ Refusée : Aucun frais.</p>
            </div>

            <div>
              <p className="text-[18px] font-semibold mb-2">3. Signalez votre présence</p>
              <p>Rendez-vous au point taxi / VTC.</p>
            </div>

            <div>
              <p className="text-[18px] font-semibold mb-2">4. Partagez les frais</p>
              <p>Montez ensemble dans le véhicule et divisez le prix de la course !</p>
            </div>
          </CardContent>

          <Button
            className="w-full rounded-none h-auto py-4"
            onClick={() => navigate("/publier")}
          >
            Continuer
          </Button>
        </Card>
      </div>
    </section>
  );
};

export default CommentCaMarche;
