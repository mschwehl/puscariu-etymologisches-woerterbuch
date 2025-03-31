import { ref, watch } from 'vue';

export default {
  props: {
    entryId: { type: [Number, String, null], default: null }
  },
  setup(props) {
    const entryHtml = ref('');
    const isLoading = ref(false);
    const error = ref(null);
    const displayContainerRef = ref(null); // Ref for scrolling

    const loadEntry = async (id) => {
      if (id === null || id === undefined) {
        entryHtml.value = '<p class="text-gray-500 p-6">Select an entry from the index or use the search above.</p>';
        isLoading.value = false; error.value = null; return;
      }
      isLoading.value = true; error.value = null; entryHtml.value = '';
      const url = `entries/entry_${id}.html`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
           if(response.status === 404) throw new Error(`Entry file not found (${url})`);
           else throw new Error(`HTTP error ${response.status}`);
        }
        entryHtml.value = await response.text();
        // Scroll this component to top after loading new content
        if (displayContainerRef.value) {
            displayContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        console.error(`Error loading entry ${id}:`, err);
        error.value = err.message || 'Failed to load entry content.';
      } finally {
        isLoading.value = false;
      }
    };

    watch(() => props.entryId, (newId) => { loadEntry(newId); }, { immediate: true });

    return { entryHtml, isLoading, error, displayContainerRef };
  },
  template: `
    <main id="entry-content-display" ref="displayContainerRef"
      class="w-full md:w-3/4 lg:w-4/5 bg-white p-6 rounded-md shadow border border-gray-200 scroll-mt-20"> <!-- scroll-mt for sticky nav offset -->
      <div v-if="isLoading" class="text-center text-gray-400 animate-pulse p-6">Loading entry...</div>
      <div v-else-if="error" class="p-4 text-red-700 bg-red-100 border border-red-300 rounded-md">
        <p class="font-semibold">Error Loading Entry</p>
        <p class="text-sm">{{ error }}</p>
      </div>
      <!-- WARNING: v-html can be dangerous if HTML source is not trusted -->
      <div v-else v-html="entryHtml"></div>
    </main>
  `
};