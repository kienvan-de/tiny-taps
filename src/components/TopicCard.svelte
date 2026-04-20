<script lang="ts">
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
  }

  let {
    id,
    title,
    slug,
    backgroundUrl = null,
    tags = [],
  }: Props = $props();

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

  function tagStyle(category: string): string {
    if (category === 'age') {
      return 'background:#e0f2fe; color:#0369a1;';
    }
    return 'background:#dcfce7; color:#166534;';
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="topic-card"
  class:pressed={isPressed}
  role="button"
  tabindex="0"
  aria-label={`Open topic: ${title}`}
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
      <div class="bg-placeholder"></div>
    {/if}
    <!-- Gradient overlay for text legibility -->
    <div class="bg-gradient" aria-hidden="true"></div>
  </div>

  <!-- Content overlay -->
  <div class="card-content">
    <!-- Tags row (top) -->
    {#if tags.length > 0}
      <div class="tags-row">
        {#each tags.slice(0, 3) as tag}
          <span class="tag-pill" style={tagStyle(tag.category)}>
            {tag.name}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Title (bottom) -->
    <div class="card-title">{title}</div>
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
    background: linear-gradient(135deg, #4BA3FF 0%, #6BCB77 100%);
  }

  .bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.0) 40%,
      rgba(0, 0, 0, 0.55) 100%
    );
  }

  /* ── Content overlay ──────────────────────────────────────────────────── */
  .card-content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    box-sizing: border-box;
  }

  /* ── Tags ─────────────────────────────────────────────────────────────── */
  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-self: flex-start;
  }

  .tag-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'Nunito', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.02em;
    backdrop-filter: blur(4px);
    white-space: nowrap;
  }

  /* ── Title ─────────────────────────────────────────────────────────────── */
  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(16px, 3vw, 24px);
    font-weight: 800;
    color: white;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    line-height: 1.2;
    word-break: break-word;
    pointer-events: none;
  }
</style>