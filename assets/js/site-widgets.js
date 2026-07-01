(function () {
  "use strict";

  const quotes = [
    "所有看似混乱的生活，最后都会变成某种数据结构。",
    "今天也许没有答案，但至少多跑通了一行代码。",
    "学习不是突然开悟，而是每天往脑子里偷偷塞一点东西。",
    "鼠鼠可以崩溃，但鼠鼠不能停止更新。",
    "把复杂问题拆小，生活和模型都会好一点。",
    "统计学教会我的第一件事：波动很正常。",
    "论文看不懂没关系，先把标题看懂也是进步。",
    "世界不是线性的，但作业最好按时交。",
    "如果今天没有变强，那就先变得更会休息。",
    "理想很远，但今天的 commit 很近。"
  ];

  const randomLinks = [
    { title: "强化学习综述", href: "posts/python/reinforcement_review/" },
    { title: "生存分析笔记", href: "posts/survival/lung/" },
    { title: "柏拉图《会饮篇》", href: "posts/philosophy/plato-symposium/" },
    { title: "统计学笔记", href: "statistics.qmd" },
    { title: "数学建模", href: "math-modeling.qmd" },
    { title: "因果推断", href: "causal.qmd" },
    { title: "Mood Journal", href: "journal.qmd" }
  ];

  const bentoItems = [
    { icon: "Σ", title: "统计学笔记", desc: "把公式、模型、考试重点和应用方法拆开整理，适合复习，也适合长期积累。", href: "statistics.qmd", large: true },
    { icon: "⌘", title: "统计建模", desc: "回归、面板、变量选择、半参数模型，以及研究方向相关内容。", href: "modeling.qmd" },
    { icon: "λ", title: "编程学习", desc: "R、Python、Quarto、数据分析代码和踩坑记录。", href: "python.qmd" },
    { icon: "∞", title: "数学建模", desc: "从题目分析、模型建立到代码求解，把建模过程写清楚。", href: "math-modeling.qmd" },
    { icon: "DAG", title: "因果推断", desc: "DAG、PSM、DID、IV、Double ML 和因果机器学习学习笔记。", href: "causal.qmd" },
    { icon: "☾", title: "Mood Journal", desc: "用热力图记录每一天心情，让普通日子也留下痕迹。", href: "journal.qmd" },
    { icon: "Φ", title: "哲学阅读", desc: "阿尔都塞、柏拉图，以及一些读书时出现的奇怪想法。", href: "philosophy.qmd" }
  ];

  const tags = [
    ["统计学", 1.25], ["数学建模", 1.10], ["Python", 1.05], ["R语言", 1.00],
    ["Quarto", 1.18], ["强化学习", 1.12], ["因果推断", 1.08], ["哲学", 0.96],
    ["日志", 0.92], ["生存分析", 0.90]
  ];

  const skills = [
    ["R 语言", 78],
    ["Python", 72],
    ["Quarto Blog", 76],
    ["数学建模", 82],
    ["强化学习", 52]
  ];

  const studyTasks = [
    "整理 1 个公式卡片，并写清楚适用条件。",
    "随机打开一篇旧文章，改 3 个错别字或排版问题。",
    "用 15 分钟复盘今天学到的 1 个概念。",
    "给一个模型写一句人话解释，不许堆术语。",
    "跑通一段代码，然后把报错原因记进踩坑笔记。",
    "读 1 页论文，只要求看懂标题、摘要和关键词。",
    "把今天的心情写进 Mood Journal，不超过 80 字。"
  ];

  const flashcards = [
    { q: "DID 在想什么？", a: "看处理组和对照组在政策前后的变化差异，用“差中之差”估计政策影响。" },
    { q: "Lasso 为什么能做变量选择？", a: "它给系数加 L1 惩罚，部分不重要变量的系数会被压到 0。" },
    { q: "Bellman 方程的核心？", a: "当前价值 = 即时收益 + 未来价值的折现期望。" },
    { q: "Quarto 最适合做什么？", a: "把文字、代码、公式、图片和网页结构放在一起，生成可发布的技术博客。" }
  ];

  const moodLabels = {
    1: "很糟",
    2: "低落",
    3: "普通",
    4: "还不错",
    5: "很开心"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function resolveRelativeHref(href) {
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    return href.replace(/\.qmd$/, ".html");
  }

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function setupToday() {
    const target = $("today-date");
    if (!target) return;
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short"
    });
    target.textContent = formatter.format(new Date());
  }

  function setupQuote() {
    const target = $("daily-quote");
    if (!target) return;
    target.textContent = "“" + pick(quotes) + "”";
  }

  function setupRandomButton() {
    const button = $("random-post-button");
    if (!button) return;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const item = pick(randomLinks);
      button.textContent = "🎲 正在前往：" + item.title;
      window.location.href = resolveRelativeHref(item.href);
    });
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else current += ch;
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || "");
      obj.mood = Number(obj.mood || 0);
      obj.energy = Number(obj.energy || 0);
      return obj;
    });
  }

  async function fetchFirst(candidates) {
    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) return await response.text();
      } catch (error) {
        // try next candidate
      }
    }
    throw new Error("No resource loaded");
  }

  async function setupMoodMini() {
    const target = $("home-mood-mini");
    if (!target) return;
    try {
      const text = await fetchFirst([
        "assets/data/mood.csv",
        "../assets/data/mood.csv",
        "../../assets/data/mood.csv",
        "../../../assets/data/mood.csv",
        "../../../../assets/data/mood.csv"
      ]);
      const rows = parseCSV(text).filter(row => row.date && row.mood);
      if (!rows.length) {
        target.textContent = "还没有记录，先写第一天。";
        return;
      }
      const sorted = rows.sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted.at(-1);
      const avg = sorted.reduce((sum, row) => sum + row.mood, 0) / sorted.length;
      target.innerHTML = "";
      target.appendChild(create("div", "mood-mini-main", moodLabels[latest.mood] || String(latest.mood)));
      target.appendChild(create("div", "mood-mini-sub", `${latest.date}｜${latest.title}`));
      target.appendChild(create("div", "mood-mini-sub", `平均心情：${avg.toFixed(1)} / 5，共 ${sorted.length} 条记录`));
    } catch (error) {
      target.textContent = "心情数据暂时没有加载出来。";
    }
  }

  function setupSkillWidget() {
    const root = $("skill-widget");
    if (!root) return;
    root.textContent = "";
    const list = create("div", "skill-list");
    skills.forEach(([name, percent]) => {
      const row = create("div", "skill-row");
      row.appendChild(create("span", "", name));
      const bar = create("i");
      bar.style.setProperty("--p", percent + "%");
      row.appendChild(bar);
      list.appendChild(row);
    });
    root.appendChild(list);
  }

  function setupBentoGrid() {
    const root = $("bento-grid-root");
    if (!root) return;
    root.textContent = "";
    root.className = "bento-grid";
    bentoItems.forEach(item => {
      const card = create("a", "bento-card" + (item.large ? " bento-large" : ""));
      card.href = resolveRelativeHref(item.href);
      card.appendChild(create("div", "bento-icon", item.icon));
      card.appendChild(create("div", "bento-title", item.title));
      card.appendChild(create("div", "bento-desc", item.desc));
      root.appendChild(card);
    });
  }

  function setupTagCloud() {
    const root = $("tag-cloud-root");
    if (!root) return;
    root.textContent = "";
    root.className = "tag-cloud";
    tags.forEach(([label, size]) => {
      const tag = create("span", "", label);
      tag.style.setProperty("--s", size);
      root.appendChild(tag);
    });
  }

  function setupInteractiveLab() {
    const root = $("interactive-lab");
    if (!root) return;
    root.textContent = "";

    const grid = create("div", "interactive-grid");
    root.appendChild(grid);

    // 1. Mood prompt generator
    const mood = create("section", "play-widget mood-playground");
    mood.appendChild(create("div", "widget-label", "心情生成器"));
    mood.appendChild(create("h3", "", "今天的日记开头"));
    mood.appendChild(create("p", "play-muted", "拖动心情值，生成一句适合写进日志的开头。"));
    const moodValue = create("div", "mood-live", "3 · 普通");
    const range = document.createElement("input");
    range.type = "range";
    range.min = "1";
    range.max = "5";
    range.value = "3";
    range.className = "mood-range";
    const moodText = create("div", "play-output", "今天过得不算特别好，也不算特别坏，是适合慢慢整理自己的一天。");
    range.addEventListener("input", function () {
      const value = Number(range.value);
      const lines = {
        1: "今天有点糟，但能把它写下来，已经是在重新拿回一点主动权。",
        2: "今天状态偏低，很多事情不太顺，但我还是想给这一天留一个出口。",
        3: "今天过得不算特别好，也不算特别坏，是适合慢慢整理自己的一天。",
        4: "今天还不错，虽然也有小麻烦，但整体在往更好的方向走。",
        5: "今天很开心，像是生活突然给我亮了一下灯。"
      };
      moodValue.textContent = `${value} · ${moodLabels[value]}`;
      moodText.textContent = lines[value];
    });
    mood.appendChild(moodValue);
    mood.appendChild(range);
    mood.appendChild(moodText);
    grid.appendChild(mood);

    // 2. Study task picker
    const task = create("section", "play-widget");
    task.appendChild(create("div", "widget-label", "学习抽签"));
    task.appendChild(create("h3", "", "今天先做哪一件？"));
    const taskOutput = create("div", "play-output", "点下面按钮，随机抽一个小任务。不要太大，能做完最重要。");
    const taskButton = create("button", "play-button", "🎲 抽一个任务");
    taskButton.addEventListener("click", function () {
      taskOutput.textContent = pick(studyTasks);
    });
    task.appendChild(taskOutput);
    task.appendChild(taskButton);
    grid.appendChild(task);

    // 3. Pomodoro
    const pomo = create("section", "play-widget");
    pomo.appendChild(create("div", "widget-label", "专注计时"));
    pomo.appendChild(create("h3", "", "25 分钟番茄钟"));
    const time = create("div", "pomo-time", "25:00");
    const start = create("button", "play-button", "开始");
    const reset = create("button", "play-button play-button-ghost", "重置");
    const buttons = create("div", "play-button-row");
    buttons.appendChild(start);
    buttons.appendChild(reset);
    let remain = 25 * 60;
    let timer = null;
    function renderTime() {
      const m = String(Math.floor(remain / 60)).padStart(2, "0");
      const s = String(remain % 60).padStart(2, "0");
      time.textContent = `${m}:${s}`;
    }
    start.addEventListener("click", function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
        start.textContent = "继续";
        return;
      }
      start.textContent = "暂停";
      timer = setInterval(function () {
        remain = Math.max(0, remain - 1);
        renderTime();
        if (remain <= 0) {
          clearInterval(timer);
          timer = null;
          start.textContent = "完成了";
        }
      }, 1000);
    });
    reset.addEventListener("click", function () {
      if (timer) clearInterval(timer);
      timer = null;
      remain = 25 * 60;
      start.textContent = "开始";
      renderTime();
    });
    pomo.appendChild(time);
    pomo.appendChild(buttons);
    grid.appendChild(pomo);

    // 4. Flash card
    const card = create("section", "play-widget flash-widget");
    card.appendChild(create("div", "widget-label", "知识翻牌"));
    const flash = create("div", "flash-card", "DID 在想什么？");
    const next = create("button", "play-button", "换一张");
    let index = 0;
    let answer = false;
    function renderFlash() {
      const item = flashcards[index];
      flash.textContent = answer ? item.a : item.q;
      flash.classList.toggle("is-answer", answer);
    }
    flash.addEventListener("click", function () {
      answer = !answer;
      renderFlash();
    });
    next.addEventListener("click", function () {
      index = (index + 1) % flashcards.length;
      answer = false;
      renderFlash();
    });
    card.appendChild(create("p", "play-muted", "点卡片看答案。"));
    card.appendChild(flash);
    card.appendChild(next);
    grid.appendChild(card);

    // 5. Focus mode
    const focus = create("section", "play-widget");
    focus.appendChild(create("div", "widget-label", "页面模式"));
    focus.appendChild(create("h3", "", "一键专注模式"));
    focus.appendChild(create("p", "play-muted", "打开后会弱化页面装饰，让长文章更像阅读器。"));
    const focusButton = create("button", "play-button", "进入专注模式");
    focusButton.addEventListener("click", function () {
      document.body.classList.toggle("focus-mode");
      focusButton.textContent = document.body.classList.contains("focus-mode") ? "退出专注模式" : "进入专注模式";
    });
    focus.appendChild(focusButton);
    grid.appendChild(focus);
  }

  function setupReadingProgress() {
    if (document.querySelector(".reading-progress-bar")) return;
    const bar = document.createElement("div");
    bar.className = "reading-progress-bar";
    document.body.appendChild(bar);

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      bar.style.width = progress + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function setupPointerGlow() {
    const cards = document.querySelectorAll(".bento-card, .mini-widget, .home-hero-card, .home-hero-copy, .play-widget");
    cards.forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }

  function init() {
    setupToday();
    setupQuote();
    setupRandomButton();
    setupMoodMini();
    setupSkillWidget();
    setupInteractiveLab();
    setupBentoGrid();
    setupTagCloud();
    setupReadingProgress();
    setupPointerGlow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
