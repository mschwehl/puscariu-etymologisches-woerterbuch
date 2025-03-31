// js/components/IndexList.js
import { ref, computed, watch } from 'vue';

export default {
  props: {
    searchData: { type: Array, required: true },
    selectedEntryId: { type: [Number, String, null], default: null }
  },
  emits: ['entry-selected'],
  setup(props, { emit }) {
    const filterQuery = ref('');
    const listContainerRef = ref(null);

    const filteredEntries = computed(() => {
      if (!props.searchData) return [];
      const query = filterQuery.value.toLowerCase().trim(); // Keep query lowercase and trimmed
      if (!query) {
        return props.searchData; // Show all if no filter
      }
      return props.searchData.filter(entry => {
        // Get lemma (lowercase)
        const lemma = (entry.l || '').toLowerCase();
        // Get ID as string
        const idStr = String(entry.id); // Convert ID to string for comparison

        // --- MODIFICATION START ---
        // Check if lemma includes query OR id string starts with query
        return lemma.includes(query) || idStr.startsWith(query);
        // --- MODIFICATION END ---
      });
    });

    const selectEntry = (entryId) => {
       emit('entry-selected', entryId);
    };

     const isActive = (entryId) => {
        return props.selectedEntryId !== null && String(props.selectedEntryId) === String(entryId);
     };

     // Scroll active link into view when selectedEntryId changes
     watch(() => props.selectedEntryId, (newId) => {
         if (newId !== null && listContainerRef.value) {
             setTimeout(() => {
                 const activeLink = listContainerRef.value.querySelector(`.index-link[href="#entry-${newId}"]`);
                 if (activeLink) {
                     activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                 }
             }, 50); // Small delay might help ensure element exists after render
         }
     });

    return { filterQuery, filteredEntries, selectEntry, isActive, listContainerRef };
  },
  // --- Template remains unchanged ---
  template: `
    <aside class="w-full md:w-1/4 lg:w-1/5">
      <div class="sticky top-20">
        <div class="mb-3">
          <label for="index-filter-input" class="block text-xs font-medium text-gray-600 mb-1">Filter Index (Lemma or ID)</label> <!-- Updated label slightly -->
          <input type="text" id="index-filter-input" placeholder="Filter list..."
            class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            v-model="filterQuery">
        </div>
        <div id="entry-list-container" class="bg-white p-3 rounded-md shadow border border-gray-200" ref="listContainerRef">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">Index</h3>
          <div id="entry-list" class="text-sm space-y-1">
            <div v-if="!searchData || searchData.length === 0" class="text-xs text-gray-400">Loading index...</div>
            <a v-else v-for="entry in filteredEntries" :key="entry.id" :href="'#entry-' + entry.id"
              class="index-link block text-gray-700 hover:bg-gray-100 rounded px-2 py-1 text-sm"
              :class="{ 'active-link': isActive(entry.id) }"
              @click.prevent="selectEntry(entry.id)">
                {{ entry.id }}. {{ entry.l || '[No Lemma]' }} {{ entry.p ? '(' + entry.p + ')' : '' }}
            </a>
            <div v-if="searchData.length > 0 && filteredEntries.length === 0" class="text-xs text-gray-400 italic px-2 py-1">No matching entries in index.</div>
          </div>
        </div>
      </div>
    </aside>
  `
};