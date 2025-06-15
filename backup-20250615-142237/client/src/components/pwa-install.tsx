import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  if (isInstalled) return null;

  const InstallInstructions = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">On Mobile (Android/iPhone):</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Chrome/Edge: Tap menu → "Add to Home screen"</li>
          <li>• Safari (iOS): Tap Share → "Add to Home Screen"</li>
          <li>• Look for install prompt at bottom of screen</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-2">On Desktop:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Look for install icon in address bar</li>
          <li>• Or browser menu → "Install BizWorx"</li>
        </ul>
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={deferredPrompt ? handleInstallClick : undefined}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Install App
        </Button>
      </DialogTrigger>
      {!deferredPrompt && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install BizWorx
            </DialogTitle>
            <DialogDescription>
              Install BizWorx as a native app for the best experience
            </DialogDescription>
          </DialogHeader>
          <InstallInstructions />
        </DialogContent>
      )}
    </Dialog>
  );
}