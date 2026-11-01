// 共用頁首、上下頁和頁尾。新增頁面只要加進 PAGES。
const PAGES = [
  ["index.html", "🏠", "首頁", "home"],
  ["parts.html", "🧩", "零件區", "parts"],
  ["types.html", "⚔️", "陀螺類型", "types"],
  ["assemble.html", "🔧", "組裝區", "assemble"],
  ["launch.html", "🎬", "發射與轉法", "launch"],
  ["battle.html", "🏆", "戰鬥規則區", "battle"],
  ["worksheet.html", "📝", "實驗學習單", "worksheet"],
  ["shop.html", "🛒", "購物清單", "shop"],
];

(function () {
  const page = document.body.dataset.page;
  const top = document.getElementById("top");
  if (top) {
    top.innerHTML = `<div class="wrap">
      <a class="logo" href="index.html">🌀 陀螺實驗室</a>
      <nav class="nav">${PAGES.slice(1)
        .map(([href, emoji, name, key]) => `<a href="${href}" class="${key === page ? "on" : ""}">${emoji} ${name}</a>`)
        .join("")}</nav>
    </div>`;
  }

  const i = PAGES.findIndex((p) => p[3] === page);
  const pager = document.getElementById("pager");
  if (pager && i >= 0) {
    const prev = PAGES[i - 1];
    const next = PAGES[i + 1];
    pager.innerHTML =
      (prev ? `<a href="${prev[0]}">← ${prev[1]} ${prev[2]}</a>` : "<span></span>") +
      (next ? `<a href="${next[0]}">${next[1]} ${next[2]} →</a>` : "<span></span>");
  }

  const footer = document.querySelector("footer");
  if (footer && !footer.innerHTML.trim()) {
    footer.innerHTML = `🌀 陀螺實驗室・給孩子和大人一起動手做<br>
      資料參考：<a href="https://www.takaratomyasia.com/documents/beybladex/1705650582_Beyblade%20X_Start%20Dash%20Guide.pdf" target="_blank" rel="noopener">Takara Tomy《Beyblade X Start Dash Guide》</a>・動畫和插圖為本站自製的示意圖・照片和影片來自 Wikimedia Commons（作者與授權見各圖說明和<a href="index.html">首頁</a>）<br>
      BEYBLADE® 是 Takara Tomy 的商標，本站為個人製作的教學網站，與 Takara Tomy 無關。`;
  }
})();
