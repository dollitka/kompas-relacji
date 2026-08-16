export { default } from "next-auth/middleware";

// Middleware next-auth automatycznie przekierowuje niezalogowanych użytkowników
// do /login (patrz pages.signIn w lib/auth.ts). To dodatkowa warstwa ochrony
// oprócz sprawdzania sesji wewnątrz każdej strony/trasy API — obie warstwy są
// celowe (defense in depth): middleware chroni całe segmenty tras, a
// getCurrentUser/requireUser chronią pojedyncze zasoby (np. dostęp tylko do
// WŁASNYCH rozmów, nie cudzych).
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/patterns/:path*",
    "/memory/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
