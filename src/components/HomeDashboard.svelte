<script lang="ts">
  import TagFilter from './TagFilter.svelte';
  import TopicCard from './TopicCard.svelte';
  import Pagination from './Pagination.svelte';
  import { SparkleIcon } from 'phosphor-svelte';

  // ── Types ──────────────────────────────────────────────────────────────
  interface Tag {
    id: string;
    name: string;
    category: string;
    icon?: string | null;
  }

  interface Topic {
    id: string;
    title: string;
    slug: string;
    backgroundUrl: string | null;
    tags: Tag[];
  }

  interface ApiResponse {
    topics: Topic[];
    allTags: Tag[];
    pagination: { page: number; pageSize: number; total: number };
  }

  // ── Reactive state ─────────────────────────────────────────────────────
  let activeTagId = $state<string | null>(null);
  let page = $state(1);
  const pageSize = 20;

  // Flat list of all tags (derived from first successful fetch — stable)
  let allTags = $state<Tag[]>([]);

  // Flat list of topics for the current page+tag
  let topics = $state<Topic[]>([]);
  let total = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // ── Fetch logic ────────────────────────────────────────────────────────
  async function fetchTopics(tagId: string | null, p: number) {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (tagId) params.set('tag', tagId);

      const res = await fetch(`/api/topics?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();

      topics = data.topics ?? [];
      total = data.pagination?.total ?? 0;

      // Always update tags from the dedicated allTags field in the response
      if (data.allTags?.length) {
        allTags = data.allTags;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load topics';
    } finally {
      loading = false;
    }
  }

  // ── Initial fetch + reactive re-fetch ─────────────────────────────────
  // Capture reactive values synchronously so Svelte 5 tracks them,
  // then fire the async fetch — this is the correct pattern for async $effect
  $effect(() => {
    const tagId = activeTagId;
    const p = page;
    fetchTopics(tagId, p);
  });

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleTagSelect(tagId: string | null) {
    page = 1; // reset to first page on tag change
    if (tagId === activeTagId) {
      // Same value — $effect won't re-run, force a manual fetch
      fetchTopics(tagId, 1);
    } else {
      activeTagId = tagId;
    }
  }

  function handlePage(p: number) {
    page = p;
    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<!-- ── Tag filter ──────────────────────────────────────────────────────── -->
<div class="filter-row">
  <TagFilter
    tags={allTags}
    activeTagId={activeTagId}
    onSelect={handleTagSelect}
  />
</div>

<!-- ── Topic grid ─────────────────────────────────────────────────────── -->
<main class="content">
  {#if loading}
    <div class="loading-state" aria-live="polite" aria-label="Loading topics">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  {:else if error}
    <div class="empty-state">
      <div class="empty-icon"><SparkleIcon weight="bold" size={64} color="#FFD93D" /></div>
      <div class="empty-text">Oops!</div>
      <div class="empty-sub">{error}</div>
    </div>
  {:else if topics.length === 0}
    <div class="empty-state">
      <div class="empty-icon"><SparkleIcon weight="bold" size={64} color="#FFD93D" /></div>
      <div class="empty-text">No topics yet!</div>
      <div class="empty-sub">Check back soon for new content.</div>
    </div>
  {:else}
    <div class="topic-grid">
      {#each topics as topic (topic.id)}
        <TopicCard
          id={topic.id}
          title={topic.title}
          slug={topic.slug}
          backgroundUrl={topic.backgroundUrl}
          tags={topic.tags}
        />
      {/each}
    </div>

    {#if Math.ceil(total / pageSize) > 1}
      <div class="pagination-wrap">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={handlePage}
        />
      </div>
    {/if}
  {/if}
</main>

<style>
  .filter-row {
    padding: 4px 16px 0;
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    padding: 16px 20px 32px;
    overflow-y: auto;
  }

  .topic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .pagination-wrap {
    margin-top: 24px;
  }

  /* ── Loading dots ─────────────────────────────────────────────────────── */
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
  }

  .loading-dots {
    display: flex;
    gap: 10px;
  }

  .loading-dots span {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4BA3FF;
    animation: bounce 1.2s ease-in-out infinite;
  }

  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40%           { transform: scale(1.0); opacity: 1.0; }
  }

  /* ── Empty / error state ──────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .empty-icon {
    margin-bottom: 16px;
  }

  .empty-text {
    font-family: 'Nunito', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #4A4A4A;
    margin-bottom: 8px;
  }

  .empty-sub {
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    color: #94a3b8;
  }
</style>
