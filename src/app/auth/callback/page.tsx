"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    const run = async () => {
      if (!supabase) {
        router.replace("/");
        return;
      }

      const search = window.location.search;
      if (search.includes("code=")) {
        const code = new URLSearchParams(search).get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      }

      const hash = window.location.hash;
      if (hash.includes("access_token=") && hash.includes("refresh_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token }).catch(() => null);
        }
      }

      router.replace("/");
    };
    void run();
  }, [router]);

  return (
    <div className="container py-20 text-center text-sm text-muted-foreground">
      Finishing sign-in...
    </div>
  );
}

