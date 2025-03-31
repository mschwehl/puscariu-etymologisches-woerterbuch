// js/components/SearchInput.js
import { ref, computed, watch } from 'vue';
import { debounce, truncate } from '../utils.js';

export default {
  props: {
    searchData: { type: Array, required: true, default: () => [] }, // Added default
  },
  emits: ['entry-selected'],
  setup(props, { emit }) {
    const query = ref('');
    const suggestions = ref([]);
    const showSuggestions = ref(false);
    const isLoading = ref(false);
    const focusedIndex = ref(-1);
    const minQueryLength = 2;
    const suggestionsListRef = ref(null);

    watch(query, debounce((newQuery) => {
      focusedIndex.value = -1;
      if (newQuery.length < minQueryLength) {
        suggestions.value = [];
        showSuggestions.value = false;
        return;
      }
      filterSuggestions(newQuery);
      showSuggestions.value = true;
    }, 300));

    const filterSuggestions = (searchTerm) => {
       isLoading.value = true;
       const lowerQuery = searchTerm.toLowerCase();
       // Use setTimeout to allow UI update for loading state
       setTimeout(() => {
           // Check if searchData is available
           if (!props.searchData || props.searchData.length === 0) {
               console.warn("Search data not available for filtering.");
               suggestions.value = [];
               isLoading.value = false;
               return;
           }
           suggestions.value = props.searchData.filter(entry => {
              const idStr = String(entry.id);
              const lemma = (entry.l || '').toLowerCase();
              // --- NEW: Get simplified lemma ---
              const simplifiedLemma = (entry.sl || '').toLowerCase(); // Assumes 'sl' key from JSON
              const definition = (entry.d || '').toLowerCase();

              // --- UPDATED: Check all fields ---
              return idStr.startsWith(lowerQuery) ||
                     lemma.includes(lowerQuery) ||
                     simplifiedLemma.includes(lowerQuery) || // Check simplified lemma
                     definition.includes(lowerQuery);
           }).slice(0, 10); // Limit results
           isLoading.value = false;
       }, 10);
    };

    // --- Keep handleFocus, closeSuggestions, selectSuggestion, focusNext, focusPrevious, selectFocused, ensureFocusedVisible methods unchanged ---
     const handleFocus = () => {
        if (query.value.length >= minQueryLength && suggestions.value.length > 0) {
            showSuggestions.value = true;
        }
    };

    const closeSuggestions = () => {
        setTimeout(() => {
             showSuggestions.value = false;
             focusedIndex.value = -1;
        }, 150);
    };

    const selectSuggestion = (suggestion) => {
      if (!suggestion) return;
      emit('entry-selected', suggestion.id);
      query.value = '';
      suggestions.value = [];
      showSuggestions.value = false;
      focusedIndex.value = -1;
    };

    const focusNext = () => {
      if (suggestions.value.length === 0) return;
      focusedIndex.value = (focusedIndex.value + 1) % suggestions.value.length;
       ensureFocusedVisible();
    };

    const focusPrevious = () => {
      if (suggestions.value.length === 0) return;
      focusedIndex.value = (focusedIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
       ensureFocusedVisible();
    };

    const selectFocused = () => {
      if (focusedIndex.value > -1 && focusedIndex.value < suggestions.value.length) {
        selectSuggestion(suggestions.value[focusedIndex.value]);
      }
    };

     const ensureFocusedVisible = () => {
          const listEl = suggestionsListRef.value;
          if (!listEl || focusedIndex.value < 0 || !listEl.children[focusedIndex.value]) return;
          const focusedElement = listEl.children[focusedIndex.value];
          const listRect = listEl.getBoundingClientRect();
          const elemRect = focusedElement.getBoundingClientRect();
          if (elemRect.top < listRect.top || elemRect.bottom > listRect.bottom) {
              focusedElement.scrollIntoView({ block: 'nearest' });
          }
      };


    return {
      query, suggestions, showSuggestions, isLoading, focusedIndex,
      minQueryLength, suggestionsListRef, handleFocus, selectSuggestion,
      focusNext, focusPrevious, selectFocused, closeSuggestions, truncate // Ensure truncate is returned
    };
  },
  // --- Template remains unchanged ---
  template: `
    <section id="main-search-section" class="container mx-auto max-w-3xl px-4 mb-6">
      <label for="main-search-input" class="block text-sm font-medium text-gray-700 mb-1">Search Entries (ID, Lemma, Definition)</label>
      <div class="relative" @focusout="closeSuggestions">
        <input
          type="text" id="main-search-input" placeholder="z.B. foc, feuer, 635..."
          class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          v-model="query" @focus="handleFocus" @keydown.down.prevent="focusNext"
          @keydown.up.prevent="focusPrevious" @keydown.enter.prevent="selectFocused"
          @keydown.esc="showSuggestions = false" aria-haspopup="listbox" :aria-expanded="showSuggestions">

        <div v-show="showSuggestions && query.length >= minQueryLength" ref="suggestionsListRef"
          id="search-suggestions" class="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto z-10" role="listbox">
          <div v-if="isLoading" class="px-4 py-3 text-sm text-gray-500 italic animate-pulse">Searching...</div>
          <div v-else-if="suggestions.length === 0 && query.length >= minQueryLength" class="px-4 py-3 text-sm text-gray-500 italic">No matching entries found.</div>
          <div v-else v-for="(suggestion, index) in suggestions" :key="suggestion.id"
            class="suggestion-item px-4 py-3 cursor-pointer border-b border-gray-200 last:border-b-0"
            :class="{ 'focused': focusedIndex === index }"
            @click="selectSuggestion(suggestion)" @mouseenter="focusedIndex = index"
            role="option" :aria-selected="focusedIndex === index">
              <span class="text-xs text-gray-400 mr-2">#{{ suggestion.id }}</span>
              <span class="font-medium text-gray-800">{{ suggestion.l || '[No Lemma]' }}</span>
              <!-- Display original definition, truncate is available -->
              <span class="text-sm text-gray-600 ml-2">{{ truncate(suggestion.d, 60) }}</span>
          </div>
        </div>
      </div>
    </section>
  `
};