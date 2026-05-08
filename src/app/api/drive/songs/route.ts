import { auth } from "@/auth";
import { driveService } from "@/services/DriveService";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const folderId = process.env.DRIVE_SHARED_FOLDER_ID;

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
