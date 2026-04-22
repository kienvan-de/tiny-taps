<script lang="ts">
  import { getT, DEFAULT_LOCALE, type Locale } from '../lib/i18n';

  interface Tag {
    id: string;
    name: string;
    category: string;
  }

  interface Props {
    id: string;
    title: string;
    slug: string;
    backgroundUrl?: string | null;
    tags?: Tag[];
    locale?: Locale;
  }

  let {
    id,
    title,
    slug,
    backgroundUrl = null,
    tags = [],
    locale = DEFAULT_LOCALE,
  }: Props = $props();

  let t = $derived(getT(locale));

  let isPressed = $state(false);
  let pointerId = $state<number | null>(null);

  function handlePointerDown(e: PointerEvent) {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isPressed = true;
  }

  function handlePointerUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    isPressed = false;
    window.location.href = `/topic/${slug}`;
  }

  function handlePointerCancel(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    isPressed = false;
  }

  function handlePointerLeave(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    if (isPressed) {
      pointerId = null;
      isPressed = false;
    }
  }

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  // Toddler-friendly bright solid colors — one per card, consistent via id hash
  const CARD_COLORS = [
    '#FF3131', // crayon red
    '#FF7A00', // crayon orange
    '#FFE600', // crayon yellow
    '#00D26A', // crayon green
    '#0095FF', // crayon blue
    '#BF5AF2', // crayon purple
    '#FF2D78', // crayon hot pink
    '#00C2FF', // crayon sky blue
    '#FF6000', // crayon amber
    '#00E5C4', // crayon mint
  ];

  function cardColor(id: string): string {
    // Simple hash of the id string → stable color per topic
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return CARD_COLORS[hash % CARD_COLORS.length];
  }

  function tagStyle(category: string): string {
    if (category === 'age') {
      return 'background:rgba(255,255,255,0.3); color:white;';
    }
    return 'background:rgba(255,255,255,0.3); color:white;';
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="topic-card"
  class:pressed={isPressed}
  role="button"
  tabindex="0"
  aria-label={`${t.openTopic}: ${title}`}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onpointerleave={handlePointerLeave}
  oncontextmenu={handleContextMenu}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = `/topic/${slug}`;
    }
  }}
>
  <!-- Background image layer -->
  <div class="card-bg">
    {#if backgroundUrl}
      <img
        src={backgroundUrl}
        alt=""
        class="bg-image"
        draggable="false"
        aria-hidden="true"
      />
    {:else}
      <div class="bg-placeholder" style="background:{cardColor(id)};"></div>
    {/if}
    <!-- Gradient overlay for text legibility -->
    <div class="bg-gradient" aria-hidden="true"></div>
  </div>

  <!-- Content overlay -->
  <div class="card-content">
    <!-- Title center -->
    <div class="card-title">{title}</div>

    <!-- Tags row below title -->
    {#if tags.length > 0}
      <div class="tags-row">
        {#each tags.slice(0, 3) as tag}
          <span class="tag-pill" style={tagStyle(tag.category)}>
            {tag.name}
          </span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .topic-card {
    position: relative;
    min-width: 200px;
    min-height: 200px;
    width: 100%;
    aspect-ratio: 1 / 1;

    border: 4px solid #4A4A4A;
    border-radius: 24px;
    overflow: hidden;
    cursor: pointer;

    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-user-drag: none;
    outline: none;

    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

    transition:
      transform 80ms ease-out,
      box-shadow 80ms ease-out;

    display: flex;
    flex-direction: column;
  }

  .topic-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  .topic-card.pressed {
    transform: scale(0.95);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .topic-card:focus-visible {
    outline: 4px solid #4BA3FF;
    outline-offset: 2px;
  }

  /* ── Background ───────────────────────────────────────────────────────── */
  .card-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .bg-placeholder {
    width: 100%;
    height: 100%;
    /* color set inline per card via cardColor(id) */
  }

  .bg-gradient {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
  }

  /* ── Content overlay ──────────────────────────────────────────────────── */
  .card-content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    box-sizing: border-box;
  }

  /* ── Title ────────────────────────────────────────────────────────────── */
  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(18px, 3.5vw, 28px);
    font-weight: 800;
    color: white;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    line-height: 1.2;
    text-align: center;
    word-break: break-word;
    pointer-events: none;
  }

  /* ── Tags ─────────────────────────────────────────────────────────────── */
  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
  }

  .tag-pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-family: 'Nunito', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.02em;
    backdrop-filter: blur(4px);
    white-space: nowrap;
  }
</style>