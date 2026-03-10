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
            <p className="font-semibold mb-1">1️⃣ Anticipez votre arrivée</p>
            <p>Publiez gratuitement votre annonce.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">2️⃣ Trouvez un voyageur compatible</p>
            <p>Entrez en relation avec quelqu'un qui arrive au même moment et dont la destination est proche de la vôtre.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">3️⃣ Coordonnez-vous</p>
            <p>Retrouvez-vous et organisez librement votre départ.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">4️⃣ Voyagez ensemble</p>
            <p>Effectuez le trajet ensemble et répartissez les frais du transport entre vous.</p>
          </CardContent>
        </Card>

        <Button
          className="w-full max-w-[42rem] h-auto py-4 mt-2"
          onClick={() => navigate("/communication-lancement")}
        >
          Continuer
        </Button>
      </div>
    </section>
  );
};

export default CommentCaMarche;
