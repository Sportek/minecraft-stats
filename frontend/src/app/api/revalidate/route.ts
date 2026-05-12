import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * P.4.3 — On-demand revalidation pour invalider l'ISR depuis le backend
 * (ou n'importe quel client autorisé).
 *
 * Auth : header `x-revalidate-token` qui doit matcher `REVALIDATE_TOKEN` (env).
 * Si la variable d'env n'est pas configurée, la route refuse 503 (fail-closed).
 *
 * Body attendu (JSON) :
 *   { path: "/blog" }                  // revalidate un path
 *   { paths: ["/blog", "/"] }          // revalidate plusieurs paths
 *
 * Note : revalidation par tag non exposée ici. En Next.js 16, `revalidateTag`
 * requiert un `CacheLifeConfig` et est restreint aux Server Actions — usage trop
 * spécifique pour cette route générique. À implémenter séparément si besoin.
 *
 * Exemple côté backend :
 *   fetch("https://frontend/api/revalidate", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", "x-revalidate-token": token },
 *     body: JSON.stringify({ path: `/servers/${serverId}` }),
 *   })
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "REVALIDATE_TOKEN not configured on this deployment" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-revalidate-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { path?: string; paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const revalidatedPaths: string[] = [];

  if (body.path) {
    revalidatePath(body.path);
    revalidatedPaths.push(body.path);
  }
  if (Array.isArray(body.paths)) {
    for (const p of body.paths) {
      revalidatePath(p);
      revalidatedPaths.push(p);
    }
  }

  if (revalidatedPaths.length === 0) {
    return NextResponse.json(
      { error: "Provide `path` or `paths` in body" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    revalidated: true,
    paths: revalidatedPaths,
    now: Date.now(),
  });
}
