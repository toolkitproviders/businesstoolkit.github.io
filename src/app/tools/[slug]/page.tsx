import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolLayout } from "@/components/tools/tool-layout";
import { getToolComponent } from "@/features/tool-registry";
import { toolMetadata } from "@/lib/seo";
import { getTool, toolSlugs } from "@/lib/tools";

/** Every tool is prerendered at build time, exactly as separate routes were. */
export function generateStaticParams() {
  return toolSlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return toolMetadata(tool);
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const Component = getToolComponent(slug);
  if (!Component) notFound();

  return (
    <ToolLayout tool={tool}>
      <Component toolSlug={slug} />
    </ToolLayout>
  );
}
