import type { LearnlyDocument } from "@/types/document";

export interface TopicSummary {
  name: string;
  slug: string;
  count: number;
}

export function toTopicSlug(topic: string): string {
  return topic
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function collectTopics(documents: LearnlyDocument[]): TopicSummary[] {
  const counts = new Map<string, { name: string; count: number }>();

  documents.forEach((document) => {
    document.topics.forEach((topic) => {
      const name = topic.trim();
      const slug = toTopicSlug(name);
      if (!name || !slug) return;

      const current = counts.get(slug);
      counts.set(slug, { name: current?.name ?? name, count: (current?.count ?? 0) + 1 });
    });
  });

  return [...counts.entries()]
    .map(([slug, topic]) => ({ slug, ...topic }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}
