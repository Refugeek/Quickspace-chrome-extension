(function () {
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  function isClickable(el) {
    if (!el) return false;
    
    // Check if element is a button or has click listeners
    const tagName = el.tagName.toLowerCase();
    if (['button', 'a', 'input'].includes(tagName)) return true;
    
    // Check if element has click cursor or onclick handlers
    const style = window.getComputedStyle(el);
    if (style.cursor === 'pointer') return true;
    
    // Check for common clickable roles/attributes
    if (el.hasAttribute('onclick') || el.getAttribute('role') === 'button') return true;
    
    // Check if any parent is clickable (up to 3 levels)
    let parent = el.parentElement;
    let level = 0;
    while (parent && level < 3) {
      const parentTag = parent.tagName.toLowerCase();
      if (['button', 'a'].includes(parentTag)) return true;
      if (parent.hasAttribute('onclick') || parent.getAttribute('role') === 'button') return true;
      parent = parent.parentElement;
      level++;
    }
    
    return false;
  }

  function findElementsByText(text) {
    const elements = [];
    const searchText = text.toLowerCase();
    
    // Get all elements that might contain text
    const allElements = document.querySelectorAll('*');
    
    for (const el of allElements) {
      // Skip elements that are not visible or not clickable
      if (!isVisible(el) || !isClickable(el)) continue;
      
      // Check if element's text content contains our search text
      const elementText = el.textContent || el.innerText || '';
      if (elementText.toLowerCase().includes(searchText)) {
        // Prefer elements where the text is more prominent (shorter total text = more relevant)
        elements.push({
          element: el,
          relevance: searchText.length / elementText.length,
          textLength: elementText.length
        });
      }
      
      // Also check common attributes that might contain text
      const ariaLabel = el.getAttribute('aria-label') || '';
      const title = el.getAttribute('title') || '';
      const alt = el.getAttribute('alt') || '';
      
      if (ariaLabel.toLowerCase().includes(searchText) || 
          title.toLowerCase().includes(searchText) || 
          alt.toLowerCase().includes(searchText)) {
        elements.push({
          element: el,
          relevance: 1, // High relevance for attribute matches
          textLength: elementText.length || 1
        });
      }
    }
    
    // Sort by relevance (higher relevance first) and then by shorter text length
    elements.sort((a, b) => {
      if (Math.abs(a.relevance - b.relevance) > 0.1) {
        return b.relevance - a.relevance;
      }
      return a.textLength - b.textLength;
    });
    
    return elements.map(item => item.element);
  }

  function handleRule(rule) {
    console.log(`QuickSpace-Shortcut: Processing ${rule.type} rule:`, rule.value);
    
    let matches = [];
    
    if (rule.type === 'selector') {
      try {
        matches = Array.from(document.querySelectorAll(rule.value));
      } catch (e) {
        console.warn(`QuickSpace-Shortcut: Invalid CSS selector "${rule.value}":`, e);
        return false;
      }
    } else if (rule.type === 'text') {
      matches = findElementsByText(rule.value);
    }
    
    console.log(`QuickSpace-Shortcut: Found ${matches.length} matches for ${rule.type} "${rule.value}"`);
    
    // Try to click the first visible match
    for (let i = 0; i < matches.length; i++) {
      const element = matches[i];
      if (isVisible(element)) {
        console.log(`QuickSpace-Shortcut: Clicking element for ${rule.type} "${rule.value}":`, element);
        element.click();
        return true; // Successfully clicked
      }
    }
    
    return false; // No visible element found
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.code !== "Space" || e.repeat) return;

      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();

      // Handle both old and new storage formats
      chrome.storage.sync.get(["rules", "selectors"], (result) => {
        let rules = [];
        
        if (result.rules) {
          // New format
          rules = result.rules;
        } else if (result.selectors) {
          // Old format - convert on the fly
          rules = result.selectors.map(selector => ({
            type: 'selector',
            value: selector
          }));
        }

        console.log("QuickSpace-Shortcut: Searching in frame", window.location.href);
        console.log("QuickSpace-Shortcut: Processing", rules.length, "rules");

        // Try each rule until one succeeds
        for (const rule of rules) {
          if (handleRule(rule)) {
            break; // Stop after first successful click
          }
        }
      });
    },
    true
  );
})();
