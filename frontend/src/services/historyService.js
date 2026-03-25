// services/historyService.js

export class HistoryService {
  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
    this.clear();
  }

  clear() {
    this.past = [];
    this.present = null;
    this.future = [];
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }

  push(state) {
    if (JSON.stringify(this.present) === JSON.stringify(state)) {
      return;
    }

    if (this.present !== null) {
      this.past.push(this.present);
      
      // Limit history size
      if (this.past.length > this.maxHistorySize) {
        this.past.shift();
      }
    }

    this.present = JSON.parse(JSON.stringify(state)); // Deep copy
    this.future = [];
  }

  undo() {
    if (!this.canUndo()) {
      return this.present;
    }

    this.future.unshift(this.present);
    this.present = this.past.pop();
    
    return JSON.parse(JSON.stringify(this.present)); // Deep copy
  }

  redo() {
    if (!this.canRedo()) {
      return this.present;
    }

    this.past.push(this.present);
    this.present = this.future.shift();
    
    return JSON.parse(JSON.stringify(this.present)); // Deep copy
  }

  getState() {
    return JSON.parse(JSON.stringify(this.present)); // Deep copy
  }

  getHistoryInfo() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      pastCount: this.past.length,
      futureCount: this.future.length
    };
  }
}