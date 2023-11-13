import hotkeys from "hotkeys-js";
console.log(`loaded. ${location.href}}`);

class PageApp {
  init() {}
  run() {}
}
class HomeApp extends PageApp {
  cards: HTMLElement[];
  cursor: number;
  constructor() {
    super();
    this.cards = [];
    this.cursor = 0;
  }
  init() {
    hotkeys("j", () => {
      this.scrollDown();
    });
    hotkeys("k", () => {
      this.scrollUp();
    });
    hotkeys("f", () => {
      this.loadOriginalPage();
    });
    hotkeys("q", () => {
      this.closeOriginalPage();
    });
  }
  run() {
    const cards = document.querySelectorAll<HTMLElement>(".document-card");
    console.log(`cards: ${cards ? cards.length : "no"}`);
    if (cards) {
      this.cards = Array.from(cards);
      this.cursor = -1;
    }
  }
  current() {
    let c =
      this.cursor < 0
        ? 0
        : this.cursor >= this.cards.length
        ? this.cards.length - 1
        : this.cursor;

    return this.cards[c];
  }

  scrollToCurrent() {
    const cur = this.current();
    if (cur) {
      const r = cur.getBoundingClientRect();
      const targetTop = r.top + window.scrollY - (r.bottom - r.top) / 2;
      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  }
  scrollDown() {
    console.log(`$scrollDown`);
    if (this.cursor === this.cards.length - 1) {
      console.log("no more");
    } else {
      this.cursor += 1;
    }
    this.scrollToCurrent();
  }
  scrollUp() {
    console.log(`scrollUp`);
    if (this.cursor === 0) {
      console.log("no more");
    } else {
      this.cursor -= 1;
    }
    this.scrollToCurrent();
  }
  loadOriginalPage() {
    console.log(`loadOriginalPage`);
    const cur = this.current();
    if (!cur) {
      return;
    }
    const anchor = cur.querySelector<HTMLAnchorElement>(".title-link a");
    if (!anchor) {
      return;
    }
    this.requestContent(anchor.href);
  }
  closeOriginalPage() {
    console.log(`closeOriginalPage`);
  }

  requestContent(href: string) {
    console.log(`requestContent: ${href}`);
  }
}

type ContentInfo = { status: string; content: string };

class ContentProxy {
  contents: Record<string, ContentInfo>;
  constructor() {
    this.contents = {};
    const onMessageHandler = async (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): Promise<void> => {
      if (!("anewsff" in request)) {
        console.log(`unkown message`, request, sender);
        sendResponse({});
        return;
      }

      const command = request as AnewsFFResponseMessage;
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
    this.contents[href] = { status, content };
  }
}

const pageDispather = (page: string): PageApp | null => {
  switch (page) {
    case "/":
      return new HomeApp();
    default:
      return null;
  }
};

const cp = new ContentProxy();
let mainTimeoutId: number;
const main = () => {
  const mainInner = () => {
    hotkeys.unbind(); // to reset previous bindings

    console.log(`loaded. ${location.href}}`);
    const hash = location.hash;
    if (!hash || !hash.startsWith("#/")) {
      console.log(`unknown location. hash='${hash}'`);
      return;
    }
    const page = hash.slice(1);
    const app = pageDispather(page);
    if (!app) {
      console.log(`unsupported page? page='${page}'`);
      return;
    }
    app.init();
    app.run();
  };
  if (mainTimeoutId) {
    clearTimeout(mainTimeoutId);
  }
  mainTimeoutId = setTimeout(() => {
    try {
      mainInner();
    } catch (e) {
      console.log(`anews ff unhandled error.`, e);
    }
  }, 1000);
};

window.addEventListener("hashchange", (ev) => {
  main();
});
main();
