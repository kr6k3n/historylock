chrome.runtime.onInstalled.addListener(function(){
  alert("thanks for installing Private History");
  // open config page
  chrome.tabs.create({'url' : './config/config.html'})
  
})

chrome.history.onVisited.addListener(function(HistoryItem){
  //save to private
  //clear history
  console.log(HistoryItem);
})