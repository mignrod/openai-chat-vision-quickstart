class SpeechInputButton extends HTMLElement {
  constructor() {
    super();
    this.isRecording = false;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.dispatchEvent(
        new CustomEvent("speecherror", {
          detail: { error: "SpeechRecognition not supported" },
        })
      );
      return;
    }
    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.lang = navigator.language || navigator.userLanguage;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.maxAlternatives = 1;
  }

  connectedCallback() {
    this.innerHTML = `
        <button class="btn btn-outline-secondary" type="button">
            <i class="bi bi-mic"></i>
        </button>`;
    this.recordButton = this.querySelector("button");
    this.recordButton.addEventListener("click", () => this.toggleRecording());
  }

  renderButtonOn() {
    this.recordButton.classList.add("speech-input-active");
    this.recordButton.innerHTML = '<i class="bi bi-mic-fill"></i>';
  }

  renderButtonOff() {
    this.recordButton.classList.remove("speech-input-active");
    this.recordButton.innerHTML = '<i class="bi bi-mic"></i>';
  }

  startRecording() {
    if (this.speechRecognition == null) {
      this.dispatchEvent(
        new CustomEvent("speech-input-error", {
          detail: { error: "SpeechRecognition not supported" },
        })
      );
    }

    this.speechRecognition.onresult = (event) => {
      let input = "";
      for (const result of event.results) {
        input += result[0].transcript;
      }
      this.dispatchEvent(
        new CustomEvent("speech-input-result", {
          detail: { transcript: input },
        })
      );
    };

    this.speechRecognition.onend = () => {
      // NOTE: In some browsers (e.g. Chrome), the recording will stop automatically after a few seconds of silence.
      this.isRecording = false;
      this.renderButtonOff();
      this.dispatchEvent(new Event("speech-input-end"));
    };

    this.speechRecognition.onerror = (event) => {
      if (this.speechRecognition) {
        this.speechRecognition.stop();
        if (event.error == "no-speech") {
          this.dispatchEvent(
            new CustomEvent("speech-input-error", {
              detail: {
                error:
                  "No speech was detected. Please check your system audio settings and try again.",
              },
            })
          );
        } else if (event.error == "language-not-supported") {
          this.dispatchEvent(
            new CustomEvent("speech-input-error", {
              detail: {
                error:
                  "The selected language is not supported. Please try a different language.",
              },
            })
          );
        } else {
          this.dispatchEvent(
            new CustomEvent("speech-input-error", {
              detail: {
                error: "An error occurred while recording. Please try again.",
              },
            })
          );
        }
      }
    };

    this.speechRecognition.start();
    this.isRecording = true;
    this.renderButtonOn();
  }

  toggleRecording() {
    if (this.isRecording) {
      this.speechRecognition.stop();
    } else {
      this.startRecording();
    }
  }
}

customElements.define("speech-input-button", SpeechInputButton);
