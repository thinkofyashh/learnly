import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { CustomCursor } from "@/components/CustomCursor";
import { SplashScreen } from "@/components/SplashScreen";
export const metadata: Metadata = {title:{default:"Learnly",template:"%s · Learnly"},description:"Turn handwritten notes into an intelligent learning library."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SplashScreen/><CustomCursor/><AppShell>{children}</AppShell></body></html>}
