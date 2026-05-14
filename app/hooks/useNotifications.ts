import { useCallback, useEffect, useRef, useState } from "react";

function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
    osc2.connect(gain);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);
  } catch {
    // audio not available
  }
}

export type NotificationPermissionState = NotificationPermission | "unsupported";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as NotificationPermission;
    }
  }, []);

  const notify = useCallback(
    (title: string, body: string, onClickUrl?: string) => {
      if (permission !== "granted") return;

      try {
        playChime();
        const n = new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: body,
        });
        if (onClickUrl) {
          n.onclick = () => {
            window.focus();
            n.close();
          };
        }
      } catch {
        // notification failed
      }
    },
    [permission],
  );

  return { permission, requestPermission, notify, playChime };
}

export function useNewEmailNotifications(
  emailIds: string[],
  mailboxLabel: string,
  notify: (title: string, body: string) => void,
) {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const lastNotifiedRef = useRef<number>(0);

  useEffect(() => {
    if (emailIds.length === 0) return;

    const seen = seenIdsRef.current;
    const now = Date.now();

    for (const id of emailIds) {
      if (!seen.has(id)) {
        seen.add(id);

        if (seen.size > 1 && now - lastNotifiedRef.current > 5000) {
          lastNotifiedRef.current = now;
          notify(
            `New email in ${mailboxLabel}`,
            "A new message has arrived in your inbox",
          );
          break;
        }
      }
    }
  }, [emailIds, mailboxLabel, notify]);
}
