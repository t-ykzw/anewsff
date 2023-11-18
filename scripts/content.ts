import hotkeys from "hotkeys-js";
import { pageAppSelector } from "./page";
console.log(`loaded. ${location.href}}`);

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
    const app = pageAppSelector(page);
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
