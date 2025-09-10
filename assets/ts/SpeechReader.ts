class SpeechReader {
  private static instance: SpeechReader;
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private playingButton: Element | null = null;

  private constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
    document.addEventListener('click', (e) => this.handleClick(e as MouseEvent));
  }

  public static init() {
    if (!SpeechReader.instance) SpeechReader.instance = new SpeechReader();
    return SpeechReader.instance;
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as Element;
    const container = target.closest('.speech-reader-button') as HTMLElement | null;
    if (!container) return;
    e.preventDefault();

    // Prefer an anchor inside the control as the source of speech text
    const anchor = (target.closest('a') as HTMLElement | null) || (container.querySelector('a') as HTMLElement | null);
    const source = anchor || container;
    const text = this.extractText(source);
    if (!text) return;
    if (!this.synthesis) return;

    // Keep playingButton as the outer container so styles remain consistent
    if (this.synthesis.speaking && this.playingButton === container) {
      this.stop();
      return;
    }

    this.play(text, container, source);
  }

  private extractText(el: HTMLElement): string | null {
    // Prefer data-speech, then aria-label, then href/text
    const ds = el.getAttribute('data-speech');
    if (ds && ds.trim().length) return ds.trim();
    const al = el.getAttribute('aria-label');
    if (al && al.trim().length) return al.trim();

    const href = (el.getAttribute && el.getAttribute('href')) || null;
    if (href && href.trim().length) {
      // If href contains HTML-encoded content, decode and strip tags
      try {
        const decoded = href.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        // If it looks like HTML, parse it
        if (decoded.indexOf('<') !== -1) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(decoded, 'text/html');
          const txt = doc.body.textContent || '';
          if (txt.trim().length) return txt.trim();
        }
      } catch (e) {
        // fall back
      }
      return href.trim();
    }

    // If the element contains text nodes, join them
    const txt = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    return txt || null;
  }

  private play(text: string, container: HTMLElement, source: HTMLElement) {
    if (!this.synthesis) return;
    this.stop();
    this.utterance = new SpeechSynthesisUtterance(text);
    // simple defaults: let browser choose voice; prefer lang on source (anchor) then container
    const lang = (source.getAttribute && source.getAttribute('data-speech-lang')) || container.getAttribute('data-speech-lang');
    if (lang) this.utterance.lang = lang;
    this.utterance.onend = () => this.onEnd();
    this.utterance.onerror = () => this.onEnd();
    this.synthesis.speak(this.utterance);
    this.playingButton = container;
    container.classList.add('is-speaking');
  }

  private stop() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    if (this.playingButton) {
      this.playingButton.classList.remove('is-speaking');
      this.playingButton = null;
    }
    this.utterance = null;
  }

  private onEnd() {
    if (this.playingButton) this.playingButton.classList.remove('is-speaking');
    this.playingButton = null;
    this.utterance = null;
  }
}

export default SpeechReader;
