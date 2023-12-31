import hotkeys from "hotkeys-js";
import { sanitize } from "isomorphic-dompurify";

import { getContentProxy } from "./contentproxy";
import type { ContentProxy, ContentInfo } from "./contentproxy";

type KeyStroke = string;
type PageEventType =
  | "reloadPage"
  | "scrollDown"
  | "scrollUp"
  | "scrollLeft"
  | "scrollRight"
  | "loadOriginalPage"
  | "closeOriginalPage"
  | "gotoOriginalPage"
  | "markThisArticle";
type KeyEventMap = Record<KeyStroke, PageEventType>;
const DefaultKeyEventMap: KeyEventMap = {
  j: "scrollDown",
  k: "scrollUp",
  f: "loadOriginalPage",
  q: "closeOriginalPage",
  enter: "gotoOriginalPage",
  t: "markThisArticle",
  r: "reloadPage",
};
const ANEWSFF_CONTENT_BLOCK_ID = "anewsff-content-block";

class PageApp {
  contentProxy: ContentProxy;
  items: HTMLElement[][];
  itemCursors: number[];
  columnCoursor: number;
  keyEventMap: KeyEventMap;
  constructor() {
    this.items = [];
    this.itemCursors = [];
    this.columnCoursor = 1;
    this.contentProxy = getContentProxy();
    this.keyEventMap = DefaultKeyEventMap;
  }
  init() {
    this._initKeyEvent();
  }
  _initKeyEvent() {
    for (let k in this.keyEventMap) {
      hotkeys(k, () => {
        this[this.keyEventMap[k]]();
      });
    }
  }
  run() {}
  current() {
    const cc = this.columnCoursor;
    const ic = this.itemCursors[cc];
    let c =
      ic < 0 ? 0 : ic >= this.items[cc].length ? this.items[cc].length - 1 : ic;

    return this.items[cc][c];
  }
  reloadPage() {
    location.reload();
  }

  scrollToCurrent() {
    const cur = this.current();
    if (cur) {
      const r = cur.getBoundingClientRect();
      // FIXME: なんか変な位置にスクロールする
      const targetTop = r.top + window.scrollY - (r.bottom - r.top) / 2;
      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  }
  scrollDown() {
    console.log(
      `scrollDown:${this.columnCoursor}, ${
        this.itemCursors[this.columnCoursor]
      }`
    );
    const cc = this.columnCoursor;
    if (this.itemCursors[cc] === this.items[cc].length - 1) {
      console.log("no more");
    } else {
      this.itemCursors[cc] += 1;
    }
    this.scrollToCurrent();
  }

  scrollUp() {
    console.log(
      `scrollUp:${this.columnCoursor}, ${this.itemCursors[this.columnCoursor]}`
    );
    const cc = this.columnCoursor;
    if (this.itemCursors[cc] === 0) {
      console.log("no more");
    } else {
      this.itemCursors[cc] -= 1;
    }
    this.scrollToCurrent();
  }
  loadOriginalPage() {
    console.log(`loadOriginalPage not implemente.`);
  }
  closeOriginalPage() {
    console.log(`closeOriginalPage not implemented.`);
    const original = document.querySelector(`#${ANEWSFF_CONTENT_BLOCK_ID}`);
    if (original) {
      original.parentElement?.removeChild(original);
    }
  }
  gotoOriginalPage() {
    console.log(`closeOriginalPage not implemented.`);
  }
  markThisArticle() {
    // タグ・メモしてマーク呼びたい
    console.log(`markThisArticle not implemented.`);
  }
  scrollLeft() {
    this.columnCoursor += 1;
    this.columnCoursor %= this.items.length;
  }
  scrollRight() {
    this.columnCoursor += this.items.length - 1;
    this.columnCoursor %= this.items.length;
  }
  createFullContentBlock(ci: ContentInfo): HTMLDivElement {
    const ffBlock = document.createElement("div");
    ffBlock.setAttribute("class", "anewsff-content");
    const ta = document.createElement("iframe");
    ta.width = "100%";
    ta.height = "100%";
    ta.srcdoc = extractHtmlArticleContent(ci.content);
    // ta.innerHTML = extractHtmlArticleContent(ci.content); //
    ffBlock.appendChild(ta);
    return ffBlock;
  }
}

class HomeApp extends PageApp {
  init() {
    super.init();
    const cards = document.querySelectorAll<HTMLElement>(".document-card");
    console.log(`cards: ${cards ? cards.length : "no"}`);
    if (cards) {
      this.items = [[], Array.from(cards), []];
      this.columnCoursor = 1;
      this.itemCursors = [-1, -1, -1];
    }
  }
  loadOriginalPage(): void {
    if (this.columnCoursor !== 1) {
      return;
    }
    const cur = this.current();
    if (!cur) {
      return;
    }
    const anchor = cur.querySelector<HTMLAnchorElement>(".title-link a");
    if (!anchor) {
      return;
    }
    const u = new URL(anchor.href);
    this.requestContent(u, cur);
  }
  gotoOriginalPage(): void {
    if (this.columnCoursor !== 1) {
      return;
    }

    const cur = this.current();
    if (!cur) {
      return;
    }
    const anchor = cur.querySelector<HTMLAnchorElement>(".title-link a");
    if (!anchor) {
      return;
    }
    anchor.dispatchEvent(
      new MouseEvent("click", { ctrlKey: true, metaKey: true })
    );
  }

  requestContent(url: URL, reqBlock: HTMLElement) {
    this.contentProxy.fetchContent(url.href, (ci: ContentInfo) => {
      const reqBlockBox = reqBlock.getBoundingClientRect();
      const ffBlock = this.createFullContentBlock(ci);
      ffBlock.style.width = "" + reqBlockBox.width;
      // ffBlock.style.zIndex = "9999";
      ffBlock.style.height = "500px";
      // // ffBlock.style.overflowY = "scroll";

      // ffBlock.style.position = "absolute";
      // ffBlock.style.left = `${reqBlockBox.x + reqBlockBox.width}`;
      // ffBlock.style.top = `${reqBlockBox.top}`;
      ffBlock.style.backgroundColor = "#eee";
      // ffBlock.style.border = "1px solid red";
      ffBlock.id = ANEWSFF_CONTENT_BLOCK_ID;
      reqBlock.appendChild(ffBlock);
    });
  }
}

function extractHtmlArticleContent(html: string): string {
  return html;
  // const cleaned = sanitize(html, {
  //   ALLOWED_TAGS: ["style"],
  //   ALLOWED_ATTR: ["class", "style", "id"],
  // });
  // return cleaned;
}

const pageAppSelector = (page: string): PageApp | null => {
  switch (page) {
    case "/":
    case "/personal-news":
    case "/team/industry_news":
    case "/team/marks":
      return new HomeApp();

    default:
      if (page.startsWith("/themes/")) {
        return new HomeApp();
      }
      return new PageApp();
  }
};

export { pageAppSelector };
