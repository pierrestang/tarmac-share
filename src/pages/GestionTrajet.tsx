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
  const demandeId = searchParams.get("demandeId") || "";
  const isClosed = searchParams.get("closed") === "true";
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="p-1 self-start mb-2">
        <ArrowLeft className="h-6 w-6" />
      </button>

      <h1 className="text-[24px] font-semibold mb-4 w-full text-heading">Mon trajet.</h1>

      <div className="rounded-md p-4 mb-4" style={{ backgroundColor: "#F0EEE9" }}>
        <p className="text-[14px] font-semibold mb-1" style={{ color: "#4E657A" }}>Prenez la main sur votre trajet</p>
        <p className="text-[14px]" style={{ color: "#4E657A" }}>Retrouvez toutes vos informations de voyage pour vous coordonner, confirmez votre trajet une fois terminé ou gérez une annulation si vos plans changent.</p>
      </div>

      <div className="flex flex-col gap-3">
        {demandeId && (
          <button
            onClick={() => navigate(`/demande-consulter?demandeId=${demandeId}`)}
            className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0"
            style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}>
            <span>Voir le trajet</span>
          </button>
        )}
        {!isClosed && (
          <>
            <button
              onClick={() =>
                navigate(`/messages?conversationId=${conversationId}&action=close`)
              }
               className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0"
              style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}>
              <span>Terminer le trajet</span>
            </button>

            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0"
              style={{ backgroundColor: "#e34454", color: "#FFFFFF" }}>
              <span>Annuler le trajet</span>
            </button>
          </>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation ?</AlertDialogTitle>
            <AlertDialogDescription className="hidden">
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex !flex-row gap-3 items-center mt-0">
            <AlertDialogAction
              onClick={() =>
              navigate(
                `/messages?conversationId=${conversationId}&action=cancel`
              )
              }
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3"
              style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
              Oui
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3 mt-0"
              style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
              Non
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default GestionTrajet;