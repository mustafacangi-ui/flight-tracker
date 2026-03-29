"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  /** Re-show install card (e.g. from profile menu). */
  requestInstallCard: () => void;
  installCardNonce: number;
};

const PwaInstallContext = createContext<Ctx | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const requestInstallCard = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);
  const value = useMemo(
    () => ({ requestInstallCard, installCardNonce: nonce }),
    [requestInstallCard, nonce]
  );
  return (
    <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
  );
}

export function usePwaInstallRequest(): Ctx {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    return {
      requestInstallCard: () => {},
      installCardNonce: 0,
    };
  }
  return ctx;
}
