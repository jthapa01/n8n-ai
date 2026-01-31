import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/constants";

// =============================================================================
// USE ENTITY SEARCH HOOK
// =============================================================================
// A reusable debounced search hook for entity lists (workflows, users, etc.)
//
// Problem it solves:
//   Without debouncing: User types "hello" → 5 API calls ("h", "he", "hel", "hell", "hello")
//   With debouncing:    User types "hello" → 1 API call after 500ms pause
//
// Two-State Pattern:
//   localSearch  = What user sees in the input (updates instantly for smooth UX)
//   params.search = What's in the URL / triggers API (updates after debounce)
// =============================================================================

// -----------------------------------------------------------------------------
// PROPS INTERFACE
// -----------------------------------------------------------------------------
// Generic type T must have at least { search: string, page: number }
// This allows the hook to work with any params object that includes these fields
// Extra fields (like pageSize, sort, etc.) are preserved when updating
//
// Example valid T types:
//   { search: string, page: number }                    ← minimal
//   { search: string, page: number, pageSize: number }  ← with extra fields
// -----------------------------------------------------------------------------
interface UseEntitySearchProps<T extends {
    search: string;
    page: number;
}> {
    params: T;                           // Current URL params (from nuqs)
    setParams: (params: T) => void;      // Function to update URL params
    debounceMs?: number;                 // Debounce delay (default: 500ms)
}

/**
 * Hook for debounced search input with URL synchronization.
 * 
 * @param params - Current search params from URL (via nuqs useQueryStates)
 * @param setParams - Function to update URL params
 * @param debounceMs - Delay before syncing to URL (default: 500ms)
 * 
 * @returns { searchValue, onSearchChange }
 *   - searchValue: Bind to input's `value` prop
 *   - onSearchChange: Bind to input's `onChange` handler
 * 
 * @example
 * ```tsx
 * const [params, setParams] = useWorkflowsParams();
 * const { searchValue, onSearchChange } = useEntitySearch({ params, setParams });
 * 
 * return (
 *   <input
 *     value={searchValue}
 *     onChange={(e) => onSearchChange(e.target.value)}
 *   />
 * );
 * ```
 * 
 * Flow diagram:
 * ```
 * User types → localSearch (instant) → [500ms delay] → params.search (URL/API)
 *                                                              ↓
 * URL changes (back button) ────────────────────────→ localSearch (instant)
 * ```
 */
export function useEntitySearch<T extends {
    search: string;
    page: number;
}>({
    params,
    setParams,
    debounceMs = 500,
}: UseEntitySearchProps<T>) {
    // -------------------------------------------------------------------------
    // LOCAL STATE
    // -------------------------------------------------------------------------
    // localSearch = the "fast" state for instant UI feedback
    // Initialized with current URL value so input shows correct value on load
    // -------------------------------------------------------------------------
    const [localSearch, setLocalSearch] = useState(params.search);

    // -------------------------------------------------------------------------
    // EFFECT 1: localSearch → params (DEBOUNCED)
    // -------------------------------------------------------------------------
    // Syncs local input value to URL params after user stops typing
    // 
    // Why debounce?
    //   - Prevents API call on every keystroke
    //   - Waits for user to "finish" typing (500ms pause)
    //   - Single API call instead of many
    //
    // Why reset page to 1?
    //   - New search = new results = start from page 1
    //   - Prevents "no results" if user was on page 5 of old search
    // -------------------------------------------------------------------------
    useEffect(() => {
        // Instant clear: If user clears input completely, update URL immediately
        // (no need to wait 500ms for clearing - user intent is obvious)
        if (localSearch === "" && params.search !== "") {
            setParams({ ...params, search: "", page: PAGINATION.DEFAULT_PAGE });
            return; // Exit early, skip debounce timer
        }

        // Start debounce timer - will fire after `debounceMs` of no changes
        const timer = setTimeout(() => {
            // Only update if value actually changed (prevents unnecessary re-renders)
            if (localSearch !== params.search) {
                setParams({ ...params, search: localSearch, page: PAGINATION.DEFAULT_PAGE });
            }
        }, debounceMs);

        // Cleanup: Cancel timer if localSearch changes before timer fires
        // This is what creates the "debounce" effect - each keystroke resets the timer
        return () => clearTimeout(timer);
    }, [localSearch, params, setParams, debounceMs]);

    // -------------------------------------------------------------------------
    // EFFECT 2: params → localSearch (INSTANT)
    // -------------------------------------------------------------------------
    // Syncs URL params back to local input state
    //
    // When does params.search change externally?
    //   - User clicks browser back/forward button
    //   - User pastes a URL with ?search=...
    //   - User clicks a link with search params
    //   - Another component updates the URL
    //
    // This ensures the input always matches the URL (two-way sync)
    // -------------------------------------------------------------------------
    useEffect(() => {
        setLocalSearch(params.search);
    }, [params.search]);

    // -------------------------------------------------------------------------
    // RETURN VALUES
    // -------------------------------------------------------------------------
    // searchValue: The current input value (localSearch, not params.search)
    //              Updates instantly for smooth typing experience
    //
    // onSearchChange: Function to update localSearch
    //                 Pass setLocalSearch directly (it's already the right type)
    // -------------------------------------------------------------------------
    return { searchValue: localSearch, onSearchChange: setLocalSearch };
}