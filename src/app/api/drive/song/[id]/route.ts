import { auth } from "@/auth";
import { driveService } from "@/services/DriveService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.accessToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const song = await driveService.getSongDetails(session.accessToken, id);
    
    let content = "";
    if (song.mimeType === 'application/vnd.google-apps.document') {
      content = await driveService.getSongContent(session.accessToken, id);
    }

    return NextResponse.json({ song, content });
  } catch (error) {
    console.error(`Error en API song ${id}:`, error);
    return NextResponse.json({ error: "Error al obtener canción" }, { status: 500 });
  }
}
