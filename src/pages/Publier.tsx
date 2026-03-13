import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Coordinates } from "@/types/trajet";
import { Minus, Plus, Circle, Calendar as CalendarIcon, Clock, CircleUserRound, Briefcase, HelpCircle, X } from "lucide-react";
import { parse, format, isValid, startOfMonth, addMonths, getDaysInMonth, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  // Date sheet state
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  // Build 12 months from today
  const months = useMemo(() => {
    const result: Date[] = [];
    const now = startOfMonth(new Date());
    for (let i = 0; i < 12; i++) result.push(addMonths(now, i));
    return result;
  }, []);

  // Build days grid for a month (Monday-first, null = empty cell)
  const buildDaysGrid = (monthDate: Date): (number | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDow = getDay(new Date(year, month, 1));
    const offset = (firstDow + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const todayStr = format(new Date(), "dd/MM/yyyy");

  // Time sheet state
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [companionsSheetOpen, setCompanionsSheetOpen] = useState(false);
  const [baggageSheetOpen, setBaggageSheetOpen] = useState(false);
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
      <div className="flex justify-center">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading text-center">
          {editTrajetId ? "Modifier le trajet." : "Partagez le trajet, divisez les frais."}
        </h1>
      </div>

      <div className="flex justify-center">
        <Card className="bg-card w-full max-w-[42rem] border-0 rounded-md overflow-hidden">
          <CardContent className="flex flex-col p-0">

           {/* Départ (fixe) */}
          <div className="flex items-center px-4 py-4 gap-3">
            <Circle className="h-4 w-4 flex-shrink-0 text-card-foreground" strokeWidth={3} />
            <span className="text-sm font-semibold">Aéroport de Bordeaux</span>
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
                className="border-0 h-auto p-0 bg-transparent font-semibold"
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
            <div
              className="flex flex-1 text-sm font-semibold cursor-pointer whitespace-nowrap"
              onClick={() => setDateSheetOpen(true)}
            >
              {form.date ? (() => {
                try {
                  const parsed = parse(form.date, "dd/MM/yyyy", new Date());
                  return isValid(parsed) ? formatDateShort(parsed) : form.date;
                } catch {
                  return form.date;
                }
              })() : "Choisir une date"}
            </div>
          </div>

          {/* Date Sheet plein écran */}
          <Sheet open={dateSheetOpen} onOpenChange={setDateSheetOpen}>
            <SheetContent
              side="bottom"
              className="h-[100dvh] p-0 bg-background border-0 flex flex-col [&>button]:hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setDateSheetOpen(false)}
                  className="text-foreground mb-6"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-heading">Quand partez-vous ?</h2>
              </div>

              {/* Scrollable calendar */}
              <div className="flex-1 overflow-y-auto px-6 pb-8">
                {months.map((monthDate) => {
                  const cells = buildDaysGrid(monthDate);
                  const monthLabel = format(monthDate, "MMMM", { locale: fr });
                  const year = monthDate.getFullYear();
                  const month = monthDate.getMonth();

                  return (
                    <div key={`${year}-${month}`} className="mb-8">
                      <h3 className="text-lg font-bold text-heading mb-4 capitalize">
                        {monthLabel}
                      </h3>
                      <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-${idx}`} />;
                          }
                          const dayStr = `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
                          const isSelected = form.date === dayStr;
                          const isToday = todayStr === dayStr;
                          const isPast = new Date(year, month, day) < new Date(new Date().setHours(0,0,0,0));

                          return (
                            <div key={day} className="flex items-center justify-center">
                              <button
                                type="button"
                                disabled={isPast}
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, date: dayStr }));
                                  setDateSheetOpen(false);
                                }}
                                className={cn(
                                  "h-10 w-10 rounded-full text-sm font-medium transition-colors",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : isToday
                                    ? "border border-foreground/50 text-foreground"
                                    : isPast
                                    ? "text-foreground/30 cursor-not-allowed"
                                    : "text-foreground/80 hover:bg-primary/20"
                                )}
                              >
                                {day}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-px bg-border mx-4" />

          {/* Heure */}
          <div className="flex items-center px-4 py-4 gap-3">
            <Clock className={cn(
              "h-4 w-4 flex-shrink-0",
              form.departureTime ? "text-card-foreground" : "text-muted-foreground"
            )} />
            <div
              className="flex items-center gap-2 cursor-pointer flex-1"
              onClick={() => setTimeSheetOpen(true)}
            >
               <span className={cn(
                 "text-sm font-semibold whitespace-nowrap",
                 !form.departureTime && "text-muted-foreground"
               )}>
                {form.departureTime || "Heure"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/votre-timing")}
              className="ml-1 flex-shrink-0"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Time Sheet plein écran */}
          <Sheet open={timeSheetOpen} onOpenChange={(open) => { setTimeSheetOpen(open); if (!open) setSelectedHour(null); }}>
            <SheetContent
              side="bottom"
              className="h-[100dvh] p-0 bg-background border-0 flex flex-col [&>button]:hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => { setTimeSheetOpen(false); setSelectedHour(null); }}
                  className="text-foreground mb-6"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-heading">
                  {selectedHour === null ? "À quelle heure partez-vous ?" : `${String(selectedHour).padStart(2, "0")}h — choisissez le créneau`}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-8">
                {selectedHour === null ? (
                  /* Étape 1 : grille des 24 heures */
                  <div className="grid grid-cols-6 gap-3 mt-4">
                    {Array.from({ length: 24 }, (_, h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedHour(h)}
                        className={cn(
                          "h-12 w-full rounded-full text-base font-semibold transition-colors",
                          activeHour === h
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/80 hover:bg-primary/20"
                        )}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Étape 2 : choix de la demi-heure */
                  <div className="flex flex-col gap-6 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedHour(null)}
                      className="flex items-center gap-2 text-foreground/70 text-base self-start"
                    >
                      ← {String(selectedHour).padStart(2, "0")}h
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      {([0, 1] as const).map((half) => {
                        const slot = getSlotForHour(selectedHour, half);
                        return (
                          <button
                            key={half}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, departureTime: slot }));
                              setTimeSheetOpen(false);
                              setSelectedHour(null);
                            }}
                            className={cn(
                              "py-5 rounded-2xl text-base font-semibold transition-colors",
                              form.departureTime === slot
                                ? "bg-primary text-primary-foreground"
                                : "bg-foreground/10 text-foreground hover:bg-primary/20"
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-px bg-border mx-4" />

          {/* Voyageur(s) */}
          <div
            className="flex items-center w-full px-4 py-4 cursor-pointer gap-3"
            onClick={() => setCompanionsSheetOpen(true)}
          >
            <CircleUserRound className="h-4 w-4 flex-shrink-0 text-card-foreground" />
            <span className="text-sm font-semibold">
              {form.companions === "1" ? "1 voyageur" : `${form.companions} voyageurs`}
            </span>
          </div>

          {/* Companions Sheet plein écran */}
          <Sheet open={companionsSheetOpen} onOpenChange={setCompanionsSheetOpen}>
            <SheetContent
              side="bottom"
              className="h-[100dvh] p-0 bg-background border-0 flex flex-col [&>button]:hidden"
            >
              <div className="flex-shrink-0 px-6 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setCompanionsSheetOpen(false)}
                  className="text-foreground mb-6"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-heading">Combien de voyageurs êtes-vous ?</h2>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {["1", "2", "3"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, companions: val }));
                        setCompanionsSheetOpen(false);
                      }}
                      className={cn(
                        "h-16 rounded-full text-lg font-semibold transition-colors",
                        form.companions === val
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-primary/20"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-px bg-border mx-4" />

          {/* Bagages */}
          <div
            className="flex items-center w-full px-4 py-4 cursor-pointer gap-3"
            onClick={() => setBaggageSheetOpen(true)}
          >
            <Briefcase className={cn(
              "h-4 w-4 flex-shrink-0",
              currentCapacity > 0 ? "text-card-foreground" : "text-muted-foreground"
            )} />
             <span className={cn(
               "text-sm font-semibold",
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

          {/* Baggage Sheet plein écran */}
          <Sheet open={baggageSheetOpen} onOpenChange={setBaggageSheetOpen}>
            <SheetContent
              side="bottom"
              className="h-[100dvh] p-0 bg-background border-0 flex flex-col [&>button]:hidden"
            >
              <div className="flex-shrink-0 px-6 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setBaggageSheetOpen(false)}
                  className="text-foreground mb-6"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-heading">Combien de bagages avez-vous ?</h2>
                <p className="text-lg font-semibold text-heading mt-2">Capacité : {currentCapacity}/{MAX_CAPACITY}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="flex flex-col gap-8 mt-4">
                  {/* Petit */}
                  <div className="flex flex-col gap-3">
                    <p className="text-lg font-semibold text-heading">Petit (sac à main, sacoche)</p>
                    <div className="flex items-center gap-3">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={val > 0 && currentCapacity - form.baggage.small * BAGGAGE_SIZES.small + val * BAGGAGE_SIZES.small > MAX_CAPACITY}
                          onClick={() => setForm((prev) => ({ ...prev, baggage: { ...prev.baggage, small: val } }))}
                          className={cn(
                            "h-14 w-14 rounded-full text-lg font-semibold transition-colors",
                            form.baggage.small === val
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-primary/20",
                            val > 0 && currentCapacity - form.baggage.small * BAGGAGE_SIZES.small + val * BAGGAGE_SIZES.small > MAX_CAPACITY && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Moyen */}
                  <div className="flex flex-col gap-3">
                    <p className="text-lg font-semibold text-heading">Moyen (valise cabine)</p>
                    <div className="flex items-center gap-3">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={val > 0 && currentCapacity - form.baggage.medium * BAGGAGE_SIZES.medium + val * BAGGAGE_SIZES.medium > MAX_CAPACITY}
                          onClick={() => setForm((prev) => ({ ...prev, baggage: { ...prev.baggage, medium: val } }))}
                          className={cn(
                            "h-14 w-14 rounded-full text-lg font-semibold transition-colors",
                            form.baggage.medium === val
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-primary/20",
                            val > 0 && currentCapacity - form.baggage.medium * BAGGAGE_SIZES.medium + val * BAGGAGE_SIZES.medium > MAX_CAPACITY && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grand */}
                  <div className="flex flex-col gap-3">
                    <p className="text-lg font-semibold text-heading">Grand (grosse valise)</p>
                    <div className="flex items-center gap-3">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={val > 0 && currentCapacity - form.baggage.large * BAGGAGE_SIZES.large + val * BAGGAGE_SIZES.large > MAX_CAPACITY}
                          onClick={() => setForm((prev) => ({ ...prev, baggage: { ...prev.baggage, large: val } }))}
                          className={cn(
                            "h-14 w-14 rounded-full text-lg font-semibold transition-colors",
                            form.baggage.large === val
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-primary/20",
                            val > 0 && currentCapacity - form.baggage.large * BAGGAGE_SIZES.large + val * BAGGAGE_SIZES.large > MAX_CAPACITY && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          className="w-full max-w-[42rem] rounded-md h-auto py-4 disabled:opacity-100"
          disabled={!isFormValid}
        >
          {editTrajetId ? "Mettre à jour" : "Publier"}
        </Button>
      </div>

    </section>
  );
};

export default Publier;
