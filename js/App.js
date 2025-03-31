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
  <div class="container mx-auto flex items-center justify-between">
    <!-- Wikipedia Link -->
    <span class="text-sm">
      <a href="https://de.wikipedia.org/wiki/Sextil_Pu%C8%99cariu" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
        Sextil Iosif Pușcariu
      </a>.
    </span>

    <!-- GitHub Icon -->
    <a href="https://github.com/mschwehl/puscariu-etymologisches-woerterbuch" target="_blank" rel="noopener noreferrer" class="text-white hover:text-blue-400">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.207 11.387.6.113.793-.258.793-.577v-2.234c-3.338.724-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.757-1.333-1.757-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.809 1.304 3.495.998.108-.775.42-1.305.763-1.604-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.304-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.005.404 2.291-1.552 3.299-1.23 3.299-1.23.653 1.653.241 2.873.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.192.694.801.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z"/>
      </svg>
    </a>
  </div>
</nav>
<header class="container mx-auto text-center my-8 px-4">
  <h1 class="text-3xl font-bold text-gray-800">Etymologisches Wörterbuch der rumänischen Sprache</h1>
  <p class="text-lg text-gray-600 mt-2">
    I. Lateinisches Element (Sextil Pușcariu, 1905)
    <a href="https://www.oeaw.ac.at/fileadmin/kommissionen/vanishinglanguages/Collections/Romanian_varieties/0_Bibliography_pdfs/Puscariu_1905_-_Etymol._Wb._Rumaenisch.pdf" 
       class="ml-2 inline-flex items-center text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
       <span class="mr-1">Download PDF</span>
       <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
         <path d="M12 3v12l3.5-3.5L17 13.5l-5 5-5-5 1.5-1.5L12 15V3z" />
         <path d="M21 17v2H3v-2H2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2h-1z" />
       </svg>
    </a>
  </p>
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