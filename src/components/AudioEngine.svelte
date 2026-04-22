<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export interface ResolvedSound {
    id: string;
    sortOrder: number;
    delayBeforeMs: number;
    url: string;
  }

  export interface SubjectAudio {
    subjectId: string;
    sounds: ResolvedSound[];
  }

  export interface AudioEngineAPI {
    play: (subjectId: string, onDone?: () => void) => void;
    stop: () => void;
  }

  interface Props {
    subjects: SubjectAudio[];
    onReady?: (engine: AudioEngineAPI) => void;
    onError?: (err: string) => void;
  }

  let { subjects = [], onReady, onError }: Props = $props();

  // AudioContext — created on first user interaction (browser autoplay policy)
  let audioCtx: AudioContext | null = null;

  // Pre-decoded buffers: subjectId → ResolvedSound[] with decoded AudioBuffer
  type DecodedSound = ResolvedSound & { buffer: AudioBuffer | null };
  let decodedMap = new Map<string, DecodedSound[]>();

  // Playback state
  let currentSubjectId: string | null = null;
  let currentSources: AudioBufferSourceNode[] = [];
  let currentTimeouts: ReturnType<typeof setTimeout>[] = [];
  let isReady = $state(false);
  let loadProgress = $state(0);
  let loadTotal = $state(0);

  // ── AudioContext ────────────────────────────────────────────────────────

  function getOrCreateContext(): AudioContext {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  // ── Preloading ──────────────────────────────────────────────────────────

  function getAPI(): AudioEngineAPI {
    return { play, stop };
  }

  async function preloadAll() {
    if (!subjects.length) {
      isReady = true;
      onReady?.(getAPI());
      return;
    }

    const ctx = getOrCreateContext();

    // Resume context if suspended (needed on some browsers)
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }

    // Count total sounds
    const allSounds: { subjectId: string; sound: ResolvedSound }[] = [];
    for (const subject of subjects) {
      for (const sound of subject.sounds) {
        allSounds.push({ subjectId: subject.subjectId, sound });
      }
    }

    loadTotal = allSounds.length;
    loadProgress = 0;

    // Initialise map with null buffers
    for (const subject of subjects) {
      decodedMap.set(
        subject.subjectId,
        subject.sounds.map(s => ({ ...s, buffer: null }))
      );
    }

    // Fetch + decode all in parallel (with concurrency cap of 4)
    const CONCURRENCY = 4;
    let idx = 0;

    async function worker() {
      while (idx < allSounds.length) {
        const current = allSounds[idx++];
        try {
          const response = await fetch(current.sound.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

          // Store decoded buffer
          const list = decodedMap.get(current.subjectId);
          if (list) {
            const entry = list.find(s => s.id === current.sound.id);
            if (entry) entry.buffer = audioBuffer;
          }
        } catch (err) {
          // Non-fatal: log and continue; that sound will be silently skipped
          console.warn(`[AudioEngine] Failed to preload ${current.sound.url}:`, err);
        } finally {
          loadProgress++;
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, allSounds.length) }, () => worker());
    await Promise.all(workers);

    isReady = true;
    onReady?.(getAPI());
  }

  // ── Playback ────────────────────────────────────────────────────────────

  function stopCurrent() {
    // Cancel all pending timeouts
    for (const t of currentTimeouts) clearTimeout(t);
    currentTimeouts = [];

    // Stop all playing sources
    for (const source of currentSources) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {}
    }
    currentSources = [];
    currentSubjectId = null;
  }

  /**
   * Play all sounds for a subject sequentially, honouring delayBeforeMs.
   * If the subject is already playing, stop and restart.
   * If a different subject is playing, stop it and start the new one.
   */
  export function play(subjectId: string, onDone?: () => void) {
    stopCurrent();

    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const decoded = decodedMap.get(subjectId);
    if (!decoded || decoded.length === 0) { onDone?.(); return; }

    currentSubjectId = subjectId;

    const playable = decoded.filter(s => s.buffer !== null);
    if (playable.length === 0) { onDone?.(); return; }

    // Schedule sounds sequentially:
    // scheduleAt = previous sound end time + this sound's delayBeforeMs
    let scheduleAt = 0;

    for (let i = 0; i < playable.length; i++) {
      const sound = playable[i];
      const durationMs = sound.buffer!.duration * 1000;
      const isLast = i === playable.length - 1;

      scheduleAt += sound.delayBeforeMs;

      const capturedStart = scheduleAt;
      const capturedBuffer = sound.buffer!;
      const capturedSubjectId = subjectId;

      const t = setTimeout(() => {
        if (currentSubjectId !== capturedSubjectId) return;
        try {
          const source = ctx.createBufferSource();
          source.buffer = capturedBuffer;
          source.connect(ctx.destination);
          source.start();
          currentSources.push(source);
          source.onended = () => {
            const idx = currentSources.indexOf(source);
            if (idx !== -1) currentSources.splice(idx, 1);
            try { source.disconnect(); } catch {}
            // Fire onDone after the last sound finishes playing
            if (isLast) onDone?.();
          };
        } catch (err) {
          console.warn('[AudioEngine] Playback error:', err);
          if (isLast) onDone?.();
        }
      }, capturedStart);

      currentTimeouts.push(t);
      scheduleAt += durationMs;
    }
  }

  /**
   * Immediately stop all audio.
   */
  export function stop() {
    stopCurrent();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  onMount(() => {
    preloadAll();
  });

  onDestroy(() => {
    stopCurrent();
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  });

  // React to subjects prop changes (e.g. navigating to a different topic)
  $effect(() => {
    // subjects is the reactive dependency
    const _ = subjects;
    isReady = false;
    loadProgress = 0;
    loadTotal = 0;
    decodedMap = new Map();
    stopCurrent();
    preloadAll();
  });
</script>

<!--
  AudioEngine is a headless component — no visible DOM output.
  It exposes play(subjectId) via the tinytaps:audioEngineReady custom event.
  Loading progress is tracked internally via isReady / loadProgress / loadTotal.
-->