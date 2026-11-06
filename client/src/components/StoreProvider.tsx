"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { setAccessTokenHandler } from "@/lib/api";
import { restoreSession, setAccessToken } from "@/store/authSlice";
import { makeStore, type AppStore } from "@/store/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    setAccessTokenHandler((token) => {
      store.dispatch(setAccessToken(token));
    });
    store.dispatch(restoreSession());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
