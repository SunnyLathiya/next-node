"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, type AuthError } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Field, buttonClass, inputClass } from "@/components/Field";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      router.push("/");
    } catch (err) {
      const authError = err as AuthError;
      setFormError(authError.message || "Could not log in");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-[#6b645b]">
        New here?{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" error={errors.email}>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </Field>
        {formError ? <p className="text-sm text-[#9f2d2d]">{formError}</p> : null}
        <button className={buttonClass} disabled={pending} type="submit">
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
