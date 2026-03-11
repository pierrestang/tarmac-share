import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  formatBirthDateInput,
  birthDateInputToStorageFormat,
  storageBirthDateToInputFormat,
  isBirthDateInputComplete,
} from "@/lib/date-time-utils";
import { parse, format, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";

const Inscription = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthInput, setBirthInput] = useState("");
  const [isEditingBirth, setIsEditingBirth] = useState(false);
  const birthInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    navigate("/trajets", { replace: true });
    return null;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) {
      setError("Veuillez renseigner votre prénom.");
      return;
    }
    if (!lastName.trim()) {
      setError("Veuillez renseigner votre nom.");
      return;
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Le prénom et le nom doivent contenir au moins 2 caractères.");
      return;
    }
    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse email.");
      return;
    }
    if (!password) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }
    if (birthDate) {
      const parsed = parse(birthDate, "dd/MM/yyyy", new Date());
      if (differenceInYears(new Date(), parsed) < 18) {
        setError("Vous devez avoir au moins 18 ans pour vous inscrire.");
        return;
      }
    } else {
      setError("Veuillez renseigner votre date de naissance.");
      return;
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Le mot de passe doit comporter au moins 8 caractères dont 1 lettre, 1 chiffre et 1 caractère spécial.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, firstName.trim(), lastName.trim());
    if (error) {
      setError(error.message);
    } else {
      setConfirmationSent(true);
    }
    setLoading(false);
  };

  if (confirmationSent) {
    return (
      <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
        <div className="px-4">
          <button onClick={() => navigate("/auth")} className="text-heading">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex justify-center px-4">
          <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Vérifiez votre boîte mail.</h1>
        </div>

        <div className="flex justify-center px-4">
          <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Un email de confirmation a été envoyé à <strong>{email}</strong>.
                Cliquez sur le lien pour activer votre compte.
              </p>
            </CardContent>
            <Button
              className="w-full rounded-none h-auto py-4"
              onClick={() => navigate("/connexion")}
            >
              Retour à la connexion
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="px-4">
        <button onClick={() => navigate("/auth")} className="text-heading">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Nouveau ici ?</h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <form onSubmit={handleSignUp} noValidate className="flex flex-col">
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
              {isEditingBirth || !birthDate ? (
                <Input
                  ref={birthInputRef}
                  type="text"
                  inputMode="numeric"
                  value={birthInput}
                  onChange={(e) => {
                    const formatted = formatBirthDateInput(e.target.value);
                    setBirthInput(formatted);
                    if (isBirthDateInputComplete(formatted)) {
                      const storageDate = birthDateInputToStorageFormat(formatted);
                      if (storageDate) {
                        setBirthDate(storageDate);
                        setIsEditingBirth(false);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (birthDate) setIsEditingBirth(false);
                  }}
                  placeholder="Date de naissance"
                  className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
              ) : (
                <div
                  onClick={() => {
                    setBirthInput(storageBirthDateToInputFormat(birthDate));
                    setIsEditingBirth(true);
                    setTimeout(() => birthInputRef.current?.focus(), 0);
                  }}
                  className="text-[14px] cursor-pointer text-card-foreground"
                >
                  {(() => {
                    try {
                      const parsed = parse(birthDate, "dd/MM/yyyy", new Date());
                      return format(parsed, "d MMM yyyy", { locale: fr });
                    } catch {
                      return birthDate;
                    }
                  })()}
                </div>
              )}
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4">
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="px-4 py-4 flex items-center gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe (8 caractères min.)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                
                className="border-0 h-auto p-0 bg-transparent text-[14px] text-card-foreground placeholder:text-muted-foreground focus-visible:ring-0 flex-1"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground shrink-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>

            {error && (
              <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground text-sm text-center py-3 px-4 z-50 font-bold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>
        </Card>
      </div>

    </section>
  );
};

export default Inscription;
