import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, Loader2, ChevronDown } from 'lucide-react';
import { ALL_LANGUAGES, switchLanguage, type LanguageCode } from '../../lib/dynamic-i18n';

/**
 * Language selector dropdown.
 * Static languages (EN/PL/RO) switch instantly.
 * Dynamic languages show a loading state while Claude translates the UI.
 */
export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = ALL_LANGUAGES.find((l) => l.code === i18n.language)
    ?? ALL_LANGUAGES[0];

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open]);

  const handleSelect = async (code: LanguageCode) => {
    if (code === i18n.language) {
      setOpen(false);
      return;
    }

    setLoading(code);
    const success = await switchLanguage(code);

    if (success) {
      // Update document direction for RTL languages
      const rtlLanguages = ['ar', 'ur', 'fa', 'ps'];
      document.documentElement.dir = rtlLanguages.includes(code) ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
    }

    setLoading(null);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{currentLang?.flag}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-border rounded-xl shadow-lg z-50"
          role="listbox"
          aria-label="Languages"
        >
          {/* Static languages first */}
          <div className="p-1.5">
            <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-light uppercase tracking-wide">
              Built-in
            </p>
            {ALL_LANGUAGES.filter((l) => l.static).map((lang) => (
              <LanguageOption
                key={lang.code}
                lang={lang}
                isActive={i18n.language === lang.code}
                isLoading={loading === lang.code}
                onSelect={() => handleSelect(lang.code)}
              />
            ))}
          </div>

          <div className="border-t border-border my-1" />

          {/* Dynamic languages */}
          <div className="p-1.5">
            <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-light uppercase tracking-wide">
              Auto-translated
            </p>
            {ALL_LANGUAGES.filter((l) => !l.static).map((lang) => (
              <LanguageOption
                key={lang.code}
                lang={lang}
                isActive={i18n.language === lang.code}
                isLoading={loading === lang.code}
                onSelect={() => handleSelect(lang.code)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageOption({
  lang,
  isActive,
  isLoading,
  onSelect,
}: {
  lang: (typeof ALL_LANGUAGES)[number];
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
        isActive
          ? 'bg-shield-light text-shield-dark font-medium'
          : 'text-navy hover:bg-surface'
      }`}
      role="option"
      aria-selected={isActive}
    >
      <span className="text-base flex-shrink-0">{lang.flag}</span>
      <span className="flex-1 truncate">{lang.label}</span>
      {isLoading && (
        <Loader2 className="h-3.5 w-3.5 text-slate animate-spin flex-shrink-0" />
      )}
      {isActive && !isLoading && (
        <Check className="h-3.5 w-3.5 text-shield flex-shrink-0" />
      )}
    </button>
  );
}
