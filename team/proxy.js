import { NextResponse } from "next/server";

// Cheap gate: no session cookie, no app. The session itself is verified on
// the server by requireUser() in every page and action.
export function proxy(request) {
  const has = request.cookies.has("ems_team_session");
  if (!has) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/|favicon|logo|api/health).*)"],
};
