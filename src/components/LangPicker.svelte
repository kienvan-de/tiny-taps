<script lang="ts">
  import { LOCALES, isValidLocale, type Locale } from '../lib/i18n';

  interface Props {
    locale: Locale;
  }

  let { locale }: Props = $props();

  function handleChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    if (isValidLocale(val)) {
      document.cookie = `tt-locale=${val};path=/;max-age=31536000;SameSite=Lax`;
      window.location.reload();
    }
  }
</script>

<div class="lang-picker">
  <i class="ph-bold ph-globe" aria-hidden="true"></i>
  <select value={locale} onchange={handleChange} aria-label="Select language">
    {#each LOCALES as l}
      <option value={l.code}>{l.flag} {l.label}</option>
    {/each}
  </select>
</div>

<style>
  .lang-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 999px;
    padding: 6px 12px 6px 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    transition: border-color 0.15s;
  }

  .lang-picker:focus-within {
    border-color: #4BA3FF;
  }

  .lang-picker i {
    font-size: 18px;
    flex-shrink: 0;
    color: #64748b;
  }

  select {
    border: none;
    outline: none;
    background: transparent;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
</style>
