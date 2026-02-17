import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CommunicationLancement = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6 min-h-screen" style={{ backgroundColor: '#A291A9' }}>
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Bordeaux, notre point de départ.</h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: '#3D2B3D' }}>
            <p className="text-[18px] font-semibold mb-2">Où nous trouver ?</p>
            <p>
              Pour son lancement, Tarmac se concentre sur un trajet unique afin de vous garantir un maximum de partenaires de partage :
            </p>
            <p className="mt-3">
              <strong>Départ :</strong> Aéroport de Bordeaux (BOD)
            </p>
            <p>
              <strong>Destination :</strong> Bordeaux Intra-muros
            </p>
            <p className="mt-3">
              Cette zone nous permet de maximiser vos chances de trouver immédiatement un voyageur avec qui diviser la facture.
            </p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: '#3D2B3D' }}>
            <p className="text-[18px] font-semibold mb-2">Et après ?</p>
            <p>
              Nous préparons activement l'ouverture de nouvelles zones pour répondre à vos demandes :
            </p>
            <p className="mt-3">
              <strong>Très bientôt :</strong> Bègles, Pessac et Talence.
            </p>
            <p className="mt-1">
              <strong>Prochaine étape :</strong> Les autres grands aéroports de France.
            </p>
          </CardContent>
        </Card>

        <Button
          className="w-full max-w-[42rem] rounded-full h-auto py-4 mt-2"
          style={{ backgroundColor: '#3D2B3D', color: '#F0EEE9' }}
          onClick={() => navigate("/publier")}
        >
          Continuer
        </Button>
      </div>
    </section>
  );
};

export default CommunicationLancement;
