import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Pencil, Trash2, X, RotateCcw, ChevronDown } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { useTrajets } from "@/hooks/use-trajets";
import { useDemandes } from "@/hooks/use-demandes";
import { useMessages } from "@/hooks/use-messages";
import { useNotifications } from "@/hooks/use-notifications";
import type { Profile } from "@/types/profile";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FormData {
  firstName: string;
  lastName: string;
  description: string;
  photo: string | null;
}

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  description: "",
  photo: null,
};

const Compte = () => {
  const navigate = useNavigate();
  const { profiles, createProfile, updateProfile, deleteProfile, setActiveProfile } = useProfiles();
  const { resetTrajets } = useTrajets();
  const { resetDemandes } = useDemandes();
  const { resetMessages } = useMessages();
  const { resetNotifications } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  // Deduplicate profiles on mount
  useEffect(() => {
    const seen = new Map<string, string>();
    const toDelete: string[] = [];
    profiles.forEach((p) => {
      const key = `${p.firstName.toLowerCase()}_${p.lastName.toLowerCase()}`;
      if (seen.has(key)) {
        toDelete.push(p.id);
      } else {
        seen.set(key, p.id);
      }
    });
    toDelete.forEach((id) => deleteProfile(id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

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
    setForm((prev) => ({ ...prev, photo: compressed }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) return;

    setIsSubmitting(true);
    const profileData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      description: form.description.trim(),
      photo: form.photo,
    };

    if (editingId) {
      await updateProfile(editingId, profileData);
      setEditingId(null);
    } else {
      await createProfile(profileData);
    }
    setForm(emptyForm);
    setIsSubmitting(false);
  };

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      description: profile.description,
      photo: profile.photo,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProfile(deleteId);
      setDeleteId(null);
    }
  };

  const handleEnter = (id: string) => {
    setActiveProfile(id);
    navigate("/comment-ca-marche");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isFormValid = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2;

  return (
    <section className="flex flex-col gap-4 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Paramètres.
        </h1>
      </div>


      {/* Accordions */}
      <div className="flex justify-center px-4">
        <Accordion 
          type="multiple" 
          value={openAccordions} 
          onValueChange={setOpenAccordions}
          className="w-full max-w-[42rem] flex flex-col gap-4"
        >
          {/* Changer de compte */}
          {profiles.length > 0 && (
            <AccordionItem value="accounts" className="border-0">
              <Card className="bg-card border-0 rounded-md overflow-hidden">
                <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <span className="text-[14px] font-semibold text-card-foreground">Changer de compte</span>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col">
                    {profiles.map((profile, index) => (
                      <div key={profile.id}>
                        {index > 0 && <div className="h-px bg-border mx-4" />}
                        <div className="flex items-center gap-4 px-4 py-4">
                          <Avatar className="h-12 w-12">
                            {profile.photo ? (
                              <AvatarImage src={profile.photo} alt={`${profile.firstName} ${profile.lastName}`} />
                            ) : null}
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {getInitials(profile.firstName, profile.lastName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-card-foreground truncate">
                              <span className="font-semibold">{profile.firstName}</span>{" "}
                              <span className="font-normal">{profile.lastName}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Supprimer"
                              onClick={() => setDeleteId(profile.id)}
                              className="rounded-md p-2 text-muted-foreground hover:bg-muted focus:outline-none"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <Button onClick={() => handleEnter(profile.id)} className="rounded-full">Entrer</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {/* Créer un compte */}
          <AccordionItem value="create" className="border-0">
            <Card className="bg-card border-0 rounded-md overflow-hidden">
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <span className="text-[14px] font-semibold text-card-foreground">
                  {editingId ? "Modifier le compte" : "Créer un compte"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col">
                  {editingId && (
                    <div className="flex justify-end px-4">
                      <button
                        type="button"
                        aria-label="Annuler"
                        onClick={handleCancelEdit}
                        className="rounded-md p-2 text-muted-foreground hover:bg-muted focus:outline-none"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Photo */}
                  <div className="flex justify-center py-4">
                    <div
                      className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {form.photo ? (
                        <img
                          src={form.photo}
                          alt="Aperçu"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Camera size={24} className="text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  <div className="h-px bg-border mx-4" />

                  {/* Prénom */}
                  <div className="px-4 py-4">
                    <Input
                      id="firstName"
                      placeholder="Prénom"
                      value={form.firstName}
                      onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    />
                  </div>

                  <div className="h-px bg-border mx-4" />

                  {/* Nom */}
                  <div className="px-4 py-4">
                    <Input
                      id="lastName"
                      placeholder="Nom"
                      value={form.lastName}
                      onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    />
                  </div>

                  <div className="h-px bg-border mx-4" />

                  {/* Description */}
                  <div className="px-4 py-4">
                    <Textarea
                      id="description"
                      placeholder="Description"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={1}
                      className="border-0 min-h-0 p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
                    />
                  </div>

                  {/* Bouton Créer / Enregistrer */}
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!isFormValid || isSubmitting} 
                    className="w-full rounded-none h-auto py-4 disabled:opacity-100"
                  >
                    {editingId ? "Enregistrer" : "Créer"}
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Bouton Réinitialiser */}
      <div className="flex justify-center px-4">
        <Button
          variant="outline"
          className="w-full max-w-[42rem] justify-start text-[14px] font-semibold bg-card text-card-foreground border-0 rounded-md hover:bg-card/90 h-auto px-4 py-4"
          onClick={() => setShowResetConfirm(true)}
        >
          Réinitialiser les trajets
        </Button>
      </div>

      {/* Dialog de confirmation suppression profil */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce profil ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation reset trajets */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les trajets ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera tous les trajets et demandes. Les profils seront conservés.
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
