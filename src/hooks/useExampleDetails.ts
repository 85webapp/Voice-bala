import { useState, useEffect } from 'react';

/**
 * Universal hook for the 'Example Details' setting.
 * When disabled (default: false), all input placeholder hints across the app
 * are completely blank ("").
 * When enabled via Settings -> Form & Drafting -> 'Example Details',
 * the helpful example placeholders (e.g. "Enter business name as on PAN", "e.g. MH02AB1234")
 * are rendered into the input boxes.
 */
export function useExampleDetails() {
  const [showExampleDetails, setShowExampleDetails] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('ctc_show_example_details') === 'true';
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setShowExampleDetails(localStorage.getItem('ctc_show_example_details') === 'true');
      } catch {
        setShowExampleDetails(false);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('ctc_settings_changed', handleUpdate);
    window.addEventListener('ctc_example_details_changed', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('ctc_settings_changed', handleUpdate);
      window.removeEventListener('ctc_example_details_changed', handleUpdate);
    };
  }, []);

  const getPlaceholder = (exampleText: string): string => {
    return showExampleDetails ? exampleText : '';
  };

  return {
    showExampleDetails,
    getPlaceholder
  };
}

/**
 * Synchronous helper for non-component or static utility calls.
 */
export function getStoredExamplePlaceholder(exampleText: string): string {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('ctc_show_example_details') === 'true') {
      return exampleText;
    }
  } catch {}
  return '';
}
