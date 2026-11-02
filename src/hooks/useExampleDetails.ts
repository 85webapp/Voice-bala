export function useExampleDetails() {
  return { showExampleDetails: false, getPlaceholder: (_exampleText: string) => '' };
}

/**
 * Synchronous helper for non-component or static utility calls.
 */
export function getStoredExamplePlaceholder(exampleText: string): string {
  void exampleText;
  return '';
}
