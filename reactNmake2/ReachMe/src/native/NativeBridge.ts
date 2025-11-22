// Minimal NativeBridge shim. Replace with native modules for Android/iOS as needed.
const NativeBridge = {
  async playAlarm(opts: { tone?: string; fileId?: string }) {
    console.log('NativeBridge.playAlarm', opts);
    // TODO: wire to native module to play exact alarm on Android
    return Promise.resolve();
  },
  async downloadFile(url: string, id: string) {
    console.log('NativeBridge.downloadFile', url, id);
    return Promise.resolve('/tmp/' + id);
  },
  async showOverlay(opts: any) {
    console.log('NativeBridge.showOverlay', opts);
    return Promise.resolve();
  },
  async stopForegroundService() {
    console.log('NativeBridge.stopForegroundService');
    return Promise.resolve();
  },
  async startForegroundService() {
    console.log('NativeBridge.startForegroundService');
    return Promise.resolve();
  },
};

export default NativeBridge;
