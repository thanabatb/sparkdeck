import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "TODO: /check command handler is not implemented yet." },
    { status: 501 }
  );
}
