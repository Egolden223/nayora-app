export class VoiceRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t),
    );
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("not recording"));
        return;
      }
      this.recorder.onstop = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read failed"));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      };
      this.recorder.stop();
    });
  }

  cancel(): void {
    this.recorder?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}
