import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CommentCaMarche = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-3 pb-20 pt-6">
        <section className="flex flex-col gap-4 pb-6">
          <div className="flex justify-center px-4">
            <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Comment ça marche ?</h1>
          </div>

          <div className="flex flex-col gap-4 items-center px-4">
            <div className="w-full max-w-[42rem] space-y-6 text-heading text-[14px] leading-relaxed">
              <div>
                <p className="text-[18px] font-semibold">1. Publiez votre trajet</p>
                <p>Indiquez votre heure de départ et votre destination. C'est gratuit !</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">2. Trouvez un partenaire</p>
                <p>Envoyez une demande pour l'annonce qui vous intéresse.</p>
                <p className="mt-2">Acceptée : Vous payez les frais de mise en relation.</p>
                <p>Refusée : Aucun frais.</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">3. Signalez votre présence</p>
                <p>Rendez-vous au point taxi / VTC et cliquez sur « Je suis prêt ».</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">4. Partagez les frais</p>
                <p>Montez ensemble dans le véhicule et divisez le prix de la course !</p>
              </div>

              <Button
                className="w-full rounded-full"
                onClick={() => navigate("/publier")}
              >
                Continuer
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CommentCaMarche;
