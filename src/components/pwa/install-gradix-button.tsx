"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALLED_STORAGE_KEY = "gradix-pwa-installed";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isIosSafari() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && "ontouchend" in document);
  const isSafari = /^((?!CriOS|FxiOS|EdgiOS|OPiOS).)*Safari/i.test(userAgent);

  return isIos && isSafari;
}

function registerDashboardServiceWorker() {
  if (process.env.NODE_ENV !== "production" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/dashboard/" }).catch(() => {
      // Installation support is optional; dashboard functionality must keep working.
    });
  });
}

export function InstallGradixButton({ collapsed = false }: { collapsed?: boolean }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    registerDashboardServiceWorker();
    const frame = window.requestAnimationFrame(() => {
      setInstalled(isStandaloneMode() || window.localStorage.getItem(INSTALLED_STORAGE_KEY) === "true");
      setIsIos(isIosSafari());
    });

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      setInstallPrompt(null);
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = useMemo(() => !installed && Boolean(installPrompt), [installPrompt, installed]);

  async function install() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      setInstalled(true);
      setInstallPrompt(null);
    }
  }

  if (installed) {
    return null;
  }

  if (!canInstall && !isIos) {
    return null;
  }

  if (collapsed) {
    return canInstall ? (
      <Button
        aria-label="Install Gradix"
        className="size-11 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-0 text-orange-200 hover:bg-orange-500/15"
        onClick={install}
        type="button"
        variant="ghost"
      >
        <Download className="size-4" aria-hidden="true" />
      </Button>
    ) : null;
  }

  return (
    <div className="rounded-2xl border border-orange-400/15 bg-orange-500/10 p-3 text-orange-50">
      {canInstall ? (
        <>
          <Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400" onClick={install} type="button">
            <Download className="size-4" aria-hidden="true" />
            Install Gradix
          </Button>
          <p className="mt-2 text-xs leading-5 text-orange-100/80">
            Install Gradix on this device for faster access to your school dashboard.
          </p>
        </>
      ) : (
        <p className={cn("flex gap-2 text-xs leading-5 text-orange-100/85")}>
          <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>On iPhone: tap Share, then Add to Home Screen.</span>
        </p>
      )}
    </div>
  );
}
