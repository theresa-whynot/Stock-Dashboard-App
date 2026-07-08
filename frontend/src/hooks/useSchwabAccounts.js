import { useEffect, useRef, useState } from "react";

import {
  getSchwabAccounts,
  getSchwabLoginUrl,
  getSchwabStatus,
} from "../api/schwabApi";

export function useSchwabAccounts() {
  const [schwabStatus, setSchwabStatus] = useState(null);
  const [schwabMessage, setSchwabMessage] = useState("Checking Schwab setup...");
  const [schwabAccounts, setSchwabAccounts] = useState([]);
  const [schwabLoading, setSchwabLoading] = useState(false);
  const autoLoadStarted = useRef(false);

  async function loadSchwabAccounts() {
    setSchwabLoading(true);
    setSchwabMessage("Loading Schwab account details...");

    try {
      const loadedAccounts = await getSchwabAccounts();
      setSchwabAccounts(loadedAccounts);
      setSchwabMessage("Schwab connected. Positions loaded into the portfolio panel.");
      setSchwabStatus((currentStatus) =>
        currentStatus
          ? { ...currentStatus, connected: true }
          : { configured: true, connected: true },
      );
      return loadedAccounts;
    } catch (error) {
      setSchwabMessage(error.message);
      throw error;
    } finally {
      setSchwabLoading(false);
    }
  }

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getSchwabStatus();

        setSchwabStatus(data);

        if (!data.configured) {
          setSchwabMessage(
            "Add Schwab API credentials to backend/.env to enable account details.",
          );
          return;
        }

        if (data.connected) {
          setSchwabMessage("Schwab is connected. Loading account details...");

          if (!autoLoadStarted.current) {
            autoLoadStarted.current = true;
            try {
              await loadSchwabAccounts();
            } catch {
              // loadSchwabAccounts already updates the status message.
            }
          }
          return;
        }

        setSchwabMessage(
          "Schwab is configured. Connect your account to load details.",
        );
      } catch {
        setSchwabMessage("Start the Python backend to use Schwab account details.");
      }
    }

    loadStatus();
  }, []);

  async function connectSchwab() {
    if (schwabStatus?.connected) {
      try {
        await loadSchwabAccounts();
      } catch {
        // loadSchwabAccounts already updates the status message.
      }
      return;
    }

    setSchwabLoading(true);

    try {
      const authorizationUrl = await getSchwabLoginUrl();
      window.location.href = authorizationUrl;
    } catch (error) {
      setSchwabMessage(error.message);
      setSchwabLoading(false);
    }
  }

  return {
    schwabStatus,
    schwabMessage,
    schwabAccounts,
    schwabLoading,
    connectSchwab,
    loadSchwabAccounts,
  };
}
