import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProfiles } from "@/hooks/use-profiles";

const Profil = () => {
  const navigate = useNavigate();
  const { getActiveProfile, updateProfile } = useProfiles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = getActiveProfile();

  const [photo, setPhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!activeProfile) {
      navigate("/compte");
      return;
    }

    setPhoto(activeProfile.photo);
    setFirstName(activeProfile.firstName);
    setLastName(activeProfile.lastName);
    setDescription(activeProfile.description);

  }, [activeProfile, navigate]);

  if (!activeProfile) {
    return null;
  }

  
  const isFormValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2;

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

  const handleSave = async () => {
    if (!isFormValid) return;

    await updateProfile(activeProfile.id, {
      photo,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
    });
  };

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return first + last || "?";
  };

  return (
    <section aria-label="Profil" className="flex flex-col items-center px-4 pb-6">
      <div className="flex items-center justify-between w-full max-w-[42rem] mb-4">
        <h1 className="text-[24px] font-semibold text-heading">Mon profil.</h1>
        <button 
          onClick={() => navigate("/compte")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Paramètres"
        >
          <Settings className="h-6 w-6 text-heading" />
        </button>
      </div>

      <Card className="w-full max-w-[42rem] border-0 overflow-hidden">
        <div className="flex flex-col">
        {/* Photo - clickable */}
          <div className="flex justify-center px-4 py-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12">
                {photo ? (
                  <AvatarImage src={photo} alt="Photo de profil" />
                ) : (
                  <AvatarFallback className="text-xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Prénom */}
          <div className="px-4 py-4">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="border-0 p-0 h-auto text-[14px] text-card-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent"
            />
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Nom */}
          <div className="px-4 py-4">
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              className="border-0 p-0 h-auto text-[14px] text-card-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent"
            />
          </div>

          <div className="h-px bg-border mx-4" />


          {/* Description */}
          <div className="px-4 py-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="border-0 p-0 min-h-0 h-auto text-[14px] text-card-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none bg-transparent"
              rows={description.length > 0 ? Math.max(1, Math.ceil(description.length / 40)) : 1}
            />
          </div>


          {/* Bouton Enregistrer */}
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
          >
            Enregistrer
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default Profil;
