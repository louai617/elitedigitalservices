"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children, className = "btn btn-primary", pendingText }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** A submit button that asks first — for deletes. */
export function ConfirmButton({ children, message = "Are you sure?", className = "btn btn-danger btn-sm" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
