import { Button } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, LoaderCircle, Radio } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { CrewDialogue } from "./Crew";

export function ActionButton({
  children,
  secondary,
  busy,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  secondary?: boolean;
  busy?: boolean;
}) {
  return (
    <Button
      unstyled
      {...props}
      disabled={props.disabled || busy}
      className={`button ${secondary ? "button-secondary" : ""} ${className}`}
    >
      {busy && <LoaderCircle size={17} className="spinner" />}
      {children}
    </Button>
  );
}
export function ButtonLink({
  to,
  children,
  secondary,
  className = "",
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`button ${secondary ? "button-secondary" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
export function Eyebrow({
  children,
  icon = true,
}: {
  children: ReactNode;
  icon?: boolean;
}) {
  return (
    <div className="eyebrow">
      {icon && <span className="signal-dot" />}
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  back,
}: {
  eyebrow: string;
  title: string;
  description: string;
  back?: string;
}) {
  return (
    <div className="page-heading">
      {back && (
        <Link className="back-link" to={back}>
          <ArrowLeft size={15} /> Back
        </Link>
      )}
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function Loading({
  label = "Connecting to mission control…",
}: {
  label?: string;
}) {
  return (
    <div className="state-panel" role="status">
      <LoaderCircle className="spinner" size={26} />
      <p>{label}</p>
    </div>
  );
}
export function ErrorPanel({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <Radio size={24} />
      <div>
        <strong>Connection check</strong>
        <p>{error.message}</p>
        {retry && (
          <ActionButton secondary onClick={retry}>
            Try again <ArrowRight size={16} />
          </ActionButton>
        )}
      </div>
    </div>
  );
}
export function Orbit({ children }: { children: ReactNode }) {
  return <CrewDialogue>{children}</CrewDialogue>;
}
export function Stepper({ step }: { step: number }) {
  return (
    <ol className="stepper" aria-label="Mission preparation">
      {[
        "Meet your crew",
        "Mission briefing",
        "Pack your gear",
        "Touchdown",
      ].map((title, i) => (
        <li
          key={title}
          className={i <= step ? "step-active" : ""}
          aria-current={i === step ? "step" : undefined}
        >
          <span>{i < step ? "✓" : `0${i + 1}`}</span>
          {title}
        </li>
      ))}
    </ol>
  );
}
