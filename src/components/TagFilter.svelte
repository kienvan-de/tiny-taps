<script lang="ts">
  import { getT, DEFAULT_LOCALE, type Locale } from '../lib/i18n';

  interface Tag {
    id: string;
    name: string;
    category: string;
    icon?: string | null;
  }

  interface Props {
    tags: Tag[];
    activeTagId?: string | null;
    onSelect?: (tagId: string | null) => void;
    locale?: Locale;
  }

  let {
    tags = [],
    activeTagId = null,
    onSelect,
    locale = DEFAULT_LOCALE,
  }: Props = $props();

  let t = $derived(getT(locale));

  // Convert PascalCase icon name from DB to Phosphor CSS class
  // e.g. "PawPrint" → "ph-paw-print"
  function iconClass(name: string | null | undefined): string {
    if (!name) return 'ph-tag';
    const kebab = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    return `ph-${kebab}`;
  }

  function handleSelect(tagId: string | null) {
    const next = tagId !== null && tagId === activeTagId ? null : tagId;
    onSelect?.(next);
  }

  function handleKeydown(e: KeyboardEvent, tagId: string | null) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(tagId);
    }
  }
</script>

<div class="tag-filter" role="toolbar" aria-label={t.filterByTag}>
  <!-- "All" chip -->
  <button
    class="chip"
    class:active={activeTagId === null}
    onclick={() => handleSelect(null)}
    onkeydown={(e) => handleKeydown(e, null)}
    aria-pressed={activeTagId === null}
    aria-label={t.showAllTopics}
  >
    <i class="ph-bold ph-sparkle chip-icon-i" aria-hidden="true"></i>
    <span class="chip-label">{t.all}</span>
  </button>

  {#each tags as tag (tag.id)}
    <button
      class="chip"
      class:active={activeTagId === tag.id}
      onclick={() => handleSelect(tag.id)}
      onkeydown={(e) => handleKeydown(e, tag.id)}
      aria-pressed={activeTagId === tag.id}
      aria-label={`${t.filterByTag}: ${tag.name}`}
    >
      <i class="ph-bold {iconClass(tag.icon)} chip-icon-i" aria-hidden="true"></i>
      <span class="chip-label">{tag.name}</span>
    </button>
  {/each}
</div>

<style>
  .tag-filter {
    display: flex;
    flex-direction: row;
    gap: 10px;
    overflow-x: auto;
    padding: 4px 4px 12px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .tag-filter::-webkit-scrollbar {
    display: none;
  }

  /* ── Chip base ─────────────────────────────────────────────────────────── */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    min-height: 44px;
    padding: 8px 16px;
    border-radius: 999px;

    background: white;
    border: 2px solid #e2e8f0;
    color: #475569;

    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 800;
    white-space: nowrap;

    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;

    scroll-snap-align: start;

    transition:
      background 120ms ease-out,
      border-color 120ms ease-out,
      color 120ms ease-out,
      transform 80ms ease-out,
      box-shadow 80ms ease-out;

    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .chip:hover {
    background: #eff8ff;
    border-color: #4BA3FF;
    color: #0369a1;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(75, 163, 255, 0.2);
  }

  .chip:active {
    transform: scale(0.96);
  }

  .chip.active {
    background: #4BA3FF;
    border-color: #4BA3FF;
    color: white;
    box-shadow: 0 2px 10px rgba(75, 163, 255, 0.35);
  }

  .chip.active:hover {
    background: #2f8de8;
    border-color: #2f8de8;
    color: white;
  }

  .chip:focus-visible {
    outline: 3px solid #4BA3FF;
    outline-offset: 2px;
  }

  .chip-icon-i {
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
  }

  .chip-label {
    line-height: 1;
  }
</style>
