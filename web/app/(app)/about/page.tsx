import { AboutCredits } from "@/components/AboutCredits";
import { Placeholder } from "@/components/Placeholder";
import { SafetyNotice } from "@/components/SafetyNotice";

export default function Page() {
  return (
    <>
      <Placeholder page="about" />
      <div className="mx-auto max-w-2xl px-4 pb-4"><SafetyNotice size="md" /></div>
      <AboutCredits />
    </>
  );
}
