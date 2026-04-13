import Link from "next/link";

type InlineCTAProps = {
  heading?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: "inline" | "banner" | "sidebar";
};

export function InlineCTA({
  heading = "Hai ricevuto una multa?",
  text = "Scopri gratuitamente se puoi contestarla. Carica una foto del verbale.",
  buttonText = "Analizza il tuo verbale",
  buttonUrl = "/upload",
  variant = "inline",
}: InlineCTAProps) {
  if (variant === "banner") {
    return (
      <div className="my-8 rounded-xl bg-primary/10 border border-primary/20 p-6 text-center">
        <h3 className="text-lg font-bold">{heading}</h3>
        <p className="mt-2 text-sm text-muted">{text}</p>
        <Link
          href={buttonUrl}
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
        >
          {buttonText}
        </Link>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-lg border border-border bg-card p-5">
      <h4 className="font-semibold">{heading}</h4>
      <p className="mt-1 text-sm text-muted">{text}</p>
      <Link
        href={buttonUrl}
        className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        {buttonText}
      </Link>
    </div>
  );
}
