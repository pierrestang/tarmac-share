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
                <p className="text-[18px] font-semibold">1. Publiez votre annonce gratuitement</p>
                <p>Indiquez votre créneau de sortie et votre zone de destination.</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">2. Envoyez une demande de mise en relation</p>
                <p>
                  Lorsque vous voyez une annonce correspondante,
                  <br />
                  vous pouvez envoyer une demande.
                </p>
                <p className="mt-2">👉 Si le voyageur accepte, vous payez tous les deux.</p>
                <p>👉 Si la demande est refusée, aucun paiement n'est effectué.</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">3. Retrouvez-vous à l'aéroport</p>
                <p>
                  Au point taxi / VTC, cliquez chacun sur « Je suis prêt » quand vous êtes disponible.
                </p>
                <p className="mt-2">👉 Un numéro commun apparaît uniquement lorsque vous êtes tous les deux prêts.</p>
              </div>

              <div>
                <p className="text-[18px] font-semibold">4. Partagez la course</p>
                <p>Vous prenez le taxi ou VTC ensemble et partagez le prix.</p>
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
