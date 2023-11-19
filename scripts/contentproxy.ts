type ContentInfo = { status: string; content: string; type: string };
type CPEvent = "fetchDone";
type FetchDoneCallBack = (ci: ContentInfo) => void;
type CPEventCallback = FetchDoneCallBack;
class ContentProxy {
  contents: Record<string, ContentInfo>;
  eventListeners: Record<CPEvent, Record<string, CPEventCallback[]>>;
  constructor() {
    this.contents = {};
    this.eventListeners = {
      fetchDone: {},
    };
    const onMessageHandler = async (
      response: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): Promise<void> => {
      console.log(response);
      if (!("anewsff" in response)) {
        console.log(`unkown message`, response, sender);
        sendResponse({});
        return;
      }

      const command = response as AnewsFFResponseMessage;
      switch (command.command) {
        case "fetch":
          const { href, ci } = command.results;
          this.onFetchDone(href, ci);
          break;
      }
    };
    chrome.runtime.onMessage.addListener(onMessageHandler);
  }
  fetchContent(href: string, cb: (ci: ContentInfo) => void) {
    const info = this.contents[href];
    if (info) {
      cb(info);
      return;
    }
    this.eventListeners.fetchDone[href] ||= [];
    this.eventListeners.fetchDone[href].push(cb);
    console.log(`fetchContent:send:`, {
      anewsff: 1,
      command: "fetch",
      args: [href],
    });
    chrome.runtime.sendMessage({ anewsff: 1, command: "fetch", args: [href] });
  }
  onFetchDone(href: string, ci: ContentInfo) {
    console.log(`onFetchDone. ${href}`);
    this.contents[href] = ci;
    let cb = this.eventListeners.fetchDone[href].shift();
    while (cb) {
      console.log(`onFetchDone. call cb ${href}`);
      cb(ci);
      cb = this.eventListeners.fetchDone[href].shift();
    }
  }
}

const CONTENT_PROXY = new ContentProxy();
function getContentProxy() {
  return CONTENT_PROXY;
}
export { getContentProxy };
export type { ContentInfo, ContentProxy };
