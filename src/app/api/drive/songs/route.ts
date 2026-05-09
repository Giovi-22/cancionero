import { auth } from "@/auth";
import { driveService } from "@/services/DriveService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  const searchParams = request.nextUrl.searchParams;
  const customFolderId = searchParams.get('folderId');
  const folderId = customFolderId || process.env.DRIVE_SHARED_FOLDER_ID;

  if (!session?.accessToken || !folderId) {
    return NextResponse.json({ error: "No autorizado o falta folderId" }, { status: 401 });
  }

  try {
    const data = await driveService.getSongsFromFolder(session.accessToken, folderId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en API songs:", error);
    return NextResponse.json({ error: "Error al obtener canciones" }, { status: 500 });
  }
}
