type ContentInfo = { status: string; content: string };
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
          const { href, status, content } = command.results;
          this.onFetchDone({ href, status, content });
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
  onFetchDone({
    href,
    status,
    content,
  }: {
    href: string;
    status: string;
    content: string;
  }) {
    console.log(`onFetchDone. ${href}`);
    this.contents[href] = { status, content };
    let cb = this.eventListeners.fetchDone[href].shift();
    while (cb) {
      console.log(`onFetchDone. call cb ${href}`);
      cb({ status, content });
      cb = this.eventListeners.fetchDone[href].shift();
    }
  }
}

export default ContentProxy;
export type { ContentInfo };
