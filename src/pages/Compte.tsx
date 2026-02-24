import { useState, useRef, useEffect } from "react";
import { Camera, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAIL = "pierres-19@hotmail.fr";

const Compte = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { getActiveProfile, updateProfile, isLoaded: profilesLoaded } = useProfiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = getActiveProfile();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  const isAdmin = userEmail === ADMIN_EMAIL;

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [photo, setPhoto] = useState<string | null>(profile?.photo || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setDescription(profile.description);
      setPhoto(profile.photo);
    }
  }, [profile]);

  

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

  if (!profilesLoaded || !profile) return null;

  return (
    <section className="flex flex-col gap-4 pb-6">
      <div className="flex justify-center">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Mon compte.
        </h1>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-[42rem] bg-card border-0 rounded-md overflow-hidden">
          <div className="flex flex-col">
            {/* Photo */}
            <div className="flex justify-center py-4">
              <div
                className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                {photo ? (
                  <img src={photo} alt="Aperçu" className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
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

      {isAdmin && (
        <div className="flex justify-center">
          <Button
            className="w-full max-w-[42rem] border-0 rounded-md h-auto px-4 py-4"
            onClick={() => navigate("/tour-de-controle")}
          >
            Tour de contrôle
          </Button>
        </div>
      )}

      {/* Déconnexion */}
      <div className="flex justify-center">
        <Button
          className="w-full max-w-[42rem] border-0 rounded-md h-auto px-4 py-4"
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
        >
          Déconnexion
        </Button>
      </div>

    </section>
  );
};

export default Compte;
