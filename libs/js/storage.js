function getStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (!emptyObj(items)){
        resolve(items[key]);
      } else {
        resolve(false)
      }
    });
  });
}
