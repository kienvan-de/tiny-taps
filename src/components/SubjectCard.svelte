<script lang="ts">
  import type { ResolvedSound } from './AudioEngine.svelte';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon.svelte';

  interface Props {
    id: string;
    title: string;
    imageUrl?: string | null;
    sounds?: ResolvedSound[];
    onTap?: (subjectId: string) => void;
  }

  let {
    id,
    title,
    imageUrl = null,
    sounds = [],
    onTap,
  }: Props = $props();

  let isActive = $state(false);
  let isPressed = $state(false);
  let showTitle = $state(false);
  let pointerId = $state<number | null>(null);
  let titleTimer: ReturnType<typeof setTimeout> | null = null;

  function handlePointerDown(e: PointerEvent) {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isPressed = true;
    isActive = true;
  }

  function handlePointerUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    isPressed = false;

    // Play audio
    onTap?.(id);

    // Show title overlay for 1.5s then fade out
    showTitle = true;
    if (titleTimer) clearTimeout(titleTimer);
    titleTimer = setTimeout(() => {
      showTitle = false;
    }, 1500);

    // Reset wiggle after animation
    setTimeout(() => {
      isActive = false;
    }, 700);
  }

  function handlePointerCancel(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    isPressed = false;
    isActive = false;
  }

  function handlePointerLeave(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    if (isPressed) {
      pointerId = null;
      isPressed = false;
      isActive = false;
    }
  }

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="subject-card"
  class:active={isActive}
  class:pressed={isPressed}
  role="button"
  tabindex="0"
  aria-label={title}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onpointerleave={handlePointerLeave}
  oncontextmenu={handleContextMenu}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap?.(id);
      showTitle = true;
      if (titleTimer) clearTimeout(titleTimer);
      titleTimer = setTimeout(() => { showTitle = false; }, 1500);
    }
  }}
>
  <!-- Image fills the entire card -->
  {#if imageUrl}
    <img
      src={imageUrl}
      alt={title}
      class="card-image"
      draggable="false"
    />
  {:else}
    <div class="card-image-placeholder">
      <ImageIcon weight="bold" size={48} color="#cbd5e1" />
    </div>
  {/if}

  <!-- Title overlay — shown on tap, fades out after 1.5s -->
  <div class="card-title-overlay" class:visible={showTitle}>
    <span class="card-title">{title.toUpperCase()}</span>
  </div>
</div>

<style>
  /* ── Base card ────────────────────────────────────────────────────────── */
  .subject-card {
    min-width: 100px;
    min-height: 100px;
    width: 100%;
    aspect-ratio: 1 / 1;

    position: relative;
    overflow: hidden;

    border: 4px solid #4A4A4A;
    border-radius: 24px;
    box-sizing: border-box;

    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    -webkit-user-drag: none;
    outline: none;

    animation: breathe 3s ease-in-out infinite;

    transition:
      transform 50ms ease-out,
      border-color 50ms ease-out,
      box-shadow 50ms ease-out;
  }

  /* ── Pressed state ───────────────────────────────────────────────────── */
  .subject-card.pressed {
    animation: none;
    transform: scale(0.9);
    border-color: #FFD93D;
    border-width: 8px;
    box-shadow: 0 0 0 4px #FFD93D88;
  }

  /* ── Active wiggle + glow ────────────────────────────────────────────── */
  .subject-card.active:not(.pressed) {
    animation: wiggle 0.5s ease-in-out forwards;
    border-color: #FFD93D;
    border-width: 8px;
    box-shadow: 0 0 0 4px #FFD93D88;
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1.0); }
    50%       { transform: scale(1.02); }
  }

  @keyframes wiggle {
    0%   { transform: scale(0.9) rotate(-3deg); }
    20%  { transform: scale(0.92) rotate(3deg); }
    40%  { transform: scale(0.9) rotate(-3deg); }
    60%  { transform: scale(0.92) rotate(3deg); }
    80%  { transform: scale(0.95) rotate(-1deg); }
    100% { transform: scale(1.0) rotate(0deg); }
  }

  /* ── Image fills card ────────────────────────────────────────────────── */
  .card-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .card-image-placeholder {
    position: absolute;
    inset: 0;
    background: #FFF9E6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Title overlay ───────────────────────────────────────────────────── */
  .card-title-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    box-sizing: border-box;

    background: rgba(0, 0, 0, 0.45);
    border-radius: 20px;

    opacity: 0;
    transition: opacity 150ms ease-in-out;
    pointer-events: none;
  }

  .card-title-overlay.visible {
    opacity: 1;
  }

  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(14px, 2.5vw, 24px);
    font-weight: 800;
    text-align: center;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    line-height: 1.2;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    word-break: break-word;
  }

  /* ── Focus ring ──────────────────────────────────────────────────────── */
  .subject-card:focus-visible {
    outline: 4px solid #4BA3FF;
    outline-offset: 2px;
  }
</style>
