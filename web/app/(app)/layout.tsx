import { TabBar } from "@/components/TabBar";
import { TopBar } from "@/components/TopBar";
import { AppFooter } from "@/components/AppFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="min-h-[calc(100dvh-3.5rem)] pb-24 md:pb-0 md:pl-24">{children}</main>
      <AppFooter />
      <TabBar />
    </>
  );
}
