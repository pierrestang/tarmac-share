import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Trajet } from "@/types/trajet";

interface TrajetCardProps {
  trajet: Trajet;
  matchCount: number;
  canEditOrDelete?: boolean;
  onDelete?: (id: string) => void;
}

export function TrajetCard({ trajet, matchCount, canEditOrDelete = false, onDelete }: TrajetCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    navigate(`/publier?edit=${trajet.id}`);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(trajet.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="text-[14px]">
                <span className="font-medium">Départ : </span>
                <span>{trajet.departureStation}, {trajet.departureTime}</span>
              </div>
              <div className="text-[14px]">
                <span className="font-medium">Arrivée : </span>
                <span>{trajet.destination}</span>
              </div>
              <div className="text-[14px] text-muted-foreground">
                {trajet.date}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[12px] text-muted-foreground">
                {matchCount} voyageur{matchCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {canEditOrDelete && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/matches?trajetId=${trajet.id}`)}
          >
            Voir les résultats
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce trajet ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le trajet du {trajet.date} à {trajet.departureTime} sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
