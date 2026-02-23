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

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">1️⃣ Anticipez votre trajet</p>
            <p>Avant votre vol, publiez votre annonce en indiquant votre heure d'arrivée et votre destination. <strong>C'est gratuit !</strong></p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">2️⃣ Trouvez un partenaire</p>
            <p>Envoyez une demande pour l'annonce qui vous intéresse.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">3️⃣ Retrouvez-vous</p>
            <p>Une fois arrivés, rejoignez votre partenaire au point de rencontre. Puis, commandez votre transport en toute autonomie.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">4️⃣ Partagez les frais</p>
            <p>Montez ensemble dans le véhicule et divisez le prix de la course !</p>
          </CardContent>
        </Card>

        <Button
          className="w-full max-w-[42rem] rounded-full h-auto py-4 mt-2"
          onClick={() => navigate("/communication-lancement")}
        >
          Continuer
        </Button>
      </div>
    </section>
  );
};

export default CommentCaMarche;
