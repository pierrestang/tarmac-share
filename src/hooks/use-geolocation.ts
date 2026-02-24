import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Location {
  latitude: number;
  longitude: number;
  updated_at: number;
}

export const useGeolocation = (profileId: string | undefined) => {
  const [isSharing, setIsSharing] = useState(false);
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [otherLocation, setOtherLocation] = useState<Location | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setMyLocation({ latitude: lat, longitude: lng, updated_at: Date.now() });
    
    if (!profileId) return;

    const { error } = await supabase
      .from('locations')
      .upsert({
        profile_id: profileId,
        latitude: lat,
        longitude: lng,
        updated_at: Date.now(),
        is_active: true
      });

    if (error) {
      console.error("Error updating location in Supabase:", error);
    }
  }, [profileId]);

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La géolocalisation n'est pas supportée par votre navigateur.",
      });
      return;
    }

    setIsSharing(true);
    
    // Immediate update
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'accéder à votre position.",
        });
        setIsSharing(false);
      },
      { enableHighAccuracy: true }
    );

    // Watch update
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Error watching location:", error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }, [updateLocation, toast]);

  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    setMyLocation(null);

    if (profileId) {
      // Optionally delete or mark inactive
      await supabase
        .from('locations')
        .delete()
        .eq('profile_id', profileId);
    }
  }, [profileId]);

  // Realtime subscription helper
  const subscribeToOtherUser = useCallback((otherProfileId: string) => {
     const channel = supabase
      .channel(`location-${otherProfileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `profile_id=eq.${otherProfileId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setOtherLocation(null);
          } else if (payload.new) {
            setOtherLocation({
              latitude: (payload.new as any).latitude,
              longitude: (payload.new as any).longitude,
              updated_at: (payload.new as any).updated_at
            });
          }
        }
      )
      .subscribe();

      // Initial fetch
      const fetchLocation = async () => {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('profile_id', otherProfileId)
          .maybeSingle();

        if (data) {
          setOtherLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            updated_at: data.updated_at
          });
        }
      };
      fetchLocation();

      return () => {
        supabase.removeChannel(channel);
      };
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isSharing,
    startSharing,
    stopSharing,
    myLocation,
    otherLocation,
    subscribeToOtherUser
  };
};
