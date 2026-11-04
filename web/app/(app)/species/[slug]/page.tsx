import { SpeciesView } from "@/components/SpeciesView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SpeciesView slug={slug} />;
}
