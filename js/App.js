// js/App.js
import { ref, onMounted } from 'vue';
import SearchInput from './components/SearchInput.js';
import IndexList from './components/IndexList.js';
import EntryDisplay from './components/EntryDisplay.js';

export default {
  components: { SearchInput, IndexList, EntryDisplay },
  setup() {
    const allSearchData = ref([]);
    const selectedEntryId = ref(null);
    const isLoadingData = ref(true);
    const errorLoadingData = ref(null);

    const fetchData = async () => {
      isLoadingData.value = true; errorLoadingData.value = null;
      console.log("App: Fetching index data...");
      try {
        const response = await fetch('index_data.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        allSearchData.value = await response.json();
        console.log(`App: Loaded ${allSearchData.value.length} entries.`);
        handleHashChange(); // Check initial hash after data loads
      } catch (error) {
        console.error('App: Error fetching search index:', error);
        errorLoadingData.value = error.message || 'Failed to load dictionary index.';
      } finally {
        isLoadingData.value = false;
      }
    };

    const handleEntrySelected = (entryId) => {
      console.log(`App: Setting selected ID to: ${entryId}`);
      if (selectedEntryId.value !== entryId) {
         selectedEntryId.value = entryId;
         const newHash = `#entry-${entryId}`;
         if (window.location.hash !== newHash) {
             // Use replaceState for smoother SPA feel, pushState if back button per selection is desired
             history.replaceState({ entryId: entryId }, "", newHash);
             console.log(`App: Hash updated to ${newHash}`);
         }
      }
    };

    const handleHashChange = () => {
        const hash = window.location.hash;
        const currentId = selectedEntryId.value;
        if (hash && hash.startsWith('#entry-')) {
            const idFromHash = hash.substring(7);
             if (String(currentId) !== idFromHash) {
                 console.log(`App: Hash change detected, setting selected ID to ${idFromHash}`);
                 selectedEntryId.value = idFromHash;
             }
        } else if (currentId !== null && !hash) {
             // Clear selection if hash is removed
             console.log("App: Hash removed, clearing selection.");
             selectedEntryId.value = null;
        }
    };

    onMounted(() => {
      fetchData();
      window.addEventListener('hashchange', handleHashChange);
    });

    // Cleanup listener on unmount (good practice, though less critical in SPA root)
    // onUnmounted(() => {
    //   window.removeEventListener('hashchange', handleHashChange);
    // });

    return { allSearchData, selectedEntryId, isLoadingData, errorLoadingData, handleEntrySelected };
  },
  template: `
    <nav class="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-20">
      <div class="container mx-auto"> <span class="text-xl font-semibold">Puscariu (1905) [Vue 3]</span> </div>
    </nav>
    <header class="container mx-auto text-center my-8 px-4">
      <h1 class="text-3xl font-bold text-gray-800">Etymologisches Wörterbuch der rumänischen Sprache</h1>
      <p class="text-lg text-gray-600 mt-2">I. Lateinisches Element (Sextil Pușcariu, 1905)</p>
    </header>

    <div v-if="isLoadingData" class="container mx-auto py-8 text-center">
      <p class="animate-pulse text-gray-500">Loading dictionary data...</p>
    </div>
    <div v-else-if="errorLoadingData" class="container mx-auto px-4 mb-6">
       <div class="p-4 text-red-700 bg-red-100 border border-red-300 rounded-md max-w-3xl mx-auto">
           <p class="font-semibold">Error Loading Index Data</p> <p class="text-sm">{{ errorLoadingData }}</p>
       </div>
    </div>
    <template v-else>
      <SearchInput :search-data="allSearchData" @entry-selected="handleEntrySelected" />
      <div class="container mx-auto max-w-7xl flex flex-col md:flex-row gap-6 px-4 mb-12">
        <IndexList :search-data="allSearchData" :selected-entry-id="selectedEntryId" @entry-selected="handleEntrySelected" />
        <EntryDisplay :entry-id="selectedEntryId" />
      </div>
    </template>
  `
};