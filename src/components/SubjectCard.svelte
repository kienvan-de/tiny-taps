<script lang="ts">
  import type { ResolvedSound } from './AudioEngine.svelte';
  import { ImageIcon } from 'phosphor-svelte';

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
  let pointerId = $state<number | null>(null);

  // ── Multi-touch shielding ────────────────────────────────────────────────
  // Only respond to the FIRST pointer down. Ignore palm mashing (additional
  // simultaneous touches) on the same card.

  function handlePointerDown(e: PointerEvent) {
    // If a pointer is already tracked on this card, ignore additional touches
    if (pointerId !== null) return;

    // Capture this pointer
    pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isPressed = true;
    isActive = true;
  }

  function handlePointerUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    isPressed = false;

    // Notify parent to play audio
    onTap?.(id);

    // Keep active state for the wiggle animation duration, then return to idle
    // The wiggle animation is 0.5s; we extend the glow slightly beyond that.
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
    // If pointer leaves the element without up event, treat as cancel
    if (isPressed) {
      pointerId = null;
      isPressed = false;
      isActive = false;
    }
  }

  // Prevent context menu on long-press (common on mobile)
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
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap?.(id); } }}
>
  <!-- Image area -->
  <div class="card-image-wrap">
    {#if imageUrl}
      <img
        src={imageUrl}
        alt={title}
        class="card-image"
        draggable="false"
      />
    {:else}
      <!-- Placeholder when no image -->
      <div class="card-image-placeholder">
        <ImageIcon weight="bold" size={48} color="#cbd5e1" />
      </div>
    {/if}
  </div>

  <!-- Title -->
  <div class="card-title">{title.toUpperCase()}</div>
</div>

<style>
  /* ── Base card ────────────────────────────────────────────────────────── */
  .subject-card {
    /* Minimum 100×100px per design system "No-Miss" rule */
    min-width: 100px;
    min-height: 100px;
    width: 100%;
    aspect-ratio: 1 / 1.15;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;

    background: white;
    border: 4px solid #4A4A4A;
    border-radius: 24px;
    padding: 12px;
    box-sizing: border-box;

    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none; /* handled by pointer events */
    -webkit-user-drag: none;

    /* Idle: breathing animation */
    animation: breathe 3s ease-in-out infinite;

    /* Smooth press transition */
    transition:
      transform 50ms ease-out,
      border-color 50ms ease-out,
      box-shadow 50ms ease-out;

    /* Prevent text selection on rapid taps */
    outline: none;
    position: relative;
    overflow: hidden;
  }

  /* ── Pressed state (immediate visual feedback <50ms) ─────────────────── */
  .subject-card.pressed {
    animation: none;
    transform: scale(0.9);
    border-color: #FFD93D;
    border-width: 8px;
    box-shadow: 0 0 0 4px #FFD93D88;
  }

  /* ── Active state (wiggle + glow) ─────────────────────────────────────── */
  .subject-card.active:not(.pressed) {
    animation: wiggle 0.5s ease-in-out forwards;
    border-color: #FFD93D;
    border-width: 8px;
    box-shadow: 0 0 0 4px #FFD93D88;
  }

  /* ── Idle breathing animation ─────────────────────────────────────────── */
  @keyframes breathe {
    0%, 100% { transform: scale(1.0); }
    50%       { transform: scale(1.02); }
  }

  /* ── Active wiggle animation ──────────────────────────────────────────── */
  @keyframes wiggle {
    0%   { transform: scale(0.9) rotate(-3deg); }
    20%  { transform: scale(0.92) rotate(3deg); }
    40%  { transform: scale(0.9) rotate(-3deg); }
    60%  { transform: scale(0.92) rotate(3deg); }
    80%  { transform: scale(0.95) rotate(-1deg); }
    100% { transform: scale(1.0) rotate(0deg); }
  }

  /* ── Image area ────────────────────────────────────────────────────────── */
  .card-image-wrap {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 14px;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    border-radius: 14px;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .card-image-placeholder {
    width: 100%;
    height: 100%;
    min-height: 80px;
    background: #FFF9E6;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }



  /* ── Title ─────────────────────────────────────────────────────────────── */
  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(14px, 2.5vw, 24px);
    font-weight: 800;
    text-align: center;
    color: #4A4A4A;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    line-height: 1.2;
    width: 100%;
    padding: 0 4px;
    word-break: break-word;
    pointer-events: none;
  }

  /* ── Focus ring (keyboard accessibility) ─────────────────────────────── */
  .subject-card:focus-visible {
    outline: 4px solid #4BA3FF;
    outline-offset: 2px;
  }
</style>