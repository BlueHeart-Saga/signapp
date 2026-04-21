// services/autosaveService.js

export class AutosaveService {
  constructor(documentId, saveFunction, options = {}) {
    this.documentId = documentId;
    this.saveFunction = saveFunction;
    this.options = {
      debounceTime: 2000, // 2 seconds
      maxRetries: 3,
      ...options
    };
    
    this.timeoutId = null;
    this.isSaving = false;
    this.retryCount = 0;
    this.lastSavedState = null;
    this.saveQueue = [];
  }

  // Debounced save with auto-retry
  scheduleSave(data) {
    // Store data in queue (keep only latest)
    this.saveQueue = [data];
    this.lastSavedState = data;

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Schedule new save
    this.timeoutId = setTimeout(() => this.executeSave(), this.options.debounceTime);
  }

  async executeSave() {
    if (this.isSaving || this.saveQueue.length === 0) {
      return;
    }

    const data = this.saveQueue[0];
    this.isSaving = true;

    try {
      await this.saveFunction(data);
      this.retryCount = 0;
      this.saveQueue.shift();
      
      // Emit success event
      window.dispatchEvent(new CustomEvent('autosave:success', {
        detail: { timestamp: new Date() }
      }));
      
    } catch (error) {
      console.error('Autosave failed:', error);
      
      // Retry logic
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.executeSave(), 1000 * this.retryCount);
        
        window.dispatchEvent(new CustomEvent('autosave:retry', {
          detail: { retryCount: this.retryCount, error }
        }));
      } else {
        // Max retries reached
        window.dispatchEvent(new CustomEvent('autosave:failed', {
          detail: { error, data }
        }));
        
        // Clear queue on final failure
        this.saveQueue = [];
      }
    } finally {
      this.isSaving = false;
    }
  }

  // Force immediate save
  async forceSave(data) {
    this.saveQueue = [data];
    return this.executeSave();
  }

  // Cancel pending saves
  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.saveQueue = [];
  }

  // Check if there are unsaved changes
  hasUnsavedChanges(currentState) {
    return JSON.stringify(currentState) !== JSON.stringify(this.lastSavedState);
  }
}
