import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { LangProvider } from "@/lib/lang";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { migrateLegacyStorage } from "@/lib/storage-migrate";
import { useRegisterServiceWorker } from "@/lib/register-service-worker";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "RAYINE";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5, interactive-widget=resizes-content",
      },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "RAYINE — Connecter autrement. Rencontres sincères, amitiés, réseau professionnel, voyages et projets. Ouverte à tous les pays du monde.",
      },
      { property: "og:title", content: "RAYINE — Connecter autrement." },
      {
        property: "og:description",
        content:
          "Love, Friends, Pro, Travel, Projects : cinq univers pour créer des liens authentiques. Discussions sécurisées, profils vérifiés.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#101C2C" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  useRegisterServiceWorker();
  useEffect(() => {
    migrateLegacyStorage();
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("rayine:ref", ref.toUpperCase());
  }, []);
  return (
    <html lang="fr" className="dark antialiased" suppressHydrationWarning data-theme="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rayine.theme');if(t!=='light'&&t!=='dark')t='dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#F5F0E7':'#101C2C');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <LangProvider>
              <Outlet />
              <ThemedToaster />
            </LangProvider>
          </ThemeProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <Toaster
      theme={isLight ? "light" : "dark"}
      position="top-center"
      toastOptions={{
        style: isLight
          ? {
              background: "#ffffff",
              color: "#101c2c",
              border: "1px solid #d4c9b4",
            }
          : {
              background: "#172740",
              color: "#f5f0e7",
              border: "1px solid #2a3f5e",
            },
      }}
    />
  );
}
