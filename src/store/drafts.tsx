import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { reportList, reports } from '@/reports';
import type { FieldValue, ReportId, Values } from '@/reports/types';
import { initialValues } from '@/reports/values';

type Drafts = Record<ReportId, Values>;

type DraftsContextValue = {
  hydrated: boolean;
  drafts: Drafts;
  setField: (id: ReportId, key: string, value: FieldValue) => void;
  reset: (id: ReportId) => void;
};

const DraftsContext = createContext<DraftsContextValue | null>(null);

const storageKey = (id: ReportId) => `matcha:draft:${id}`;
const SAVE_DELAY_MS = 400;

function freshDrafts(): Drafts {
  return Object.fromEntries(reportList.map((def) => [def.id, initialValues(def)])) as Drafts;
}

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Drafts>(freshDrafts);
  const [hydrated, setHydrated] = useState(false);
  const dirty = useRef(new Set<ReportId>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = { ...freshDrafts() };
      for (const def of reportList) {
        try {
          const raw = await AsyncStorage.getItem(storageKey(def.id));
          // Les valeurs par défaut complètent les champs ajoutés depuis la dernière sauvegarde.
          if (raw) loaded[def.id] = { ...initialValues(def), ...(JSON.parse(raw) as Values) };
        } catch {
          // Brouillon illisible : on repart d'un formulaire vierge.
        }
      }
      if (!cancelled) {
        setDrafts(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sauvegarde différée : chaque modification repousse l'écriture des brouillons modifiés.
  useEffect(() => {
    if (!hydrated || dirty.current.size === 0) return;
    const timer = setTimeout(() => {
      for (const id of dirty.current) {
        AsyncStorage.setItem(storageKey(id), JSON.stringify(drafts[id])).catch(() => {});
      }
      dirty.current.clear();
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [drafts, hydrated]);

  const setField = useCallback((id: ReportId, key: string, value: FieldValue) => {
    dirty.current.add(id);
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }, []);

  const reset = useCallback((id: ReportId) => {
    dirty.current.add(id);
    setDrafts((prev) => ({ ...prev, [id]: initialValues(reports[id], prev[id]) }));
  }, []);

  const value = useMemo(() => ({ hydrated, drafts, setField, reset }), [hydrated, drafts, setField, reset]);

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts(): DraftsContextValue {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts doit être utilisé dans <DraftsProvider>');
  return ctx;
}
