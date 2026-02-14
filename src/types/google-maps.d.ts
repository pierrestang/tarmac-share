declare namespace google {
  namespace maps {
    namespace places {
      class Autocomplete {
        constructor(
          inputField: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        componentRestrictions?: {
          country: string | string[];
        };
        fields?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        name?: string;
        place_id?: string;
        geometry?: {
          location: LatLng;
        };
      }
    }

    class LatLng {
      lat(): number;
      lng(): number;
    }
  }
}
