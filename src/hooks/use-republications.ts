import { useCallback, useMemo } from "react";

const REPUBLICATIONS_KEY = "republications";
const MAX_FREE_REPUBLICATIONS = 2;

interface RepublicationRecord {
  profileId: string;
  usedCount: number;
}

function readRepublications(): RepublicationRecord[] {
  try {
    const raw = localStorage.getItem(REPUBLICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRepublications(records: RepublicationRecord[]): void {
  localStorage.setItem(REPUBLICATIONS_KEY, JSON.stringify(records));
}

export function useRepublications() {
  const getUsedRepublications = useCallback((profileId: string): number => {
    const records = readRepublications();
    const record = records.find((r) => r.profileId === profileId);
    return record?.usedCount || 0;
  }, []);

  const getFreeRepublications = useCallback((profileId: string): number => {
    const used = getUsedRepublications(profileId);
    return Math.max(0, MAX_FREE_REPUBLICATIONS - used);
  }, [getUsedRepublications]);

  const canRepublishFree = useCallback((profileId: string): boolean => {
    return getFreeRepublications(profileId) > 0;
  }, [getFreeRepublications]);

  const useRepublication = useCallback((profileId: string): boolean => {
    const records = readRepublications();
    const existingIndex = records.findIndex((r) => r.profileId === profileId);
    
    if (existingIndex >= 0) {
      records[existingIndex].usedCount += 1;
    } else {
      records.push({ profileId, usedCount: 1 });
    }
    
    writeRepublications(records);
    return true;
  }, []);

  return useMemo(() => ({
    getUsedRepublications,
    getFreeRepublications,
    canRepublishFree,
    useRepublication,
  }), [getUsedRepublications, getFreeRepublications, canRepublishFree, useRepublication]);
}
