import type { MetadataRoute } from "next";

// Next.js automatycznie wykrywa ten plik i podpina go jako
// <link rel="manifest">, dzięki czemu telefon wie, jak ma wyglądać ikonka
// i nazwa aplikacji po dodaniu jej do ekranu głównego ("Add to Home Screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kompas Relacji",
    short_name: "Kompas Relacji",
    description: "Prywatny asystent AI pomagający zrozumieć konflikty i wzorce w związku.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9FC",
    theme_color: "#2D2A4A",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
