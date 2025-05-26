import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSideBar from "@/components/AppSideBar";
import EntryProvider from "@/providers/EntryProvider";

export const metadata: Metadata = {
  title: "BrainStorm - AI Journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EntryProvider>
          <SidebarProvider>
            <AppSideBar />
            <div className="flex min-h-screen w-full flex-col">
              <Header />
              <main className="flex flex-1 flex-col px-4 pt-10 xl:px-8">
                <SidebarTrigger className="absolute" />
                {children}
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </EntryProvider>
      </body>
    </html>
  );
}
