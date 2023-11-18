type AnewsFFCommands = "fetch" | "cancelFetch" | "cancelAllFetch";

type AnewsFFCommandMessage = {
  anewsff: number;
  command: AnewsFFCommands;
  args: string[];
};
type AnewsFFResponseMessage = {
  anewsff: number;
  command: AnewsFFCommands;
  results: Record<string, any>;
};

type FetchResult = {
  status: "prepare" | "fetching" | "done" | "canceled";
  response: Response;
  content: string;
};

const fetchResults: Record<string, FetchResult> = {};

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
  const senderId = sender.tab?.id;
  if (!senderId) {
    return;
  }
  const command = request as AnewsFFCommandMessage;
  switch (command.command) {
    case "fetch":
      fetchContent(command.args[0], senderId);
      break;
    case "cancelFetch":
      cancelFetchContent(command.args[0]);
      break;
    case "cancelAllFetch":
      cancelAllFetch();
      break;
  }
};

const fetchContent = async (href: string, senderId: number): Promise<void> => {
  console.log(`background:fetchContent:${href}`);
  const u = new URL(href);
  const res = await fetch(u);
  const header = res.headers;
  const type = header.get("content-type");
  let content = "";
  if (type?.startsWith("text/html")) {
    const text = await res.text(); // TODO: Sanitize, Extract main content
    content = text;
  }
  const sendBack = {
    anewsff: 1,
    command: "fetch",
    results: {
      href,
      ci: {
        status: `${res.status}`,
        type,
        content,
      },
    },
  };
  chrome.tabs.sendMessage(senderId, sendBack);
};
const cancelFetchContent = (href: string): void => {};
const cancelAllFetch = (): void => {};
chrome.runtime.onMessage.addListener(onMessageHandler);
