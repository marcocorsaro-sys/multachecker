import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

type ArticleCardProps = {
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt?: string;
  mainImage?: {
    asset?: { _id: string; url: string };
    alt?: string;
  };
  category?: { name: string; slug: { current: string } };
  author?: { name: string };
};

export function ArticleCard({
  title,
  slug,
  excerpt,
  publishedAt,
  mainImage,
  category,
  author,
}: ArticleCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/30 hover:bg-card-hover">
      {mainImage?.asset && (
        <Link href={`/magazine/${slug.current}`}>
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={urlFor(mainImage).width(640).height(360).url()}
              alt={mainImage.alt || title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </Link>
      )}
      <div className="p-4">
        {category && (
          <Link
            href={`/magazine/categoria/${category.slug.current}`}
            className="text-xs font-medium uppercase tracking-wide text-primary"
          >
            {category.name}
          </Link>
        )}
        <Link href={`/magazine/${slug.current}`}>
          <h3 className="mt-1 text-lg font-semibold leading-tight group-hover:text-primary transition">
            {title}
          </h3>
        </Link>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {author && <span>{author.name}</span>}
          {author && publishedAt && <span>&middot;</span>}
          {publishedAt && (
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      </div>
    </article>
  );
}
