// ref: https://www.zhihu.com/question/20179805
// ref: https://juejin.cn/post/6844904127932137485

// chrome.browserAction.onClicked.addListener(function (tab) {
//   // 获取当前选项卡的信息
//   chrome.tabs.getSelected(null, function (tab) {
//     // 注入脚本获取当前页面内容
//     chrome.tabs.executeScript(
//       tab.id,
//       { code: "document.body.innerHTML" },
//       function (result) {
//         console.log(result[0]); // 在控制台输出获取到的页面内容
//       }
//     );
//   });
// });

const saveFileAsync = (content, filename, callback) => {
  const utf8Data = new TextEncoder().encode(content); // 将文本编码为 UTF-8 格式
  const blob = new Blob([utf8Data], {
    type: "text/plain;charset=utf-8",
  }); // 创建包含编码数据的 Blob 对象
  const url = URL.createObjectURL(blob);
  chrome.downloads.download(
    {
      url,
      filename, // 保存文件的名称
    },
    function (downloadId) {
      console.log("Downloaded file with ID: ", downloadId);
      callback();
    }
  );
};

const readContent = (content, seletor) => {
  const contents = $(content).find(seletor);
  const texts = [];
  if (contents.length > 0) {
    $.each(contents, function (i, item) {
      const text = item.innerText;
      // console.debug({ text });
      texts.push(text);
    });
    return texts;
  } else {
    return null;
  }
};

const getNextChapterHref = (content, seletor) => {
  const nextButton = $(content).find(seletor);
  console.debug({ nextButton });
  if (nextButton.length === 1) {
    const href = `https:${nextButton[0].getAttribute("href")}`;
    console.debug({ href });
    return href;
  } else {
    return null;
  }
};

const getKeywords = (content) => {
  const metaKeywords = $(content).filter('meta[name="keywords"]');
  const keywords = [];
  if (metaKeywords.length > 0) {
    $.each(metaKeywords, function (i, item) {
      const w = $(item).attr("content");
      keywords.push(...w.split(","));
    });
    return keywords;
  } else {
    return null;
  }
};

const getPageContentAsync = (tab, options, callback) => {
  chrome.tabs.executeScript(
    tab.id,
    { code: "document.documentElement.outerHTML" },
    function (result) {
      const { seletor } = options || {};
      const { content: content_seletor, next_chapter } = seletor || {};

      const pageContent = result[0];
      console.debug({ pageContent });
      const keywords = getKeywords(pageContent);
      console.debug({ keywords });
      // const texts = readContent(pageContent, ".content-wrap");
      const texts = readContent(pageContent, content_seletor);
      console.debug({ texts });
      if (texts !== null) {
        const next_chapter_href = getNextChapterHref(pageContent, next_chapter);
        callback({
          texts,
          keywords,
          next_chapter_href,
          url: tab.url,
        });
      } else {
        callback(null, new Error(`Can't find [${content_seletor}] element`));
      }
    }
  );
};

const afterReadPageContent = (result, tab, error) => {
  if (!error) {
    const { texts, keywords, next_chapter_href, url } = result;
    const title = keywords[0];
    const chapter = texts[0];
    texts[0] = `${chapter} (${url})`;
    saveFileAsync(texts.join("\n"), `${title}/${chapter}.txt`, () => {
      if (next_chapter_href && title) {
        chrome.tabs.create({ url: next_chapter_href }, function () {
          chrome.tabs.remove(tab.id);
        });
      }
    });
  }
};

const getListener = (conditionFn, options) => {
  return function onUpdatedListener(tabId, changeInfo, tab) {
    // 监听事件的处理代码
    console.log({ tabId, changeInfo, tab, options });
    if (conditionFn(tab) && changeInfo.status === "complete") {
      getPageContentAsync(tab, options, (result, error) => {
        afterReadPageContent(result, tab, error);
      });
    }
  };
};

let listener;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.debug({ request, sender });
  if (request.action === "get-page-content") {
    chrome.tabs.getSelected(null, function (tab) {
      console.debug({ tab });
      if (!listener) {
        const options = {
          seletor: {
            content: ".content-wrap",
            next_chapter: "a#j_chapterNext",
          },
        };
        getPageContentAsync(tab, options, (result, error) => {
          const { keywords } = result;
          const title = keywords[0];
          const condition = (tabInfo) => {
            console.debug({ tabInfo });
            return (
              tabInfo.url.includes("qidian.com") &&
              tabInfo.title.includes(title)
            );
          };

          listener = getListener(condition, options);
          console.debug({ tabId: tab.id, listener });
          chrome.tabs.onUpdated.addListener(listener);

          afterReadPageContent(result, tab, error);

          sendResponse("Start.")
        });
      } else {
        chrome.tabs.onUpdated.removeListener(listener);
        listener = undefined;
        sendResponse("Stop.")
      }
    });
    return true;
  }
});
