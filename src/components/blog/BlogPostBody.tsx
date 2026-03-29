import type { BlogContentSection } from "../../lib/blog/types";

type Props = { sections: BlogContentSection[] };

export default function BlogPostBody({ sections }: Props) {
  return (
    <div className="max-w-none space-y-4">
      {sections.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i} className="text-[15px] sm:text-base">
              {block.text}
            </p>
          );
        }
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={i}
              className={
                block.level === 2
                  ? "mt-10 text-xl font-bold tracking-tight text-white sm:text-2xl"
                  : "mt-8 text-lg font-semibold text-sky-100/95 sm:text-xl"
              }
            >
              {block.text}
            </Tag>
          );
        }
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag
            key={i}
            className={`mt-4 space-y-2 pl-5 text-[15px] sm:text-base ${
              block.ordered ? "list-decimal" : "list-disc"
            } marker:text-blue-400/90`}
          >
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
