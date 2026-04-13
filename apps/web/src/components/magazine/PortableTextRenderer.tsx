import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/image";
import { InlineCTA } from "./InlineCTA";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 text-2xl font-bold" id={toSlug(children)}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 text-xl font-semibold" id={toSlug(children)}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-primary pl-4 italic text-muted">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-card px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    ),
    internalLink: ({ value, children }) => {
      const ref = value?.reference;
      if (!ref) return <>{children}</>;
      // Internal links resolved by slug
      return (
        <Link
          href={`/magazine/${ref.slug?.current || ""}`}
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {children}
        </Link>
      );
    },
    legalRef: ({ value, children }) => (
      <span className="group relative inline">
        <span className="border-b border-dashed border-muted cursor-help">
          {children}
        </span>
        {value?.norma && (
          <span className="absolute bottom-full left-0 mb-1 hidden rounded bg-card border border-border px-2 py-1 text-xs text-muted shadow-lg group-hover:block whitespace-nowrap">
            {value.norma}
            {value.url && (
              <>
                {" — "}
                <a
                  href={value.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Vedi norma
                </a>
              </>
            )}
          </span>
        )}
      </span>
    ),
  },
  types: {
    image: ({ value }) => (
      <figure className="my-6">
        {value?.asset && (
          <Image
            src={urlFor(value).width(800).url()}
            alt={value.alt || ""}
            width={800}
            height={450}
            className="rounded-lg"
          />
        )}
        {value?.caption && (
          <figcaption className="mt-2 text-center text-sm text-muted">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
    cta: ({ value }) =>
      value?.enabled !== false ? (
        <InlineCTA
          heading={value.heading}
          text={value.text}
          buttonText={value.buttonText}
          buttonUrl={value.buttonUrl}
          variant={value.variant}
        />
      ) : null,
    infoBox: ({ value }) => {
      const variantStyles: Record<string, string> = {
        info: "border-primary/30 bg-primary/5",
        warning: "border-warning/30 bg-warning/5",
        tip: "border-success/30 bg-success/5",
        legal: "border-muted/30 bg-card",
      };
      return (
        <div
          className={`my-6 rounded-lg border p-4 ${variantStyles[value.variant || "info"]}`}
        >
          {value.title && (
            <h4 className="mb-2 font-semibold">{value.title}</h4>
          )}
          <p className="text-sm leading-relaxed">{value.content}</p>
        </div>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
};

function toSlug(children: React.ReactNode): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((node as any).props.children);
  }
  return "";
}

export function PortableTextRenderer({ value }: { value: unknown[] }) {
  return (
    <div className="prose-custom">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PortableText value={value as any} components={components} />
    </div>
  );
}
