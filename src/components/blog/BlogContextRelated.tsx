import {
  getRelatedPostsForAirline,
  getRelatedPostsForAirport,
  getRelatedPostsForRoute,
} from "../../lib/blog/posts";
import BlogRelatedBlock from "./BlogRelatedBlock";

export function BlogRelatedForAirport({
  airportCode,
}: {
  airportCode: string;
}) {
  const posts = getRelatedPostsForAirport(airportCode);
  return (
    <BlogRelatedBlock
      title="Guides for this airport"
      posts={posts}
      className="mt-8"
    />
  );
}

export function BlogRelatedForAirline({ iata }: { iata: string }) {
  const posts = getRelatedPostsForAirline(iata);
  return (
    <BlogRelatedBlock
      title="Airline guides on the blog"
      posts={posts}
      className="mt-8"
    />
  );
}

export function BlogRelatedForRoute({
  origin,
  dest,
}: {
  origin: string;
  dest: string;
}) {
  const posts = getRelatedPostsForRoute(origin, dest);
  return (
    <BlogRelatedBlock
      title="Articles for this route"
      posts={posts}
      className="mt-8"
    />
  );
}
