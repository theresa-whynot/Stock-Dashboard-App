import { useEffect, useState } from "react";

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

        setSchwabMessage(
          data.connected
            ? "Schwab is connected. Load account details when you are ready."
            : "Schwab is configured. Connect your account to load details.",
        );
      } catch {
        setSchwabMessage("Start the Python backend to use Schwab account details.");
      }
    }

    loadStatus();
  }, []);

  async function connectSchwab() {
    setSchwabLoading(true);

    try {
      const authorizationUrl = await getSchwabLoginUrl();
      window.location.href = authorizationUrl;
    } catch (error) {
      setSchwabMessage(error.message);
      setSchwabLoading(false);
    }
  }

  async function loadSchwabAccounts() {
    setSchwabLoading(true);
    setSchwabMessage("Loading Schwab account details...");

    try {
      const loadedAccounts = await getSchwabAccounts();
      setSchwabAccounts(loadedAccounts);
      setSchwabMessage("Showing read-only Schwab account details.");
      setSchwabStatus((currentStatus) =>
        currentStatus
          ? { ...currentStatus, connected: true }
          : { configured: true, connected: true },
      );
    } catch (error) {
      setSchwabMessage(error.message);
    } finally {
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
