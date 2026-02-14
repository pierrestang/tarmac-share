import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/types/trajet";

interface PlaceSelection {
  name: string;
  coords?: Coordinates;
}

interface PlacesAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string, coords?: Coordinates) => void;
  placeholder?: string;
  className?: string;
}

const PlacesAutocomplete = ({
  id,
  value,
  onChange,
  placeholder,
  className,
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || autocompleteRef.current) return;

    // Wait for Google Maps to be loaded
    if (typeof google === "undefined" || !google.maps?.places) {
      console.warn("Google Maps Places API not loaded");
      return;
    }

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "name", "place_id", "geometry"],
      }
    );

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place) {
        // Prefer name for stations/establishments, fallback to formatted_address
        const selectedValue = place.name || place.formatted_address || "";
        
        // Extract coordinates if available
        let coords: Coordinates | undefined;
        if (place.geometry?.location) {
          coords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
        }
        
        onChange(selectedValue, coords);
      }
    });
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value, undefined)}
      placeholder={placeholder}
      className={cn(
        "flex w-full bg-transparent text-base font-semibold placeholder:text-muted-foreground placeholder:font-semibold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
    />
  );
};

export default PlacesAutocomplete;
