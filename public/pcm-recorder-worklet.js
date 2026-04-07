/**
 * PCM Audio Recorder Worklet Processor
 *
 * Runs on a dedicated audio thread (separate from main JS thread).
 * Captures raw Float32 PCM samples directly from the microphone —
 * no encoding, no container format, no MediaRecorder.
 *
 * This eliminates all browser-specific format issues (WebM/OGG/MP4)
 * and guarantees consistent, lossless audio capture across all platforms.
 *
 * Communication with main thread via MessagePort:
 *   Main → Worklet: { command: 'start' | 'stop' | 'flush' }
 *   Worklet → Main: { type: 'audio', samples: Float32Array }
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 */
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._recording = false;
    this._buffer = [];
    this._bufferSize = 0;
    // Flush every ~100ms worth of samples to avoid excessive message passing
    // At 16kHz: 1600 samples = 100ms
    this._flushThreshold = 1600;

    this.port.onmessage = (event) => {
      const { command } = event.data;
      if (command === 'start') {
        this._recording = true;
        this._buffer = [];
        this._bufferSize = 0;
      } else if (command === 'stop') {
        this._recording = false;
        this._flush();
      } else if (command === 'flush') {
        this._flush();
      }
    };
  }

  /**
   * Called by the audio system with 128 samples per invocation.
   * We accumulate samples and flush in batches to reduce message overhead.
   */
  process(inputs) {
    if (!this._recording) return true;

    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // Take first channel (mono)
    const channelData = input[0];
    if (!channelData || channelData.length === 0) return true;

    // Copy samples — the input buffer is reused by the audio system
    const copy = new Float32Array(channelData.length);
    copy.set(channelData);
    this._buffer.push(copy);
    this._bufferSize += copy.length;

    // Flush when we have enough samples
    if (this._bufferSize >= this._flushThreshold) {
      this._flush();
    }

    return true;
  }

  /**
   * Concatenate buffered chunks and send to main thread.
   * Uses transferable ArrayBuffer to avoid copy overhead.
   */
  _flush() {
    if (this._buffer.length === 0) return;

    const totalLength = this._bufferSize;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < this._buffer.length; i++) {
      merged.set(this._buffer[i], offset);
      offset += this._buffer[i].length;
    }

    this._buffer = [];
    this._bufferSize = 0;

    // Transfer the underlying ArrayBuffer — zero-copy to main thread
    this.port.postMessage(
      { type: 'audio', samples: merged },
      [merged.buffer]
    );
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
