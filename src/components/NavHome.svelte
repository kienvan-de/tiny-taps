<script lang="ts">
  

  interface Props {
    href?: string;
  }

  let { href = '/' }: Props = $props();

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
    window.location.href = href;
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
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="nav-home"
  class:pressed={isPressed}
  role="button"
  tabindex="0"
  aria-label="Go home"
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onpointerleave={handlePointerLeave}
  oncontextmenu={handleContextMenu}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  }}
>
  <span class="home-icon">
    <i class="ph-bold ph-house" style="font-size:52px;" aria-hidden="true"></i>
  </span>
</div>

<style>
  /* ── Base ──────────────────────────────────────────────────────────────── */
  .nav-home {
    /* Minimum 100×100px per design system "No-Miss" rule */
    width: 100px;
    height: 100px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: white;
    border: 4px solid #4A4A4A;
    border-radius: 24px;

    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    -webkit-user-drag: none;
    outline: none;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

    transition:
      transform 50ms ease-out,
      background 80ms ease-out,
      box-shadow 80ms ease-out;

    color: #4A4A4A;
    flex-shrink: 0;
  }

  /* ── Hover ─────────────────────────────────────────────────────────────── */
  .nav-home:hover {
    background: #eff8ff;
    border-color: #4BA3FF;
    color: #0369a1;
    transform: scale(1.05);
    box-shadow: 0 6px 18px rgba(75, 163, 255, 0.25);
  }

  /* ── Pressed ───────────────────────────────────────────────────────────── */
  .nav-home.pressed {
    transform: scale(0.90);
    background: #FFF9E6;
    border-color: #FFD93D;
    border-width: 6px;
    box-shadow: 0 0 0 4px #FFD93D66;
    color: #92400e;
  }

  /* ── Focus ring (keyboard) ─────────────────────────────────────────────── */
  .nav-home:focus-visible {
    outline: 4px solid #4BA3FF;
    outline-offset: 3px;
  }

  /* ── Icon ──────────────────────────────────────────────────────────────── */
  .home-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    flex-shrink: 0;
  }
</style>