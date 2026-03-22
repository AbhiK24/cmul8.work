/**
 * Anti-cheating detection utilities for WorkSim
 * Tracks behavioral signals that may indicate external assistance
 */

export interface CheatSignal {
  type: string;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface AntiCheatState {
  signals: CheatSignal[];
  tabSwitchCount: number;
  totalBlurTime: number;
  pasteCount: number;
  rapidResponseCount: number;  // Responses faster than humanly possible
  lastBlurTime: number | null;
}

const SUSPICIOUS_RESPONSE_THRESHOLD = 500;  // Less than 500ms is suspicious

class AntiCheatDetector {
  private state: AntiCheatState = {
    signals: [],
    tabSwitchCount: 0,
    totalBlurTime: 0,
    pasteCount: 0,
    rapidResponseCount: 0,
    lastBlurTime: null,
  };

  private messageStartTime: number | null = null;

  init(_sessionId: string) {
    this.setupListeners();
  }

  private setupListeners() {
    // Tab visibility detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Window blur/focus (catches more than visibility)
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);

    // Paste detection (will be called from input handlers)
    // Copy detection
    document.addEventListener('copy', this.handleCopy);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.addSignal('tab_hidden', { timestamp: Date.now() });
      this.state.tabSwitchCount++;
    } else {
      this.addSignal('tab_visible', {
        timestamp: Date.now(),
        hiddenDuration: this.state.lastBlurTime
          ? Date.now() - this.state.lastBlurTime
          : 0
      });
    }
  };

  private handleBlur = () => {
    this.state.lastBlurTime = Date.now();
    this.addSignal('window_blur', { timestamp: Date.now() });
  };

  private handleFocus = () => {
    if (this.state.lastBlurTime) {
      const blurDuration = Date.now() - this.state.lastBlurTime;
      this.state.totalBlurTime += blurDuration;
      this.addSignal('window_focus', {
        timestamp: Date.now(),
        blurDuration
      });
      this.state.lastBlurTime = null;
    }
  };

  private handleCopy = () => {
    this.addSignal('copy_detected', { timestamp: Date.now() });
  };

  // Call this when user starts typing a message
  startTyping() {
    this.messageStartTime = Date.now();
  }

  // Call this when user pastes content
  detectPaste(pastedText: string) {
    this.state.pasteCount++;
    this.addSignal('paste_detected', {
      timestamp: Date.now(),
      textLength: pastedText.length,
      pasteCount: this.state.pasteCount
    });
  }

  // Call this when message is sent
  messageSent(messageLength: number): { suspicious: boolean; reason?: string } {
    const result = { suspicious: false, reason: undefined as string | undefined };

    if (this.messageStartTime) {
      const typingTime = Date.now() - this.messageStartTime;
      const charsPerSecond = messageLength / (typingTime / 1000);

      // Flag impossibly fast typing (>15 chars/second for long messages)
      if (messageLength > 50 && charsPerSecond > 15) {
        this.state.rapidResponseCount++;
        this.addSignal('rapid_response', {
          timestamp: Date.now(),
          messageLength,
          typingTime,
          charsPerSecond: charsPerSecond.toFixed(2)
        });
        result.suspicious = true;
        result.reason = 'rapid_typing';
      }

      // Flag responses that come faster than reading + typing time
      if (typingTime < SUSPICIOUS_RESPONSE_THRESHOLD && messageLength > 20) {
        this.addSignal('instant_response', {
          timestamp: Date.now(),
          messageLength,
          typingTime
        });
        result.suspicious = true;
        result.reason = 'instant_response';
      }
    }

    this.messageStartTime = null;
    return result;
  }

  private addSignal(type: string, details: Record<string, unknown>) {
    this.state.signals.push({
      type,
      timestamp: Date.now(),
      details
    });
  }

  // Get summary for sending to backend
  getSummary(): {
    tabSwitches: number;
    totalBlurTimeSeconds: number;
    pasteCount: number;
    rapidResponses: number;
    signalCount: number;
    riskScore: number;  // 0-100
  } {
    // Calculate risk score
    let riskScore = 0;

    // Tab switches: +5 per switch, max 30
    riskScore += Math.min(this.state.tabSwitchCount * 5, 30);

    // Blur time: +1 per 30 seconds, max 20
    riskScore += Math.min(Math.floor(this.state.totalBlurTime / 30000), 20);

    // Pastes: +10 per paste, max 30
    riskScore += Math.min(this.state.pasteCount * 10, 30);

    // Rapid responses: +15 per rapid response, max 20
    riskScore += Math.min(this.state.rapidResponseCount * 15, 20);

    return {
      tabSwitches: this.state.tabSwitchCount,
      totalBlurTimeSeconds: Math.round(this.state.totalBlurTime / 1000),
      pasteCount: this.state.pasteCount,
      rapidResponses: this.state.rapidResponseCount,
      signalCount: this.state.signals.length,
      riskScore: Math.min(riskScore, 100)
    };
  }

  // Get all signals for detailed analysis
  getSignals(): CheatSignal[] {
    return [...this.state.signals];
  }

  // Cleanup
  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('copy', this.handleCopy);
  }
}

// Singleton instance
export const antiCheat = new AntiCheatDetector();
