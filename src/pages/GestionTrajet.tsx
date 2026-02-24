import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";

const GestionTrajet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId") || "";
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="p-1 self-start mb-2">
        <ArrowLeft className="h-6 w-6" />
      </button>

      <h1 className="text-[24px] font-semibold mb-4 w-full text-heading">Gestion du trajet.</h1>

      <div className="flex flex-col gap-3">
        <button
          onClick={() =>
            navigate(`/messages?conversationId=${conversationId}&action=close`)
          }
          className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-3 text-[16px] font-semibold border-0"
          style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}>
          <span>Clôturer le trajet</span>
        </button>

        <button
          onClick={() => setShowCancelDialog(true)}
          className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-3 text-[16px] font-semibold border-0"
          style={{ backgroundColor: "#e34454", color: "#FFFFFF" }}>
          <span>Annuler le trajet</span>
        </button>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Êtes-vous sûr de vouloir annuler ce trajet ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() =>
              navigate(
                `/messages?conversationId=${conversationId}&action=cancel`
              )
              }
              className="rounded-md">

              Oui
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-md">Non</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default GestionTrajet;