<script lang="ts">
  import { getLocale, setLocale} from "../paraglide/runtime.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Languages from "@lucide/svelte/icons/Languages";


  type Locale = "en" | "es";

  const languages: { value: Locale; label: string }[] = [
    { value: "en", label: "ENG" },
    { value: "es", label: "ESP" },
  ];

  let currentLocale = $state<Locale>(getLocale() as Locale);

  function handleLanguageChange(newLocale: Locale) {
    if (newLocale) {
      setLocale(newLocale);
    }
  }


</script>


  <Select.Root
    type="single"
    bind:value={currentLocale }
    onValueChange={(value: string | string[] | null) => {
      if (typeof value === "string") {
        handleLanguageChange(value as Locale);
      }
    }}
  >
    <Select.Trigger class="flex items-center cursor-pointer  duration-300 transition-colors border-none shadow-none px-2.5 gap-1.5">
      
        <Languages class="size-6" />
       
        <span class="truncate font-semibold">
          {languages.find((lang) => lang.value === currentLocale)?.label}
        </span>
      
    </Select.Trigger>
    <Select.Content class="font-semibold">
      <Select.Group>
        {#each languages as lang (lang.value)}
          <Select.Item value={lang.value} label={lang.label} class="">
            {lang.label}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>

  