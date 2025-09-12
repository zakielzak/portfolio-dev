<script lang="ts">
  import { onMount } from "svelte"
  import * as Select from "$lib/components/ui/select/index.js";
 
  const languages = [
    { value: "en", label: "English"},
    { value: "es", label: "Español"},
  ]
 
  let value = $state("en");
 
  const triggerContent = $derived(
    languages.find((lang) => lang.value === value)?.label ?? ""
  );

  $effect(() => {
    if (value) {
        localStorage.setItem("language", value);
    }
  })

  onMount(() => {
    // Try load language from localStorage
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
        value = savedLang;
        return
    }

    // If not, then use browser language
    const browserLang = navigator.language.split("-")[0];
    if (languages.some((lang) => lang.value === browserLang)) {
        value = browserLang
    }
  })
</script>
 
<Select.Root type="single" name="language=selector" bind:value>
  <Select.Trigger class="w-[180px]">
    {triggerContent}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      {#each languages as lang (lang.value)}
        <Select.Item
          value={lang.value}
          label={lang.label}
        >
          {lang.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>