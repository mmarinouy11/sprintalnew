"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

/** Labeled text input styled with design tokens. */
export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-background-fg">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-background-fg outline-none placeholder:text-muted focus:border-brand-fixed focus:ring-1 focus:ring-brand-fixed"
        {...props}
      />
    </label>
  );
}

/** Primary submit button — fixed brand #5C6AC4 via .btn-primary (rule #7). */
export function SubmitButton({
  children,
  pending,
  ...props
}: { pending?: boolean } & InputHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
  }) {
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className="btn-primary w-full rounded-md px-3 py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
    >
      {children}
    </button>
  );
}

/** Inline error banner. Renders nothing when message is empty. */
export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-signal-weak/40 bg-signal-weak/10 px-3 py-2 text-sm text-signal-weak"
    >
      {message}
    </p>
  );
}

/** "or" divider between password and OAuth. */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
