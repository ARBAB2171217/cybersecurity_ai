"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onFailure: (error: string) => void;
}

/**
 * Reads the Google Client ID from the environment variable.
 *
 * Bug fix: the previous implementation fell back to the string
 * "cybershield-google-sso" when the env var was undefined. Google's SDK
 * uses this Client ID to verify that the current origin (e.g. localhost:3000)
 * is an Authorized JavaScript Origin registered in Google Cloud Console.
 * When a fake/placeholder string is passed instead of a real Client ID,
 * Google cannot look up the allowed origins and throws:
 *   [GSI_LOGGER]: The given origin is not allowed for the given client ID
 *
 * The fix: never use a fake fallback. If the variable is missing, log a
 * clear dev-mode warning and render nothing so the error is obvious.
 */
function getGoogleClientId(): string | null {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId || clientId.trim() === "") {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[GoogleLoginButton] ⚠️  NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set or empty.\n" +
        "Google Sign-In will be disabled until this is configured in frontend/.env.local.\n" +
        "Expected format: NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com"
      );
    }
    return null;
  }

  return clientId.trim();
}

export function GoogleLoginButton({ onSuccess, onFailure }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Resolve Client ID once at render time (not inside useEffect) so it is
  // available synchronously on the first render cycle.
  const clientId = getGoogleClientId();

  useEffect(() => {
    // If the Client ID is missing, do not attempt to load the Google SDK —
    // it would initialize with an invalid ID and throw the origin error.
    if (!clientId) return;
    if (typeof window === "undefined") return;

    if ((window as any).google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => onFailure("Failed to load Google Identity Services SDK.");
    document.head.appendChild(script);
  }, [clientId, onFailure]);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !clientId) return;

    try {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onFailure("No credential returned from Google.");
          }
        },
      });

      google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_dark",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 382,
      });
    } catch (err: any) {
      onFailure(err.message || "Failed to initialize Google Sign-In.");
    }
  }, [scriptLoaded, clientId, onSuccess, onFailure]);

  // If no valid Client ID is configured, render nothing rather than a broken button.
  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full flex justify-center min-h-[44px]">
      <div ref={containerRef} className="w-full max-w-[382px]" />
    </div>
  );
}

export default GoogleLoginButton;
