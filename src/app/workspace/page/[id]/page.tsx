import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/server/workspace";
import { serializePage } from "@/lib/server/queries";
import { PageDocument } from "@/components/pages/page-document";
import type { EditorNode } from "@/lib/types";
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getWorkspace();
  const page = await db.page.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!page) notFound();
  return (
    <PageDocument
      key={page.id}
      page={serializePage(page)}
      content={page.content as EditorNode}
      revision={page.revision}
    />
  );
}
