import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [isFreeMode, setIsFreeMode] = useState(true); // default true until loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "free_mode")
        .single();
      if (!error && data) {
        setIsFreeMode((data as any).value as boolean);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleFreeMode = useCallback(async () => {
    const newValue = !isFreeMode;
    setIsFreeMode(newValue);
    await supabase
      .from("app_settings" as any)
      .update({ value: newValue } as any)
      .eq("key", "free_mode");
  }, [isFreeMode]);

  return { isFreeMode, loading, toggleFreeMode };
}
