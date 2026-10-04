"use client";

import { LANGUAGES, useLang } from "../lib/i18n";

export default function LanguageSwitcher() {
  const { lang, changeLang } = useLang();
  return (
    <select
      value={lang}
      onChange={(e) => changeLang(e.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Select language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
