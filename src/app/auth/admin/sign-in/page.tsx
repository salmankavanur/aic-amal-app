import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
// import {getServerSession} from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

export default async function SignIn() {
  // const session = getServerSession(authOptions)

  // if (!session || !["Super Admin", "Manager", "Admin"].includes(session?.user?.role)) {
  //   redirect("/admin");
  // }


  return <SignInForm />;
}
