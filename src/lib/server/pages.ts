import { db } from "@/lib/db";
import { getWorkspace } from "./workspace";
import {
  contentSchema,
  extractText,
  pageCreateSchema,
  pageUpdateSchema,
  reorderSchema,
  editorSaveSchema,
} from "@/lib/validation";
import { templateContent, templates } from "@/lib/templates";
import { validateParent } from "@/lib/hierarchy";
import type { Prisma } from "@/generated/prisma/client";
import { validateEditorStructure } from "./editor-schema";
import { WorkspaceError } from "./errors";

export async function createPage(input: unknown) {
  const data = pageCreateSchema.parse(input);
  const workspace = await getWorkspace();
  const template =
    templates.find((item) => item.id === data.template) ?? templates[0];
  const content = templateContent(template.id);
  return db.$transaction(async (tx) => {
    const pages = await tx.page.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, parentId: true },
    });
    validateParent(pages, null, data.parentId ?? null);
    return tx.page.create({
      data: {
        title: data.title,
        workspaceId: workspace.id,
        parentId: data.parentId,
        icon: template.icon,
        content: content as Prisma.InputJsonValue,
        plainText: extractText(content),
        position: pages.length,
        cover: template.id === "blank" ? null : template.color,
      },
    });
  });
}
export async function updatePage(id: string, input: unknown) {
  const data = pageUpdateSchema.parse(input);
  const workspace = await getWorkspace();
  return db.$transaction(async (tx) => {
    const page = await tx.page.findFirstOrThrow({
      where: { id, workspaceId: workspace.id },
    });
    if (data.parentId !== undefined) {
      const pages = await tx.page.findMany({
        where: { workspaceId: workspace.id },
        select: { id: true, parentId: true },
      });
      validateParent(pages, id, data.parentId);
    }
    return tx.page.update({ where: { id: page.id }, data });
  });
}
export async function savePageContent(id: string, input: unknown) {
  const { content, revision } = editorSaveSchema.parse(input);
  validateEditorStructure(content);
  const workspace = await getWorkspace();
  const result = await db.page.updateMany({
    where: { id, workspaceId: workspace.id, revision },
    data: {
      content: content as Prisma.InputJsonValue,
      plainText: extractText(content),
      revision: { increment: 1 },
    },
  });
  if (!result.count)
    throw new WorkspaceError(
      "This page changed in another tab or was deleted. Your draft is kept on this device. Reload to compare versions.",
      409,
    );
  return { revision: revision + 1 };
}
export async function deletePage(id: string) {
  const workspace = await getWorkspace();
  return db.page.delete({ where: { id, workspaceId: workspace.id } });
}
export async function duplicatePage(id: string) {
  const workspace = await getWorkspace();
  return db.$transaction(async (tx) => {
    const source = await tx.page.findFirstOrThrow({
      where: { id, workspaceId: workspace.id },
    });
    const copyBranch = async (
      page: typeof source,
      parentId: string | null,
      root = false,
    ): Promise<string> => {
      const content = contentSchema.parse(page.content);
      const copy = await tx.page.create({
        data: {
          workspaceId: workspace.id,
          title: root ? `${page.title.slice(0, 153)} (copy)` : page.title,
          parentId,
          icon: page.icon,
          cover: page.cover,
          content: content as Prisma.InputJsonValue,
          plainText: page.plainText,
          position: page.position + 1,
        },
      });
      const children = await tx.page.findMany({
        where: { parentId: page.id, workspaceId: workspace.id },
      });
      for (const child of children) await copyBranch(child, copy.id);
      return copy.id;
    };
    return { id: await copyBranch(source, source.parentId, true) };
  });
}
export async function reorderPages(input: unknown) {
  const data = reorderSchema.parse(input);
  const workspace = await getWorkspace();
  await db.$transaction(async (tx) => {
    const siblings = await tx.page.findMany({
      where: { parentId: data.parentId, workspaceId: workspace.id },
      select: { id: true },
    });
    if (
      data.ids.length !== siblings.length ||
      new Set(data.ids).size !== siblings.length ||
      siblings.some((page) => !data.ids.includes(page.id))
    )
      throw new Error("The page list changed. Refresh and try again.");
    for (const [position, id] of data.ids.entries())
      await tx.page.update({ where: { id }, data: { position } });
  });
}
