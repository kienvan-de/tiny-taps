<script lang="ts">
  import {
    SparkleIcon, PawPrintIcon, CarIcon, ForkKnifeIcon, PaletteIcon,
    DiamondIcon, NumberSquareOneIcon, PlantIcon, TagIcon,
    BabyIcon, UserIcon, UsersThreeIcon
  } from 'phosphor-svelte';

  interface Tag {
    id: string;
    name: string;
    category: string;
    emoji?: string;
  }

  interface Props {
    tags: Tag[];
    activeTagId?: string | null;
    onchange?: (tagId: string | null) => void;
  }

  let {
    tags = [],
    activeTagId = null,
    onchange,
  }: Props = $props();

  const TAG_ICONS: Record<string, any> = {
    '0-1': BabyIcon,
    '1-2': BabyIcon,
    '2-3': UserIcon,
    '3+': UsersThreeIcon,
    'Animals': PawPrintIcon,
    'Vehicles': CarIcon,
    'Food': ForkKnifeIcon,
    'Colors': PaletteIcon,
    'Shapes': DiamondIcon,
    'Numbers': NumberSquareOneIcon,
    'Nature': PlantIcon,
  };

  function getTagIcon(tag: Tag): any {
    return TAG_ICONS[tag.name] ?? TagIcon;
  }

  function handleSelect(tagId: string | null) {
    onchange?.(tagId === activeTagId ? null : tagId);
  }

  function handleKeydown(e: KeyboardEvent, tagId: string | null) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(tagId);
    }
  }
</script>

<div class="tag-filter" role="toolbar" aria-label="Filter by tag">
  <!-- "All" chip -->
  <button
    class="chip"
    class:active={activeTagId === null}
    onclick={() => handleSelect(null)}
    onkeydown={(e) => handleKeydown(e, null)}
    aria-pressed={activeTagId === null}
    aria-label="Show all topics"
  >
    <span class="chip-icon"><SparkleIcon weight="bold" size={18} /></span>
    <span class="chip-label">All</span>
  </button>

  {#each tags as tag (tag.id)}
    <button
      class="chip"
      class:active={activeTagId === tag.id}
      onclick={() => handleSelect(tag.id)}
      onkeydown={(e) => handleKeydown(e, tag.id)}
      aria-pressed={activeTagId === tag.id}
      aria-label={`Filter by ${tag.name}`}
    >
      <span class="chip-icon">
        <svelte:component this={getTagIcon(tag)} weight="bold" size={18} />
      </span>
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

    /* Minimum 44px height for touch targets (parent dashboard allows scroll) */
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

  /* ── Active chip ───────────────────────────────────────────────────────── */
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

  /* ── Focus ring ────────────────────────────────────────────────────────── */
  .chip:focus-visible {
    outline: 3px solid #4BA3FF;
    outline-offset: 2px;
  }

  /* ── Icon & label ──────────────────────────────────────────────────────── */
  .chip-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
  }

  .chip-label {
    line-height: 1;
  }
</style>