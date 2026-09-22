import Link from 'next/link';
import { linkifyParagraph } from '@/lib/blog/internal-links';

/**
 * Renders the article from structured data — never from raw HTML — so
 * generated content cannot inject markup into the page.
 */
export default function ArticleBody({ article, links }) {
  // One link target is used at most once across the whole article.
  const alreadyLinked = new Set();

  const renderParagraph = (text, key) => {
    const parts = linkifyParagraph(text, links, alreadyLinked);
    return (
      <p key={key} className="mb-5 leading-[1.8] text-muted-foreground">
        {parts.map((part, i) =>
          part.href ? (
            <Link
              key={i}
              href={part.href}
              className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              {part.text}
            </Link>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </p>
    );
  };

  return (
    <div className="text-base sm:text-lg">
      {article.intro && renderParagraph(article.intro, 'intro')}

      {article.sections.map((section, index) => (
        <section key={index} className="mt-10">
          <h2 className="mb-4 text-2xl font-semibold text-foreground sm:text-3xl">
            {section.heading}
          </h2>

          {section.paragraphs.map((text, i) => renderParagraph(text, `${index}-${i}`))}

          {section.list.length > 0 && (
            <ul className="mb-5 space-y-2.5 pl-5">
              {section.list.map((item, i) => (
                <li key={i} className="list-disc leading-[1.75] text-muted-foreground marker:text-primary">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
