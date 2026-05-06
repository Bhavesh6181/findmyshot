import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "FindMyShot — Find Every Photo of You",
  description:
    "Face recognition powered photo finder. Upload a selfie, find every photo of you from any event.",
  keywords: ["photo finder", "face recognition", "event photos", "FindMyShot"],
  openGraph: {
    title: "FindMyShot — Find Every Photo of You",
    description: "Upload a selfie, find every photo of you from any event.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-void font-sans antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
