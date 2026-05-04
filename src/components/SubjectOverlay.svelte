<script lang="ts">
  interface Subject {
    id: string;
    title: string;
    imageUrl: string | null;
  }

  interface Props {
    subject: Subject | null;
    sourceRect?: DOMRect | null;
    onLeave?: () => void;
  }

  let { subject, sourceRect = null, onLeave }: Props = $props();

  type Phase = 'entering' | 'playing' | 'leaving';
  let phase = $state<Phase>('entering');
  let visible = $state(false);

  let enterStyle = $state('');

  $effect(() => {
    if (subject) {
      visible = true;
      phase = 'entering';

      if (sourceRect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardCx = sourceRect.left + sourceRect.width / 2;
        const cardCy = sourceRect.top + sourceRect.height / 2;
        const dx = cardCx - vw / 2;
        const dy = cardCy - vh / 2;
        const overlaySize = Math.min(0.72 * Math.min(vw, vh), 460);
        const scale = sourceRect.width / overlaySize;
        enterStyle = `--enter-tx: ${dx}px; --enter-ty: ${dy}px; --enter-scale: ${scale};`;
      } else {
        enterStyle = '--enter-tx: 0px; --enter-ty: 0px; --enter-scale: 0.4;';
      }

      // Switch to playing phase after fly-in completes
      const t = setTimeout(() => { phase = 'playing'; }, 1100);
      return () => clearTimeout(t);
    }
  });

  export function leave() {
    phase = 'leaving';
    setTimeout(() => {
      visible = false;
      onLeave?.();
    }, 700);
  }
</script>

{#if visible && subject}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="overlay-backdrop"
    class:entering={phase === 'entering'}
    class:leaving={phase === 'leaving'}
  >
    <div
      class="overlay-card"
      class:entering={phase === 'entering'}
      class:playing={phase === 'playing'}
      class:leaving={phase === 'leaving'}
      style={enterStyle}
    >
      {#if subject.imageUrl}
        <img
          src={subject.imageUrl}
          alt={subject.title}
          class="overlay-image"
          draggable="false"
        />
      {:else}
        <div class="overlay-placeholder">
          <i class="ph-bold ph-image" aria-hidden="true"></i>
        </div>
      {/if}
      <div class="overlay-title">{subject.title.toUpperCase()}</div>
    </div>
  </div>
{/if}

<style>
  /* ── Backdrop ──────────────────────────────────────────────────────────── */
  .overlay-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0);
    padding: 24px;
    box-sizing: border-box;
    transition: background 900ms ease;
  }

  .overlay-backdrop.entering,
  .overlay-backdrop.playing {
    background: rgba(0, 0, 0, 0.72);
  }

  .overlay-backdrop.leaving {
    background: rgba(0, 0, 0, 0);
    transition: background 600ms ease;
  }

  /* ── Card ──────────────────────────────────────────────────────────────── */
  .overlay-card {
    width: min(72vmin, 460px);
    height: min(72vmin, 460px);

    position: relative;
    border-radius: 28px;
    border: 5px solid #FFD93D;
    overflow: hidden;
    box-shadow: 0 0 0 4px #FFD93D88;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;

    transform-origin: center;
  }

  /* Fly from card position to center */
  .overlay-card.entering {
    animation: card-snap-in 1000ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Steady playing pulse */
  .overlay-card.playing {
    transform: translate(0, 0) scale(1);
    opacity: 1;
    animation: card-breathe 2.8s ease-in-out infinite;
  }

  /* Burst out */
  .overlay-card.leaving {
    animation: card-out 650ms ease-in-out forwards;
  }

  @keyframes card-snap-in {
    from {
      transform: translate(var(--enter-tx, 0px), var(--enter-ty, 0px)) scale(var(--enter-scale, 0.4));
      opacity: 0.7;
    }
    to {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
  }

  @keyframes card-breathe {
    0%, 100% { transform: scale(1.00); box-shadow: 0 0 0 4px #FFD93D88; }
    50%       { transform: scale(1.03); box-shadow: 0 0 0 14px #FFD93D33; }
  }

  @keyframes card-out {
    0%   { transform: scale(1);    opacity: 1; filter: blur(0px); }
    60%  { transform: scale(1.15); opacity: 0.6; filter: blur(2px); }
    100% { transform: scale(1.35); opacity: 0;   filter: blur(10px); }
  }

  /* ── Image ─────────────────────────────────────────────────────────────── */
  .overlay-image {
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

  .overlay-placeholder {
    position: absolute;
    inset: 0;
    background: #FFF9E6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80px;
    color: #cbd5e1;
  }

  /* ── Title ─────────────────────────────────────────────────────────────── */
  .overlay-title {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 14px 16px;
    background: linear-gradient(transparent, rgba(0,0,0,0.65));
    font-family: 'Nunito', sans-serif;
    font-size: clamp(18px, 4vmin, 32px);
    font-weight: 800;
    color: white;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 6px rgba(0,0,0,0.5);
    word-break: break-word;
  }
</style>
