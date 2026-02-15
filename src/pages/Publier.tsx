import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Coordinates } from "@/types/trajet";
import { Minus, Plus, Circle, Calendar as CalendarIcon, Clock, User as UserIcon, Briefcase } from "lucide-react";
import { parse } from "date-fns";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDateInput,
  parseDateInput,
  formatDateShort,
  dateInputToStorageFormat,
  storageDateToInputFormat,
  isDateInputComplete,
} from "@/lib/date-time-utils";

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
  departureTime: "10h00-10h30",
  destination: "Bordeaux",
  destinationCoords: { lat: 44.8378, lng: -0.5792 },
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

  // Date input states
  const [dateInput, setDateInput] = useState("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Generate 30-min time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, "0");
      const nextH30 = h;
      const nextH00 = h + 1;
      slots.push(`${hh}h00-${hh}h30`);
      if (nextH00 < 24) {
        slots.push(`${hh}h30-${String(nextH00).padStart(2, "0")}h00`);
      } else {
        slots.push(`${hh}h30-00h00`);
      }
    }
    return slots;
  }, []);

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

  // Check if form is valid
  const isFormValid =
    form.date.trim() !== "" &&
    form.departureStation.trim() !== "" &&
    form.departureTime.trim() !== "" &&
    form.destination.trim() !== "";

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
                onChange={(value, coords) =>
                  setForm((prev) => ({ ...prev, destination: value, destinationCoords: coords }))
                }
                placeholder="Destination"
                className="border-0 h-auto p-0 bg-transparent"
              />
            </div>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Date et Heure */}
          <div className="flex items-center px-4 py-4 gap-3">
            <CalendarIcon className={cn(
              "h-4 w-4 flex-shrink-0",
              form.date ? "text-card-foreground" : "text-muted-foreground"
            )} />
            
            {/* Date Input */}
            {isEditingDate || !form.date ? (
              <Input
                ref={dateInputRef}
                type="text"
                inputMode="numeric"
                value={dateInput}
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setDateInput(formatted);
                  
                  // Auto-validate when complete
                  if (isDateInputComplete(formatted)) {
                    const storageDate = dateInputToStorageFormat(formatted);
                    if (storageDate) {
                      setForm((prev) => ({ ...prev, date: storageDate }));
                      setIsEditingDate(false);
                    }
                  }
                }}
                onBlur={() => {
                  if (form.date) {
                    setIsEditingDate(false);
                  }
                }}
                placeholder="Date"
                className="flex-1 border-0 p-0 h-auto text-base font-semibold md:text-sm placeholder:text-muted-foreground placeholder:font-semibold focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent"
              />
            ) : (
              <div
                onClick={() => {
                  setDateInput(storageDateToInputFormat(form.date));
                  setIsEditingDate(true);
                  setTimeout(() => dateInputRef.current?.focus(), 0);
                }}
                className="flex flex-1 text-base font-semibold cursor-pointer md:text-sm whitespace-nowrap"
              >
                {(() => {
                  try {
                    const parsed = parse(form.date, "dd/MM/yyyy", new Date());
                    return formatDateShort(parsed);
                  } catch {
                    return form.date;
                  }
                })()}
              </div>
            )}

            <div className="w-px h-6 bg-border" />

            {/* Heure - Time Slot Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Clock className={cn(
                    "h-4 w-4 flex-shrink-0",
                    form.departureTime ? "text-card-foreground" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-base font-semibold md:text-sm whitespace-nowrap",
                    !form.departureTime && "text-muted-foreground"
                  )}>
                    {form.departureTime || "Heure"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-h-64 overflow-y-auto" align="end">
                <div className="flex flex-col">
                  {timeSlots.map((slot, index) => (
                    <div
                      key={slot}
                      className={cn(
                        "px-4 py-3 cursor-pointer text-[14px] whitespace-nowrap",
                        index < timeSlots.length - 1 && "border-b border-border",
                        form.departureTime === slot && "bg-primary/10 font-semibold"
                      )}
                      onClick={() => setForm((prev) => ({ ...prev, departureTime: slot }))}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Voyageur(s) */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center w-full px-4 py-4 cursor-pointer gap-3">
                <UserIcon className="h-4 w-4 flex-shrink-0 text-card-foreground" />
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
