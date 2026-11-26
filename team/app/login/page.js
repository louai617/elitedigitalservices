import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-gold/15 blur-[130px]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" gid="ems-gold-login" />
          <h1 className="mt-5 text-2xl font-bold">EMS Team Space</h1>
          <p className="mt-1 text-sm text-mute">Sign in with your staff account</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-mute">Forgot your password? Ask your project manager to reset it.</p>
      </div>
    </main>
  );
}
