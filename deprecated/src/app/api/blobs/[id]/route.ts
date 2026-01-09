/**
 * Blob API Route Handler
 * GET /api/blobs/[id] - Download a blob
 * DELETE /api/blobs/[id] - Delete a blob
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { R2Bucket } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { getBlobById, deleteBlobById, getBlobMetadata } from "@/lib/storage";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * GET /api/blobs/[id]
 * Download a blob by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get R2 bucket from Cloudflare context
    const ctx = await getCloudflareContext();
    const bucket = (ctx.env as unknown as { BLOBS?: R2Bucket }).BLOBS;

    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not available" },
        { status: 503 }
      );
    }

    // Get blob
    const blob = await getBlobById(bucket, userId, id);
    if (!blob) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    // Stream the response
    const headers = new Headers();
    headers.set(
      "Content-Type",
      blob.httpMetadata?.contentType || "application/octet-stream"
    );
    headers.set("Content-Length", blob.size.toString());

    // Set cache headers
    headers.set("Cache-Control", "private, max-age=3600");

    // Set filename for download
    const filename =
      blob.customMetadata?.filename || `${id}.${blob.httpMetadata?.contentType?.split("/")[1] || "bin"}`;
    headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(filename)}"`
    );

    // R2Object has body as ReadableStream
    const body = (blob as unknown as { body: ReadableStream }).body;

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Blob GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blobs/[id]
 * Delete a blob by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get R2 bucket from Cloudflare context
    const ctx = await getCloudflareContext();
    const bucket = (ctx.env as unknown as { BLOBS?: R2Bucket }).BLOBS;

    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not available" },
        { status: 503 }
      );
    }

    // Delete blob
    const deleted = await deleteBlobById(bucket, userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blob DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/blobs/[id]
 * Get blob metadata without content
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get R2 bucket from Cloudflare context
    const ctx = await getCloudflareContext();
    const bucket = (ctx.env as unknown as { BLOBS?: R2Bucket }).BLOBS;

    if (!bucket) {
      return new NextResponse(null, { status: 503 });
    }

    // Try to find the blob by checking all categories
    const categories = ["audio", "images", "exports", "other"];
    for (const category of categories) {
      const prefix = `${userId}/${category}/${id}`;
      const listed = await bucket.list({ prefix, limit: 1 });

      if (listed.objects.length > 0) {
        const key = listed.objects[0].key;
        const metadata = await getBlobMetadata(bucket, key);

        if (metadata) {
          const headers = new Headers();
          headers.set("Content-Type", metadata.mimeType);
          headers.set("Content-Length", metadata.sizeBytes.toString());
          headers.set("X-Blob-Id", metadata.id);
          headers.set("X-Blob-Category", metadata.category);
          headers.set("X-Blob-Created", metadata.createdAt);

          return new NextResponse(null, { status: 200, headers });
        }
      }
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error("Blob HEAD error:", error);
    return new NextResponse(null, { status: 500 });
  }
}

