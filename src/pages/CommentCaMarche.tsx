import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CommentCaMarche = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col min-h-[100dvh] px-3 pt-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Comment ça marche ?</h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4 mt-6 flex-1">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">1. Publiez votre arrivée</p>
            <p>Indiquez votre heure d'arrivée à l'aéroport de Bordeaux et votre destination finale.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">2. Matching intelligent</p>
            <p>Nous trouvons un voyageur qui arrive en même temps que vous et va dans la même direction.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">3. Mise en relation</p>
            <p>Dès qu'un match est trouvé, vous recevez un lien WhatsApp pour échanger.</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">4. Partagez le trajet</p>
            <p>Retrouvez-vous à l'aéroport, choisissez votre transport et divisez les frais !</p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="font-semibold mb-1">Mise en relation OFFERTE 🤝</p>
            <p>Profitez gratuitement de la mise en relation pour le lancement de Tarmac.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center px-4 mt-6">
        <Button
          className="w-full max-w-[42rem] h-auto py-4"
          onClick={() => navigate("/communication-lancement")}
        >
          Continuer
        </Button>
      </div>
    </section>
  );
};

export default CommentCaMarche;
