import { useEffect } from "react";
import { SHELL } from "@/finance/shell";

export function FinanceApp() {
  useEffect(() => {
    const w = window as Window & {
      __mcfBoot?: boolean;
      __mcfBind?: () => void;
      showApp?: () => void;
    };
    const ready = () => {
      w.__mcfBind?.();
      w.showApp?.();
    };
    if (w.__mcfBoot) {
      ready();
      return;
    }
    w.__mcfBoot = true;
    const s = document.createElement("script");
    s.id = "finance-engine";
    s.src = "/finance-engine.js";
    s.onload = () => ready();
    document.body.appendChild(s);
  }, []);

  return <div className="finance-root" dangerouslySetInnerHTML={{ __html: SHELL }} />;
}
