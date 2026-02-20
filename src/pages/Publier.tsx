import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Coordinates } from "@/types/trajet";
import { Minus, Plus, Circle, Calendar as CalendarIcon, Clock, CircleUserRound, Briefcase, HelpCircle } from "lucide-react";
import { parse, format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateShort } from "@/lib/date-time-utils";

// Baggage capacity constants
const BAGGAGE_SIZES = {
  small: 50,
  medium: 70,
  large: 120,
} as const;

const MAX_CAPACITY = 360;

interface TrajetForm {
  date: string;
  departureStation: string;
  departureStationCoords?: Coordinates;
  departureTime: string;
  destination: string;
  destinationCoords?: Coordinates;
  companions: string;
  baggage: {
    small: number;
    medium: number;
    large: number;
  };
  desiredDeparture: string;
  additionalInfo: string;
}

const getTodayStorageFormat = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const initialForm: TrajetForm = {
  date: getTodayStorageFormat(),
  departureStation: "Aéroport de Bordeaux",
  departureStationCoords: { lat: 44.8283, lng: -0.7156 },
  departureTime: "10:00-10:30",
  destination: "Gare Saint-Jean",
  destinationCoords: { lat: 44.8254, lng: -0.5563 },
  companions: "1",
  baggage: {
    small: 0,
    medium: 0,
    large: 0,
  },
  desiredDeparture: "immediate",
  additionalInfo: "",
};

const Publier = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTrajetId = searchParams.get("edit");
  
  const [form, setForm] = useState<TrajetForm>(initialForm);
  const { createTrajet, updateTrajet, getTrajetById, isDuplicateTrajet } = useTrajets();
  const { getActiveProfile } = useProfiles();
  const { toast } = useToast();

  // Date popover state
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Time popover state
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Get active hour from current departureTime
  const activeHour = form.departureTime
    ? parseInt(form.departureTime.split(":")[0], 10)
    : null;

  const getSlotForHour = (h: number, half: 0 | 1): string => {
    const hh = String(h).padStart(2, "0");
    if (half === 0) return `${hh}:00-${hh}:30`;
    const nextH = h + 1;
    return nextH < 24
      ? `${hh}:30-${String(nextH).padStart(2, "0")}:00`
      : `${hh}:30-00:00`;
  };

  // Load trajet data in edit mode
  useEffect(() => {
    if (editTrajetId) {
      const trajet = getTrajetById(editTrajetId);
      if (trajet) {
        setForm({
          date: trajet.date,
          departureStation: trajet.departureStation,
          departureStationCoords: trajet.departureStationCoords,
          departureTime: trajet.departureTime,
          destination: trajet.destination,
          destinationCoords: trajet.destinationCoords,
          companions: String(trajet.companions),
          baggage: trajet.baggage,
          desiredDeparture: trajet.desiredDeparture,
          additionalInfo: trajet.additionalInfo,
        });
      }
    }
  }, [editTrajetId, getTrajetById]);

  // Calculate current baggage capacity
  const currentCapacity =
    form.baggage.small * BAGGAGE_SIZES.small +
    form.baggage.medium * BAGGAGE_SIZES.medium +
    form.baggage.large * BAGGAGE_SIZES.large;

  // Check if adding a baggage type would exceed capacity
  const canAddBaggage = (type: keyof typeof BAGGAGE_SIZES) => {
    return currentCapacity + BAGGAGE_SIZES[type] <= MAX_CAPACITY;
  };

  const updateBaggage = (type: keyof typeof BAGGAGE_SIZES, delta: number) => {
    const newValue = form.baggage[type] + delta;
    if (newValue < 0) return;
    if (delta > 0 && !canAddBaggage(type)) return;

    setForm((prev) => ({
      ...prev,
      baggage: {
        ...prev.baggage,
        [type]: newValue,
      },
    }));
  };

  // Check if form is valid - destination must have coords (selected from Google Places)
  const isFormValid =
    form.date.trim() !== "" &&
    form.departureStation.trim() !== "" &&
    form.departureTime.trim() !== "" &&
    form.destination.trim() !== "" &&
    !!form.destinationCoords;

  const handleSubmit = async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
      navigate("/compte");
      return;
    }

    // Validate required fields
    if (!form.date.trim() || !form.departureStation.trim() || !form.departureTime.trim() || !form.destination.trim()) {
      return;
    }

    // Edit mode
    if (editTrajetId) {
      const success = await updateTrajet(editTrajetId, {
        date: form.date,
        departureStation: form.departureStation,
        departureStationCoords: form.departureStationCoords,
        departureTime: form.departureTime,
        destination: form.destination,
        destinationCoords: form.destinationCoords,
        companions: parseInt(form.companions),
        baggage: form.baggage,
        desiredDeparture: form.desiredDeparture,
        additionalInfo: form.additionalInfo,
      });

      if (success) {
        navigate(`/matches?trajetId=${editTrajetId}`);
      }
      return;
    }

    // Create mode - check for duplicate
    if (isDuplicateTrajet(activeProfile.id, form.date, form.departureStation, form.departureTime)) {
      toast({
        title: "Trajet similaire existant",
        description: "Vous avez déjà publié un trajet avec des critères similaires.",
        variant: "destructive",
      });
      return;
    }

    const trajet = await createTrajet({
      profileId: activeProfile.id,
      date: form.date,
      departureStation: form.departureStation,
      departureStationCoords: form.departureStationCoords,
      departureTime: form.departureTime,
      destination: form.destination,
      destinationCoords: form.destinationCoords,
        companions: parseInt(form.companions),
        baggage: form.baggage,
        desiredDeparture: form.desiredDeparture,
        additionalInfo: form.additionalInfo,
      });

      // Save last published trajet ID for use in demande-envoyer
      localStorage.setItem("lastPublishedTrajetId", trajet.id);

    navigate(`/matches?trajetId=${trajet.id}`);
  };

  return (
    <section className="flex flex-col flex-1 justify-center gap-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading text-center">
          {editTrajetId ? "Modifier le trajet." : "Partagez le trajet, divisez les frais."}
        </h1>
      </div>

      <div className="flex justify-center px-4">
        <Card className="bg-card w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <CardContent className="flex flex-col p-0">

           {/* Départ (fixe) */}
          <div className="flex items-center px-4 py-4 gap-3">
            <Circle className="h-4 w-4 flex-shrink-0 text-card-foreground" strokeWidth={3} />
            <span className="text-base font-semibold md:text-sm">Aéroport de Bordeaux</span>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Destination */}
          <div className="flex items-center px-4 py-4 gap-3">
            <Circle className={cn(
              "h-4 w-4 flex-shrink-0",
              form.destination ? "text-card-foreground" : "text-muted-foreground"
            )} strokeWidth={3} />
            <div className="flex-1">
            <PlacesAutocomplete
                id="destination"
                value={form.destination}
                onChange={(value, coords, isPrecise) => {
                  // If coords provided, check if within Bordeaux area
                  if (coords) {
                    const inBordeaux =
                      coords.lat >= 44.78 && coords.lat <= 44.93 &&
                      coords.lng >= -0.68 && coords.lng <= -0.49;
                    if (!inBordeaux) {
                      toast({
                        title: "Zone non disponible",
                        description: "Bientôt partout, mais pour l'instant, Tarmac ne se lance qu'à Bordeaux !",
                        variant: "destructive",
                      });
                      setForm((prev) => ({ ...prev, destination: "", destinationCoords: undefined }));
                      return;
                    }
                    if (!isPrecise) {
                      toast({
                        description: "Précisez votre adresse exacte (rue et numéro) pour valider le trajet.",
                        variant: "destructive",
                      });
                      setForm((prev) => ({ ...prev, destination: value, destinationCoords: undefined }));
                      return;
                    }
                  }
                  setForm((prev) => ({ ...prev, destination: value, destinationCoords: coords }));
                }}
                placeholder="Destination"
                className="border-0 h-auto p-0 bg-transparent"
              />
            </div>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Date */}
          <div className="flex items-center px-4 py-4 gap-3">
            <CalendarIcon className={cn(
              "h-4 w-4 flex-shrink-0",
              form.date ? "text-card-foreground" : "text-muted-foreground"
            )} />
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex flex-1 text-base font-semibold cursor-pointer md:text-sm whitespace-nowrap">
                  {form.date ? (() => {
                    try {
                      const parsed = parse(form.date, "dd/MM/yyyy", new Date());
                      return isValid(parsed) ? formatDateShort(parsed) : form.date;
                    } catch {
                      return form.date;
                    }
                  })() : "Choisir une date"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.date ? (() => {
                    try {
                      const p = parse(form.date, "dd/MM/yyyy", new Date());
                      return isValid(p) ? p : undefined;
                    } catch { return undefined; }
                  })() : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setForm((prev) => ({ ...prev, date: format(date, "dd/MM/yyyy") }));
                      setDatePopoverOpen(false);
                    }
                  }}
                  locale={fr}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Heure */}
          <div className="flex items-center px-4 py-4 gap-3">
            <Clock className={cn(
              "h-4 w-4 flex-shrink-0",
              form.departureTime ? "text-card-foreground" : "text-muted-foreground"
            )} />
            <Popover open={timePopoverOpen} onOpenChange={(open) => { setTimePopoverOpen(open); if (!open) setSelectedHour(null); }}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer flex-1">
                  <span className={cn(
                    "text-base font-semibold md:text-sm whitespace-nowrap",
                    !form.departureTime && "text-muted-foreground"
                  )}>
                    {form.departureTime || "Heure"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                {selectedHour === null ? (
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 24 }, (_, h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedHour(h)}
                        className={cn(
                          "w-10 h-10 rounded-md text-[13px] font-medium transition-colors",
                          activeHour === h
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedHour(null)}
                      className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors self-start"
                    >
                      ← {String(selectedHour).padStart(2, "0")}h
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {([0, 1] as const).map((half) => {
                        const slot = getSlotForHour(selectedHour, half);
                        return (
                          <button
                            key={half}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, departureTime: slot }));
                              setTimePopoverOpen(false);
                              setSelectedHour(null);
                            }}
                            className={cn(
                              "px-3 py-3 rounded-md text-[13px] font-medium transition-colors border border-border",
                              form.departureTime === slot
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={() => navigate("/votre-timing")}
              className="ml-1 flex-shrink-0"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Voyageur(s) */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center w-full px-4 py-4 cursor-pointer gap-3">
                <CircleUserRound className="h-4 w-4 flex-shrink-0 text-card-foreground" />
                <span className="text-base font-semibold md:text-sm">
                  {form.companions === "1" ? "1 voyageur" : `${form.companions} voyageurs`}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col">
                {["1", "2", "3"].map((val, index) => (
                  <div
                    key={val}
                    className={cn(
                      "px-4 py-3 cursor-pointer text-[14px]",
                      index < 2 && "border-b border-border"
                    )}
                    onClick={() => setForm((prev) => ({ ...prev, companions: val }))}
                  >
                    {val === "1" ? "1 voyageur" : `${val} voyageurs`}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-px bg-border mx-4" />

          {/* Bagages */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center w-full px-4 py-4 cursor-pointer gap-3">
                <Briefcase className={cn(
                  "h-4 w-4 flex-shrink-0",
                  currentCapacity > 0 ? "text-card-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-base font-semibold md:text-sm",
                  currentCapacity === 0 && "text-muted-foreground"
                )}>
                  {(() => {
                    const parts: string[] = [];
                    if (form.baggage.small > 0) parts.push(`${form.baggage.small} petit${form.baggage.small > 1 ? 's' : ''}`);
                    if (form.baggage.medium > 0) parts.push(`${form.baggage.medium} moyen${form.baggage.medium > 1 ? 's' : ''}`);
                    if (form.baggage.large > 0) parts.push(`${form.baggage.large} grand${form.baggage.large > 1 ? 's' : ''}`);
                    return parts.length > 0 ? parts.join(', ') : "Pas de bagage";
                  })()}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Capacité</span>
                  <span>{currentCapacity}/{MAX_CAPACITY}</span>
                </div>
                
                {/* Petit */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">Petit</span>
                    <span className="text-[12px] text-muted-foreground">(50)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("small", -1)}
                      disabled={form.baggage.small === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-[16px] font-medium">
                      {form.baggage.small}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("small", 1)}
                      disabled={!canAddBaggage("small")}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Moyen */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">Moyen</span>
                    <span className="text-[12px] text-muted-foreground">(70)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("medium", -1)}
                      disabled={form.baggage.medium === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-[16px] font-medium">
                      {form.baggage.medium}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("medium", 1)}
                      disabled={!canAddBaggage("medium")}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Grand */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">Grand</span>
                    <span className="text-[12px] text-muted-foreground">(120)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("large", -1)}
                      disabled={form.baggage.large === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-[16px] font-medium">
                      {form.baggage.large}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateBaggage("large", 1)}
                      disabled={!canAddBaggage("large")}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Bouton Publier */}
          <Button
            onClick={handleSubmit}
            className="w-full rounded-none h-auto py-4 disabled:opacity-100"
            disabled={!isFormValid}
          >
            {editTrajetId ? "Mettre à jour" : "Publier"}
          </Button>
          </CardContent>
        </Card>
      </div>

    </section>
  );
};

export default Publier;
