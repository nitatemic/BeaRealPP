import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  User,
  ZoomIn,
  X,
  History,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const TRANSLATIONS = {
  fr: {
    headerTitle: "BeReal Profile Downloader",
    title: "Télécharger une photo de profil BeReal",
    subtitle: "Entrez un nom d'utilisateur pour afficher et télécharger sa photo de profil.",
    placeholder: "Nom d'utilisateur BeReal (ex: alex)",
    search: "Chercher",
    searching: "Recherche...",
    recents: "Récents :",
    loadingProfile: "Recherche du profil...",
    loadingPage: "Chargement de la page...",
    extractingImage: "Extraction de la photo de profil...",
    errorEmpty: "Veuillez saisir un nom d'utilisateur BeReal.",
    errorFetch: (user) => `Impossible d'accéder au profil de "${user}". Vérifiez l'orthographe du nom d'utilisateur.`,
    errorNotFound: (user) => `L'utilisateur "@${user}" n'existe pas ou sa photo n'est pas accessible.`,
    errorLoadImage: "Impossible de charger l'image.",
    download: "Télécharger l'image",
    downloading: "Téléchargement...",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié",
    viewProfile: "Profil BeReal",
    officialSite: "bere.al",
    close: "Fermer",
    clear: "Effacer",
    delete: "Supprimer",
    footer: "BeReal Profile Downloader — Non affilié à BeReal."
  },
  en: {
    headerTitle: "BeReal Profile Downloader",
    title: "Download a BeReal Profile Picture",
    subtitle: "Enter a username to view and download their profile picture.",
    placeholder: "BeReal username (e.g. alex)",
    search: "Search",
    searching: "Searching...",
    recents: "Recents:",
    loadingProfile: "Finding profile...",
    loadingPage: "Loading page...",
    extractingImage: "Extracting profile picture...",
    errorEmpty: "Please enter a BeReal username.",
    errorFetch: (user) => `Could not access profile for "${user}". Check username spelling.`,
    errorNotFound: (user) => `User "@${user}" does not exist or profile picture is not public.`,
    errorLoadImage: "Failed to load image.",
    download: "Download Image",
    downloading: "Downloading...",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    viewProfile: "BeReal Profile",
    officialSite: "bere.al",
    close: "Close",
    clear: "Clear",
    delete: "Delete",
    footer: "BeReal Profile Downloader — Not affiliated with BeReal."
  }
};

export default function App() {
  // Detect browser language (default to 'fr' if language starts with 'fr', otherwise 'en')
  const [lang, setLang] = useState(() => {
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
    return browserLang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('bereal_search_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load search history', e);
    }
  }, []);

  const saveToHistory = (user) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== user.toLowerCase());
      const updated = [user, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('bereal_search_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search history', e);
      }
      return updated;
    });
  };

  const removeFromHistory = (e, userToRemove) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== userToRemove);
      try {
        localStorage.setItem('bereal_search_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update search history', e);
      }
      return updated;
    });
  };

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const extractImageFromHTML = (htmlText, targetUrl) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    let imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="og:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[property="twitter:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content') ||
                   doc.querySelector('link[rel="image_src"]')?.getAttribute('href');

    if (!imageUrl) {
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (data.image) {
            imageUrl = typeof data.image === 'string' ? data.image : data.image.url;
            if (imageUrl) break;
          }
        } catch (_) {}
      }
    }

    if (!imageUrl) {
      const imgElements = Array.from(doc.querySelectorAll('img'));
      const profileImg = imgElements.find(img => {
        const src = img.getAttribute('src') || '';
        return src.includes('bereal') || src.includes('profile') || src.includes('avatar');
      });
      if (profileImg) {
        imageUrl = profileImg.getAttribute('src');
      }
    }

    const pageTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                      doc.querySelector('title')?.textContent || '';
    
    let displayName = pageTitle.replace(/on BeReal/i, '').replace(/\(@[^)]+\)/, '').trim();

    if (imageUrl && imageUrl.startsWith('/')) {
      const urlObj = new URL(targetUrl);
      imageUrl = `${urlObj.origin}${imageUrl}`;
    }

    return { imageUrl, displayName };
  };

  const handleSearch = async (e, usernameOverride = null) => {
    if (e) e.preventDefault();
    const query = (usernameOverride !== null ? usernameOverride : username).trim().replace(/^@/, '');

    if (!query) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(t.loadingProfile);

    const targetUrl = `https://bere.al/${query}`;
    let htmlContent = null;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        setLoadingStep(t.loadingPage);
        const response = await fetchWithTimeout(CORS_PROXIES[i](targetUrl), {}, 7000);
        if (response.ok) {
          const text = await response.text();
          if (text && (text.includes('<html') || text.includes('bereal'))) {
            htmlContent = text;
            break;
          }
        }
      } catch (err) {
        console.warn(`Proxy ${i + 1} unavailable`, err);
      }
    }

    if (!htmlContent) {
      setLoading(false);
      setError(t.errorFetch(query));
      return;
    }

    setLoadingStep(t.extractingImage);

    try {
      const { imageUrl, displayName } = extractImageFromHTML(htmlContent, targetUrl);

      if (!imageUrl) {
        throw new Error("PROFIL_NON_TROUVE");
      }

      setResult({
        username: query,
        displayName: displayName || query,
        profilePicUrl: imageUrl,
        targetUrl
      });
      saveToHistory(query);
    } catch (err) {
      setError(t.errorNotFound(query));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.profilePicUrl) return;

    setDownloading(true);
    try {
      let blob = null;

      try {
        const res = await fetchWithTimeout(result.profilePicUrl, { mode: 'cors' }, 6000);
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (e) {}

      if (!blob) {
        for (const proxyFn of CORS_PROXIES) {
          try {
            const res = await fetchWithTimeout(proxyFn(result.profilePicUrl), {}, 8000);
            if (res.ok) {
              blob = await res.blob();
              break;
            }
          } catch (e) {}
        }
      }

      if (!blob) {
        throw new Error("Failed to fetch file.");
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `bereal_${result.username}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ffffff', '#f59e0b', '#3b82f6']
      });
    } catch (err) {
      window.open(result.profilePicUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!result?.profilePicUrl) return;
    navigator.clipboard.writeText(result.profilePicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between selection:bg-white selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#090a0f]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
              BR
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              {t.headerTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg"
              title="Change language / Changer la langue"
            >
              <Globe size={14} />
              <span className="uppercase font-semibold text-white">{lang}</span>
            </button>

            <a
              href="https://bere.al"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
            >
              <span>{t.officialSite}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col items-center">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm">
            {t.subtitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-lg mx-auto mb-8">
          <form
            onSubmit={(e) => handleSearch(e)}
            className="relative flex items-center rounded-xl bg-slate-900 border border-slate-800 focus-within:border-slate-600 transition-all p-1.5"
          >
            <div className="pl-3 pr-2 text-slate-500">
              <User size={18} />
            </div>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none px-2 py-2"
            />

            {username && !loading && (
              <button
                type="button"
                onClick={() => setUsername('')}
                className="p-1 text-slate-400 hover:text-white mr-1 rounded-full transition-colors"
                title={t.clear}
              >
                <X size={16} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="bg-white hover:bg-slate-200 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{t.searching}</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>{t.search}</span>
                </>
              )}
            </button>
          </form>

          {/* Search History */}
          {history.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <History size={12} />
                {t.recents}
              </span>
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={(e) => {
                    setUsername(item);
                    handleSearch(e, item);
                  }}
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  <span>@{item}</span>
                  <span
                    onClick={(e) => removeFromHistory(e, item)}
                    className="hover:text-red-400 ml-0.5"
                    title={t.delete}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-md mx-auto my-8 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-slate-400" />
            <p className="text-slate-300 text-sm font-medium">{loadingStep}</p>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="w-full max-w-lg mx-auto my-4 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div className="w-full max-w-md mx-auto my-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center shadow-xl">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer mb-5"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-slate-700 bg-black">
                <img
                  src={result.profilePicUrl}
                  alt={`Profile picture of ${result.username}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={() => setError(t.errorLoadImage)}
                />
              </div>

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition duration-200 flex items-center justify-center text-white">
                <ZoomIn size={22} />
              </div>
            </div>

            {/* Username */}
            <div className="text-center space-y-0.5 mb-6">
              <h2 className="text-xl font-bold text-white">{result.displayName}</h2>
              <p className="text-slate-400 text-sm">@{result.username}</p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{t.downloading}</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>{t.download}</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">{t.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>{t.copyLink}</span>
                    </>
                  )}
                </button>

                <a
                  href={result.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <span>{t.viewProfile}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lightbox */}
        {isModalOpen && result && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative max-w-lg w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute -top-10 right-0 text-slate-400 hover:text-white"
                title={t.close}
              >
                <X size={24} />
              </button>

              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl max-h-[70vh]">
                <img
                  src={result.profilePicUrl}
                  alt={`Profile picture of ${result.username}`}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>

              <div className="mt-4 flex items-center justify-between w-full px-1">
                <span className="text-slate-300 font-medium text-sm">@{result.username}</span>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-white hover:bg-slate-200 text-black font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                >
                  <Download size={14} />
                  <span>{t.download}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
