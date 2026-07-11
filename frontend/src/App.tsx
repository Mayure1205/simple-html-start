import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  AccountPanel, AnalyticsPanel, FailuresPanel, IngestionPanel, OverviewPanel, WalletsPanel,
} from "@/components/Panels";
import { api, auth } from "@/lib/api";

export default function App() {
  const [section, setSection] = useState<string>(() => window.location.hash.replace("#", "") || "overview");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const onHash = () => setSection(window.location.hash.replace("#", "") || "overview");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { window.location.hash = section; }, [section]);

  useEffect(() => {
    if (!auth.get()) return;
    api.me().then(setUser).catch(() => { auth.clear(); setUser(null); });
  }, []);

  const panel = (() => {
    switch (section) {
      case "ingestion": return <IngestionPanel />;
      case "analytics": return <AnalyticsPanel />;
      case "wallets": return <WalletsPanel signedIn={!!user} />;
      case "failures": return <FailuresPanel />;
      case "account": return <AccountPanel user={user} onAuthed={setUser} onSignOut={() => { auth.clear(); setUser(null); }} />;
      default: return <OverviewPanel />;
    }
  })();

  return (
    <div className="min-h-screen flex">
      <Sidebar active={section} onSelect={setSection} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar section={section} onNav={setSection} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="max-w-[1400px] mx-auto"
            >
              {panel}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
