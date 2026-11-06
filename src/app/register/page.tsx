"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, type AuthError } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Field, buttonClass, inputClass } from "@/components/Field";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await dispatch(
        registerUser({ name: name.trim(), email: email.trim(), password }),
      ).unwrap();
      router.push("/");
    } catch (err) {
      const authError = err as AuthError;
      if (authError.errors) {
        const fieldErrors: Record<string, string> = {};
        authError.errors.forEach((item) => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      }
      setFormError(authError.message || "Could not create account");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Register</h1>
      <p className="mt-2 text-[#6b645b]">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Name" error={errors.name}>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </Field>
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
            autoComplete="new-password"
          />
        </Field>
        {formError ? <p className="text-sm text-[#9f2d2d]">{formError}</p> : null}
        <button className={buttonClass} disabled={pending} type="submit">
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}
