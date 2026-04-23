<script lang="ts">
  import { onDestroy } from 'svelte';

  interface Subject {
    id: string;
    title: string;
    imageUrl: string | null;
  }

  interface Props {
    subjects: Subject[];
    soundLoadState?: Record<string, 'idle' | 'loading' | 'ready' | 'error'>;
    onTap?: (subjectId: string, onDone?: () => void) => void;
  }

  let { subjects = [], soundLoadState = {}, onTap }: Props = $props();

  let currentIndex = $state(0);
  let animating = $state(false);
  let pressed = $state(false);         // visual press feedback only
  // outgoingIndex: the card that is flying OUT — rendered separately so
  // the incoming card can fly IN simultaneously without a flicker gap.
  let outgoingIndex = $state<number | null>(null);
  let outgoingDir = $state<'up' | 'down'>('up');
  let incomingActive = $state(false); // true while fly-in animation runs
  let showTitle = $state(false);
  let titleTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerId = $state<number | null>(null);
  // Two-tap pattern: first tap = show title + play audio, second tap = fly to next
  let tapped = $state(false);

  // onTap callback fired on card tap — parent (TopicPlayer) wires it to AudioEngine.play()

  let current    = $derived(subjects[currentIndex] ?? null);
  let outgoing   = $derived(outgoingIndex !== null ? (subjects[outgoingIndex] ?? null) : null);
  let total      = $derived(subjects.length);
  let hasNext    = $derived(currentIndex < total - 1);
  let hasPrev    = $derived(currentIndex > 0);

  // ── Tap handling ────────────────────────────────────────────────────────────

  function handlePointerDown(e: PointerEvent) {
    if (animating || pointerId !== null) return;
    pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pressed = true;
  }

  function handlePointerUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (!pressed) return;
    pressed = false;

    if (!tapped) {
      // ── First tap: show title + play audio, stay on card ──────────────
      tapped = true;
      showTitle = true;
      if (titleTimer) clearTimeout(titleTimer);
      titleTimer = setTimeout(() => { showTitle = false; }, 1500);

      if (current) {
        onTap?.(current.id, () => {
          // Audio finished — auto-advance to next card if not already navigated
          if (tapped && hasNext) {
            tapped = false;
            showTitle = false;
            if (titleTimer) clearTimeout(titleTimer);
            flyOut();
          }
        });
      }
    } else {
      // ── Second tap during audio: skip wait, fly immediately ───────────
      tapped = false;
      showTitle = false;
      if (titleTimer) clearTimeout(titleTimer);

      if (hasNext) {
        flyOut();
      } else {
        // Last card — replay audio
        if (current) {
          onTap?.(current.id);
          showTitle = true;
          if (titleTimer) clearTimeout(titleTimer);
          titleTimer = setTimeout(() => { showTitle = false; }, 1500);
        }
      }
    }
  }

  function handlePointerCancel(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    pressed = false;
  }

  function handlePointerLeave(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    if (pressed) {
      pointerId = null;
      pressed = false;
    }
  }

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  // ── Animation ───────────────────────────────────────────────────────────────
  // Two-card approach: outgoing card flies out while incoming card flies in
  // simultaneously — no gap, no flicker.
  //
  // Timeline (FLY_OUT_MS = 350):
  //   0ms   — outgoingIndex set (old card), currentIndex updated (new card)
  //           outgoing div gets .fly-out-up / .fly-out-down CSS animation
  //           current div gets .fly-in-up / .fly-in-down CSS animation
  //   350ms — animations done → clear outgoingIndex, clear incomingActive

  const FLY_MS = 380;

  function navigate(direction: 'next' | 'prev') {
    if (animating) return;
    if (direction === 'next' && !hasNext) return;
    if (direction === 'prev' && !hasPrev) return;

    

    animating = true;
    tapped = false;          // reset two-tap state on any navigation
    showTitle = false;
    if (titleTimer) clearTimeout(titleTimer);

    outgoingDir = direction === 'next' ? 'up' : 'down';
    outgoingIndex = currentIndex;   // freeze outgoing card
    incomingActive = true;

    // Advance index immediately — incoming card renders right away
    if (direction === 'next') currentIndex++;
    else currentIndex--;

    setTimeout(() => {
      outgoingIndex = null;
      incomingActive = false;
      animating = false;
    }, FLY_MS);
  }

  function flyOut() {
    navigate('next');
  }

  function goNext() {
    navigate('next');
  }

  function goPrev() {
    navigate('prev');
  }
</script>

<div class="stack-container">

  <!-- ── Card area ──────────────────────────────────────────────────────── -->
  <div class="card-area">

    <!-- Peek card: next card peeking behind (only when not animating) -->
    {#if !animating && hasNext}
      {@const next = subjects[currentIndex + 1]!}
      <div class="card card-peek" aria-hidden="true">
        {#if next.imageUrl}
          <img src={next.imageUrl} alt="" class="card-image" draggable="false" />
        {:else}
          <div class="card-placeholder"></div>
        {/if}
      </div>
    {/if}

    <!-- Outgoing card: flies out while incoming flies in simultaneously -->
    {#if outgoing}
      <div
        class="card card-outgoing"
        class:fly-out-up={outgoingDir === 'up'}
        class:fly-out-down={outgoingDir === 'down'}
        aria-hidden="true"
      >
        {#if outgoing.imageUrl}
          <img src={outgoing.imageUrl} alt="" class="card-image" draggable="false" />
        {:else}
          <div class="card-placeholder">
            <span class="placeholder-text">{outgoing.title[0]?.toUpperCase()}</span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Current (incoming) card -->
    {#if current}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="card card-current"
        class:pressed={pressed}
        class:fly-in-up={incomingActive && outgoingDir === 'up'}
        class:fly-in-down={incomingActive && outgoingDir === 'down'}
        role="button"
        tabindex="0"
        aria-label={`${current.title} — tap to play`}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerCancel}
        onpointerleave={handlePointerLeave}
        oncontextmenu={handleContextMenu}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (current) onTap?.(current.id);
          } else if (e.key === 'ArrowRight') goNext();
          else if (e.key === 'ArrowLeft') goPrev();
        }}
      >
        {#if current.imageUrl}
          <img
            src={current.imageUrl}
            alt={current.title}
            class="card-image"
            draggable="false"
          />
        {:else}
          <div class="card-placeholder">
            <span class="placeholder-text">{current.title[0]?.toUpperCase()}</span>
          </div>
        {/if}

        <!-- Loading overlay — shown while sounds are being fetched/decoded -->
        {#if soundLoadState[current.id] === 'loading'}
          <div class="card-loading-overlay">
            <div class="card-spinner"></div>
          </div>
        {/if}

        <!-- Title overlay — shown on tap, fades out after 1.5s -->
        <div class="card-title-overlay" class:visible={showTitle}>
          <span class="card-title">{current.title.toUpperCase()}</span>
        </div>
      </div>
    {:else}
      <div class="card card-empty">
        <div class="card-placeholder">
          <span class="placeholder-text">?</span>
        </div>
      </div>
    {/if}

  </div>

  <!-- ── Progress dots ──────────────────────────────────────────────────── -->
  {#if total > 1}
    <div class="progress-dots" role="tablist" aria-label="Card progress">
      {#each subjects as _, i}
        <button
          class="dot"
          class:active={i === currentIndex}
          class:done={i < currentIndex}
          onclick={() => {
            if (i === currentIndex || animating) return;
            
            const dir = i > currentIndex ? 'next' : 'prev';
            animating = true;
            outgoingDir = dir === 'next' ? 'up' : 'down';
            outgoingIndex = currentIndex;
            incomingActive = true;
            currentIndex = i;
            setTimeout(() => {
              outgoingIndex = null;
              incomingActive = false;
              animating = false;
            }, FLY_MS);
          }}
          aria-label={`Go to card ${i + 1}`}
          aria-selected={i === currentIndex}
          role="tab"
        ></button>
      {/each}
    </div>
  {/if}

  <!-- ── Prev / Next nav buttons ────────────────────────────────────────── -->
  <div class="nav-row">
    <button
      class="nav-btn nav-prev"
      onclick={goPrev}
      disabled={!hasPrev || animating}
      aria-label="Previous card"
    >
      ‹
    </button>

    <div class="counter">{currentIndex + 1} / {total}</div>

    <button
      class="nav-btn nav-next"
      onclick={goNext}
      disabled={!hasNext || animating}
      aria-label="Next card"
    >
      ›
    </button>
  </div>

</div>

<style>
  /* ── Container ──────────────────────────────────────────────────────────── */
  .stack-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    gap: 12px;
    padding: 8px 16px 12px;
    box-sizing: border-box;
  }

  /* ── Card area ──────────────────────────────────────────────────────────── */
  .card-area {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Base card ──────────────────────────────────────────────────────────── */
  .card {
    position: absolute;
    width: 100%;
    height: 100%;
    max-width: 360px;
    max-height: 480px;

    overflow: hidden;
    background: white;
    border: 4px solid #4A4A4A;
    border-radius: 24px;
    box-sizing: border-box;

    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-drag: none;
    touch-action: none;
    outline: none;
  }

  /* ── Peek card (next card behind) ──────────────────────────────────────── */
  .card-peek {
    transform: scale(0.93) translateY(18px);
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
    border-color: #e2e8f0;
  }

  /* ── Current card ───────────────────────────────────────────────────────── */
  .card-current {
    z-index: 2;
    cursor: pointer;
    animation: breathe 3s ease-in-out infinite;
    transition:
      transform 50ms ease-out,
      border-color 50ms ease-out,
      box-shadow 50ms ease-out;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .card-current:focus-visible {
    outline: 4px solid #4BA3FF;
    outline-offset: 2px;
  }

  /* ── Pressed state ──────────────────────────────────────────────────────── */
  .card-current.pressed {
    animation: none;
    transform: scale(0.93);
    border-color: #FFD93D;
    border-width: 6px;
    box-shadow: 0 0 0 6px #FFD93D66, 0 4px 16px rgba(0,0,0,0.1);
  }

  /* ── Outgoing card (flying away) ────────────────────────────────────────── */
  .card-outgoing {
    z-index: 3;        /* sits above incoming so it visually flies over */
    pointer-events: none;
  }

  .card-outgoing.fly-out-up {
    animation: flyOutUp 380ms cubic-bezier(0.4, 0, 1, 1) forwards;
  }

  .card-outgoing.fly-out-down {
    animation: flyOutDown 380ms cubic-bezier(0.4, 0, 1, 1) forwards;
  }

  @keyframes flyOutUp {
    0%   { transform: translateY(0)     scale(1.0)  rotate(0deg);   opacity: 1; }
    100% { transform: translateY(-115%) scale(0.75) rotate(-5deg);  opacity: 0; }
  }

  @keyframes flyOutDown {
    0%   { transform: translateY(0)    scale(1.0)  rotate(0deg);  opacity: 1; }
    100% { transform: translateY(115%) scale(0.75) rotate(5deg);  opacity: 0; }
  }

  /* ── Incoming card (flying in) ──────────────────────────────────────────── */
  .card-current.fly-in-up {
    animation: flyInUp 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .card-current.fly-in-down {
    animation: flyInDown 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes flyInUp {
    0%   { transform: translateY(90%)  scale(0.85); opacity: 0; }
    40%  { opacity: 1; }
    100% { transform: translateY(0)    scale(1.0);  opacity: 1; }
  }

  @keyframes flyInDown {
    0%   { transform: translateY(-90%) scale(0.85); opacity: 0; }
    40%  { opacity: 1; }
    100% { transform: translateY(0)    scale(1.0);  opacity: 1; }
  }

  /* ── Breathing idle ─────────────────────────────────────────────────────── */
  @keyframes breathe {
    0%, 100% { transform: scale(1.0); }
    50%       { transform: scale(1.02); }
  }

  /* ── Image fills card ───────────────────────────────────────────────────── */
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

  .card-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #e0f2fe 0%, #dcfce7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-text {
    font-family: 'Nunito', sans-serif;
    font-size: 80px;
    font-weight: 800;
    color: white;
    opacity: 0.6;
    pointer-events: none;
  }

  /* ── Title overlay — shown on tap ──────────────────────────────────────── */
  /* ── Loading overlay ────────────────────────────────────────────────── */
  .card-loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    border-radius: inherit;
    pointer-events: none;
    z-index: 2;
  }

  .card-spinner {
    width: 48px;
    height: 48px;
    border: 5px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .card-title-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
    transition: opacity 150ms ease-in-out;
    pointer-events: none;
  }

  .card-title-overlay.visible {
    opacity: 1;
  }

  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: clamp(20px, 6vw, 32px);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: white;
    text-align: center;
    line-height: 1.1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    pointer-events: none;
  }

  .card-empty {
    opacity: 0.4;
    pointer-events: none;
  }

  /* ── Progress dots ──────────────────────────────────────────────────────── */
  .progress-dots {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    background: #e2e8f0;
    cursor: pointer;
    padding: 0;
    transition: background 200ms, transform 200ms, width 200ms;
    flex-shrink: 0;
  }

  .dot.active {
    background: #4BA3FF;
    width: 24px;
    border-radius: 5px;
    transform: scale(1.1);
  }

  .dot.done {
    background: #6BCB77;
  }

  /* ── Nav row ────────────────────────────────────────────────────────────── */
  .nav-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 360px;
    flex-shrink: 0;
    gap: 12px;
  }

  .nav-btn {
    /* ≥100px wide per design system */
    min-width: 100px;
    min-height: 60px;
    background: white;
    border: 3px solid #e2e8f0;
    border-radius: 16px;
    font-size: 32px;
    font-weight: 800;
    color: #475569;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;
    transition: background 100ms, border-color 100ms, transform 80ms, opacity 150ms;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .nav-btn:hover:not(:disabled) {
    background: #eff8ff;
    border-color: #4BA3FF;
    color: #0369a1;
  }

  .nav-btn:active:not(:disabled) {
    transform: scale(0.93);
  }

  .nav-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .nav-btn:focus-visible {
    outline: 3px solid #4BA3FF;
    outline-offset: 2px;
  }

  .counter {
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #94a3b8;
    flex: 1;
    text-align: center;
    white-space: nowrap;
  }
</style>