# anews ff dev memo

## chrome extension bg/cs communication

```js

// send: cs to bg
chrome.runtime.sendMessage(message, (receive) => {
    console.log(receive); // sendResponse object
});

// receive: bg
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request); // message
    console.log(sender);  // sender, sender.tab.id,
    sendResponse({});     // callback
});

// send: bg to cs
chrome.tabs.sendMessage(senderTabId, message);

// receive: cs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request); // message
    console.log(sender);  // sender, sedner.id = extension id
    sendResponse({});     // callback
});
```
