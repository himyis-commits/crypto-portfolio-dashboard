"use client";

import * as React from "react";
import { LogIn, LogOut, MailCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthControls() {
  const { user, loading, enabled, signInWithOtp, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  if (!enabled) {
    return (
      <div className="hidden lg:block rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Cloud sync disabled
      </div>
    );
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <div className="max-w-[220px] truncate rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
          {user.email}
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="h-4 w-4" />
          Sign in for cloud sync
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync wallets across devices</DialogTitle>
          <DialogDescription>Sign in with Google (fastest) or use email magic link.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-1">
          <Button
            onClick={async () => {
              const { error } = await signInWithGoogle();
              setMessage(error ?? "Redirecting to Google...");
            }}
          >
            Continue with Google
          </Button>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">or</div>
          <Input
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Button
            onClick={async () => {
              const { error } = await signInWithOtp(email.trim());
              setMessage(error ?? "Magic link sent. Open your email and click the link.");
            }}
            disabled={!email.trim()}
          >
            <MailCheck className="h-4 w-4" />
            Send magic link
          </Button>
          {message ? <div className="text-xs text-muted-foreground">{message}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

