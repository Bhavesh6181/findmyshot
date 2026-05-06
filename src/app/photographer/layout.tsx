import { auth } from "@auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

export default async function PhotographerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "photographer") {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
