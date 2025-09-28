const rulesContainer = document.getElementById("rules-container");
const addRuleBtn = document.getElementById("add-rule");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

let rules = [];
let draggedElement = null;
let draggedIndex = null;

// Drag and drop handlers
function handleDragStart(e) {
  draggedElement = this;
  draggedIndex = parseInt(this.dataset.ruleIndex);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  // Clean up any remaining drag-over states
  document.querySelectorAll('.rule-container').forEach(container => {
    container.classList.remove('drag-over');
  });
  draggedElement = null;
  draggedIndex = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Allows us to drop
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation(); // Stops some browsers from redirecting
  }
  
  if (draggedElement !== this) {
    const dropIndex = parseInt(this.dataset.ruleIndex);
    
    // Reorder the rules array
    const draggedRule = rules[draggedIndex];
    rules.splice(draggedIndex, 1); // Remove from old position
    rules.splice(dropIndex, 0, draggedRule); // Insert at new position
    
    // Re-render the rules
    renderRules();
  }
  
  this.classList.remove('drag-over');
  return false;
}

// Create a rule UI element
function createRuleElement(rule, index) {
  const ruleDiv = document.createElement("div");
  ruleDiv.className = "rule-container";
  ruleDiv.dataset.ruleIndex = index; // Store index as data attribute
  ruleDiv.draggable = true;
  ruleDiv.innerHTML = `
    <div class="drag-handle"></div>
    <div class="rule-content">
      <button class="remove-rule">Remove</button>
      <div class="rule-type">
        <label>
          <input type="radio" name="type-${index}" value="selector" ${rule.type === 'selector' ? 'checked' : ''}> 
          CSS Selector
        </label>
        <label style="margin-left: 20px;">
          <input type="radio" name="type-${index}" value="text" ${rule.type === 'text' ? 'checked' : ''}> 
          Text Contains
        </label>
      </div>
      <input type="text" class="rule-value" value="${rule.value}" placeholder="${rule.type === 'text' ? 'Enter text to match...' : 'Enter CSS selector...'}">
      <div class="help-text">
        ${rule.type === 'text' 
          ? 'Matches any clickable element containing this text (case-insensitive)'
          : 'Standard CSS selector like button.class-name or #element-id'
        }
      </div>
    </div>
  `;
  
  // Add event listeners for type change
  const radioButtons = ruleDiv.querySelectorAll('input[type="radio"]');
  const valueInput = ruleDiv.querySelector('.rule-value');
  const helpText = ruleDiv.querySelector('.help-text');
  
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      const newType = radio.value;
      if (newType === 'text') {
        valueInput.placeholder = 'Enter text to match...';
        helpText.textContent = 'Matches any clickable element containing this text (case-insensitive)';
      } else {
        valueInput.placeholder = 'Enter CSS selector...';
        helpText.textContent = 'Standard CSS selector like button.class-name or #element-id';
      }
    });
  });
  
  // Add drag event listeners
  ruleDiv.addEventListener('dragstart', handleDragStart);
  ruleDiv.addEventListener('dragend', handleDragEnd);
  ruleDiv.addEventListener('dragover', handleDragOver);
  ruleDiv.addEventListener('drop', handleDrop);
  ruleDiv.addEventListener('dragenter', handleDragEnter);
  ruleDiv.addEventListener('dragleave', handleDragLeave);
  
  return ruleDiv;
}

// Remove a rule
function removeRule(index) {
  rules.splice(index, 1);
  renderRules();
}

// Event delegation for remove buttons
rulesContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-rule')) {
    const ruleContainer = e.target.closest('.rule-container');
    const index = parseInt(ruleContainer.dataset.ruleIndex);
    removeRule(index);
  }
});

// Render all rules
function renderRules() {
  rulesContainer.innerHTML = '';
  rules.forEach((rule, index) => {
    rulesContainer.appendChild(createRuleElement(rule, index));
  });
}

// Add a new rule
addRuleBtn.addEventListener("click", () => {
  rules.push({ type: 'selector', value: '' });
  renderRules();
});

// Save all rules
saveBtn.addEventListener("click", () => {
  // Collect current state from the UI in visual order
  const ruleElements = rulesContainer.querySelectorAll('.rule-container');
  const updatedRules = [];
  
  ruleElements.forEach((element, index) => {
    const typeRadio = element.querySelector('input[type="radio"]:checked');
    const valueInput = element.querySelector('.rule-value');
    const value = valueInput.value.trim();
    
    if (value && typeRadio) {
      updatedRules.push({
        type: typeRadio.value,
        value: value
      });
    }
  });
  
  // Migration: Convert old selector format to new format
  chrome.storage.sync.get(["selectors"], (result) => {
    if (result.selectors && Array.isArray(result.selectors) && typeof result.selectors[0] === 'string') {
      // Old format detected, convert to new format
      const convertedRules = result.selectors.map(selector => ({
        type: 'selector',
        value: selector
      }));
      updatedRules.push(...convertedRules);
      // Remove old format
      chrome.storage.sync.remove(["selectors"]);
    }
    
    // Save new format
    chrome.storage.sync.set({ rules: updatedRules }, () => {
      status.textContent = "Saved!";
      status.className = "success";
      setTimeout(() => {
        status.textContent = "";
        status.className = "";
      }, 2000);
      
      // Update internal rules array to match saved order
      rules = updatedRules;
      renderRules();
    });
  });
});

// Load saved rules
chrome.storage.sync.get(["rules", "selectors"], (result) => {
  if (result.rules) {
    // New format
    rules = result.rules;
  } else if (result.selectors) {
    // Old format - convert to new format
    rules = result.selectors.map(selector => ({
      type: 'selector',
      value: selector
    }));
  } else {
    // No rules yet - add a default example
    rules = [
      { type: 'selector', value: 'button.continue-btn' },
      { type: 'text', value: 'Continue' }
    ];
  }
  
  renderRules();
});
