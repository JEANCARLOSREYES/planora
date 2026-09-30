import { NextResponse, type NextRequest } from "next/server";
import { savePageContent } from "@/lib/server/pages";
import { z } from "zod";
import { isSameOrigin } from "@/lib/request-origin";
import { WorkspaceError } from "@/lib/server/errors";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  if (!isSameOrigin(origin, request.headers.get("host")))
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  try {
    const text = await request.text();
    if (text.length > 550_000)
      return NextResponse.json(
        { error: "This page is too large to save." },
        { status: 413 },
      );
    const { id } = await params;
    const result = await savePageContent(id, JSON.parse(text));
    return NextResponse.json(result);
  } catch (error) {
    const invalid = error instanceof z.ZodError || error instanceof SyntaxError;
    const message =
      error instanceof z.ZodError
        ? error.issues[0].message
        : error instanceof WorkspaceError
          ? error.message
          : "Unable to save this page. Your draft is kept on this device. Please try again.";
    return NextResponse.json(
      { error: message },
      {
        status: invalid
          ? 400
          : error instanceof WorkspaceError
            ? error.status
            : 500,
      },
    );
  }
}
