"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import type { PostInput } from "@/lib/types";
import { Field, buttonClass, inputClass } from "./Field";

const empty: PostInput = { title: "", content: "", isPublic: true };

export function PostForm({
  initial = empty,
  submitLabel,
  onSubmit,
}: {
  initial?: PostInput;
  submitLabel: string;
  onSubmit: (values: PostInput) => Promise<void>;
}) {
  const [values, setValues] = useState<PostInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function validate(next: PostInput) {
    const fieldErrors: Record<string, string> = {};
    if (next.title.trim().length < 3) fieldErrors.title = "Title must be at least 3 characters";
    if (next.title.trim().length > 120) fieldErrors.title = "Title must be at most 120 characters";
    if (next.content.trim().length < 10) {
      fieldErrors.content = "Content must be at least 10 characters";
    }
    return fieldErrors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    setFormError("");
    if (Object.keys(fieldErrors).length > 0) return;

    setPending(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
        isPublic: values.isPublic,
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const nextErrors: Record<string, string> = {};
        err.errors.forEach((item) => {
          nextErrors[item.field] = item.message;
        });
        setErrors(nextErrors);
      }
      setFormError(err instanceof ApiError ? err.message : "Could not save post");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Title" error={errors.title}>
        <input
          className={inputClass}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
      </Field>
      <Field label="Content" error={errors.content}>
        <textarea
          className={`${inputClass} min-h-40`}
          value={values.content}
          onChange={(event) => setValues({ ...values, content: event.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isPublic}
          onChange={(event) => setValues({ ...values, isPublic: event.target.checked })}
        />
        Public. Other people can read this post.
      </label>
      {formError ? <p className="text-sm text-[#9f2d2d]">{formError}</p> : null}
      <button className={buttonClass} disabled={pending} type="submit">
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
