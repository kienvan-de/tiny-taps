<script lang="ts">
  import UploadSimpleIcon from 'phosphor-svelte/lib/UploadSimpleIcon.svelte';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon.svelte';
  interface Props {
    prefix?: string;
    currentUrl?: string | null;
    onuploaded?: (data: { key: string; url: string }) => void;
  }

  let {
    prefix = 'images',
    currentUrl = null,
    onuploaded,
  }: Props = $props();

  let preview = $state(currentUrl ?? '');
  let uploading = $state(false);
  let error = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);

  async function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    error = '';

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview = ev.target?.result as string;
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', prefix);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        preview = data.url;
        onuploaded?.(data);
      } else {
        const err = await res.json().catch(() => ({}));
        error = err.error ?? 'Upload failed. Please try again.';
        preview = currentUrl ?? '';
      }
    } catch {
      error = 'Network error. Please try again.';
      preview = currentUrl ?? '';
    } finally {
      uploading = false;
    }
  }

  function clearImage() {
    preview = '';
    if (inputEl) inputEl.value = '';
    onuploaded?.({ key: '', url: '' });
  }
</script>

<div style="display:flex; flex-direction:column; gap:10px; align-items:flex-start;">
  <!-- Preview area -->
  <div style="position:relative; width:120px; height:120px;">
    {#if preview}
      <img
        src={preview}
        alt="Preview"
        style="width:120px; height:120px; object-fit:cover; border-radius:12px; border:2px solid #e2e8f0; display:block;"
      />
      <button
        onclick={clearImage}
        type="button"
        title="Remove image"
        style="position:absolute; top:-8px; right:-8px; width:22px; height:22px; background:#ef4444; color:white; border:none; border-radius:50%; font-size:13px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:800;"
      >
        ×
      </button>
    {:else}
      <div
        style="width:120px; height:120px; background:#f1f5f9; border-radius:12px; border:2px dashed #cbd5e1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:#94a3b8; cursor:pointer;"
        onclick={() => inputEl?.click()}
        role="button"
        tabindex="0"
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputEl?.click(); }}
      >
        <UploadSimpleIcon weight="bold" size={28} color="#94a3b8" />
        <span style="font-size:11px; font-weight:700; text-align:center; padding:0 8px;">Click to upload</span>
      </div>
    {/if}

    {#if uploading}
      <div style="position:absolute; inset:0; background:rgba(255,255,255,0.85); border-radius:12px; display:flex; align-items:center; justify-content:center;">
        <span style="font-size:12px; font-weight:700; color:#4BA3FF;">Uploading…</span>
      </div>
    {/if}
  </div>

  <!-- File input -->
  <input
    bind:this={inputEl}
    type="file"
    accept="image/png,image/jpeg,image/webp,image/gif"
    onchange={handleFile}
    disabled={uploading}
    style="font-size:13px; font-family:inherit; max-width:200px;"
  />

  <!-- Status messages -->
  {#if error}
    <div style="font-size:12px; color:#ef4444; font-weight:700; max-width:200px;">{error}</div>
  {:else if preview && !uploading}
    <div style="font-size:12px; color:#6BCB77; font-weight:700; display:flex; align-items:center; gap:4px;"><CheckCircleIcon weight="bold" size={14} /> Image ready</div>
  {/if}
</div>