import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { useTrajets } from "@/hooks/use-trajets";
import { useDemandes } from "@/hooks/use-demandes";
import { useMessages } from "@/hooks/use-messages";
import { useNotifications } from "@/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Compte = () => {
  const { getActiveProfile, updateProfile } = useProfiles();
  const { resetTrajets } = useTrajets();
  const { resetDemandes } = useDemandes();
  const { resetMessages } = useMessages();
  const { resetNotifications } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = getActiveProfile();

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [photo, setPhoto] = useState<string | null>(profile?.photo || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    resetTrajets();
    resetDemandes();
    resetMessages();
    resetNotifications();
    setShowResetConfirm(false);
  };

  const compressImage = (file: File, maxSize = 100, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = url;
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  const handleSubmit = async () => {
    if (!profile || isSubmitting) return;
    if (firstName.trim().length < 2 || lastName.trim().length < 2) return;
    setIsSubmitting(true);
    await updateProfile(profile.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
      photo,
    });
    setIsSubmitting(false);
  };

  const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  return (
    <section className="flex flex-col gap-4 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Mon profil.
        </h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] bg-card border-0 rounded-md overflow-hidden">
          <div className="flex flex-col">
            {/* Photo */}
            <div className="flex justify-center py-4">
              <div
                className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                {photo ? (
                  <img src={photo} alt="Aperçu" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Camera size={24} className="text-muted-foreground" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
                className="border-0 min-h-0 p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>

      {/* Réinitialiser */}
      <div className="flex justify-center px-4">
        <Button
          variant="outline"
          className="w-full max-w-[42rem] justify-start text-[14px] font-semibold bg-card text-card-foreground border-0 rounded-md hover:bg-card/90 h-auto px-4 py-4"
          onClick={() => setShowResetConfirm(true)}
        >
          Réinitialiser les trajets
        </Button>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les trajets ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera tous les trajets et demandes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData}>Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default Compte;
