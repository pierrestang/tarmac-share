import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const CommunicationLancement = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: '#A291A9' }}>
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6" style={{ minHeight: '100dvh' }}>
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Où nous trouver ?</h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-[14px] leading-relaxed" style={{ color: '#3D2B3D' }}>
            <p className="font-semibold mb-1">Où nous trouver ?</p>
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
            <p className="font-semibold mb-1">Et après ?</p>
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

        <button
          className="w-full max-w-[42rem] rounded-md h-auto py-4 mt-2 text-[16px] font-semibold border-0"
          style={{ backgroundColor: '#3D2B3D', color: '#F0EEE9' }}
          onClick={() => navigate("/publier")}
        >
          Continuer
        </button>
      </div>
    </section>
    </div>
  );
};

export default CommunicationLancement;
