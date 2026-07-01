// Mood Journal for Quarto Blog
// 说明：这是静态博客前端脚本，只适合“轻度隐藏”。真正隐私内容不要直接放进公开仓库。
// 默认演示密码：eros2026。发布前可修改下面这一行。
const JOURNAL_PASSWORD = "eros2026";

const MOOD_LABELS = {
  1: "很糟",
  2: "低落",
  3: "普通",
  4: "还不错",
  5: "很开心"
};

const ENERGY_LABELS = {
  1: "很低",
  2: "偏低",
  3: "一般",
  4: "不错",
  5: "很足"
};

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
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "");
    obj.mood = Number(obj.mood || 0);
    obj.energy = Number(obj.energy || 0);
    return obj;
  });
}

function toLocalDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function renderHeatmap(rows) {
  const heatmap = document.getElementById("mood-heatmap");
  if (!heatmap) return;

  if (!rows.length) {
    heatmap.innerHTML = `<div class="mood-empty">还没有心情数据。先在 <code>assets/data/mood.csv</code> 里写一行吧。</div>`;
    return;
  }

  const byDate = new Map(rows.map(row => [row.date, row]));
  const latestDate = rows.map(r => r.date).sort().at(-1);
  const year = toLocalDate(latestDate).getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const gridStart = addDays(yearStart, -mondayIndex(yearStart));
  const totalDays = Math.ceil((yearEnd - gridStart) / 86400000) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const weekdayNames = ["一", "二", "三", "四", "五", "六", "日"];

  const monthLabelHtml = monthNames.map((name, month) => {
    const first = new Date(year, month, 1);
    const col = Math.floor((first - gridStart) / 86400000 / 7) + 1;
    return `<div class="mood-month" style="grid-column:${col};">${name}</div>`;
  }).join("");

  let cells = "";
  for (let i = 0; i < totalWeeks * 7; i++) {
    const date = addDays(gridStart, i);
    const dateStr = formatDate(date);
    const row = byDate.get(dateStr);
    const isInYear = date.getFullYear() === year;
    const mood = row && isInYear ? row.mood : 0;
    const title = row ? row.title : "未记录";
    const label = mood ? MOOD_LABELS[mood] : "未记录";
    const energy = row && row.energy ? `，精力：${ENERGY_LABELS[row.energy] || row.energy}` : "";
    cells += `<div class="mood-cell mood-${mood} ${isInYear ? "" : "mood-outside"}" title="${dateStr}｜${label}${energy}｜${title}" aria-label="${dateStr} ${label}"></div>`;
  }

  const weekdays = weekdayNames.map(day => `<div>${day}</div>`).join("");

  heatmap.innerHTML = `
    <div class="mood-year-title">${year} 心情热力图</div>
    <div class="mood-heatmap-wrap">
      <div></div>
      <div class="mood-months" style="grid-template-columns: repeat(${totalWeeks}, 13px);">${monthLabelHtml}</div>
      <div class="mood-weekdays">${weekdays}</div>
      <div class="mood-grid" style="grid-template-columns: repeat(${totalWeeks}, 13px);">${cells}</div>
    </div>
    <div class="mood-legend">
      <span>心情低</span>
      <i class="mood-cell mood-1"></i>
      <i class="mood-cell mood-2"></i>
      <i class="mood-cell mood-3"></i>
      <i class="mood-cell mood-4"></i>
      <i class="mood-cell mood-5"></i>
      <span>心情高</span>
    </div>`;
}

function renderStats(rows) {
  const stats = document.getElementById("mood-stats");
  if (!stats || !rows.length) return;

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  const moodAvg = sorted.reduce((sum, row) => sum + row.mood, 0) / sorted.length;
  const energyAvg = sorted.reduce((sum, row) => sum + row.energy, 0) / sorted.length;
  const dateSet = new Set(sorted.map(row => row.date));

  let streak = 0;
  let cursor = toLocalDate(latest.date);
  while (dateSet.has(formatDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  stats.innerHTML = `
    <div class="mood-card">
      <div class="mood-card-label">最近心情</div>
      <div class="mood-card-value">${MOOD_LABELS[latest.mood] || "未记录"}</div>
      <div class="mood-card-sub">${latest.date}</div>
    </div>
    <div class="mood-card">
      <div class="mood-card-label">平均心情</div>
      <div class="mood-card-value">${moodAvg.toFixed(1)} / 5</div>
      <div class="mood-card-sub">基于 ${sorted.length} 条记录</div>
    </div>
    <div class="mood-card">
      <div class="mood-card-label">平均精力</div>
      <div class="mood-card-value">${energyAvg.toFixed(1)} / 5</div>
      <div class="mood-card-sub">保持节奏就好</div>
    </div>
    <div class="mood-card">
      <div class="mood-card-label">连续记录</div>
      <div class="mood-card-value">${streak} 天</div>
      <div class="mood-card-sub">别断更，鼠鼠</div>
    </div>`;
}

function renderRecent(rows) {
  const list = document.getElementById("mood-recent-list");
  if (!list || !rows.length) return;

  const recent = [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  list.innerHTML = recent.map(row => {
    const tags = row.tags ? row.tags.split("|").map(tag => `<span>${tag}</span>`).join("") : "";
    return `
      <article class="mood-entry">
        <div class="mood-entry-date">${row.date}</div>
        <h3>${row.title}</h3>
        <p>心情：${MOOD_LABELS[row.mood] || row.mood}｜精力：${ENERGY_LABELS[row.energy] || row.energy}</p>
        <div class="mood-tags">${tags}</div>
      </article>`;
  }).join("");
}

function unlockJournal() {
  const input = document.getElementById("journal-password");
  const content = document.getElementById("journal-content");
  const message = document.getElementById("journal-message");
  if (!input || !content || !message) return;

  if (input.value === JOURNAL_PASSWORD) {
    content.style.display = "block";
    message.textContent = "解锁成功。这里适合放不太敏感的生活碎片，真正隐私建议只保存在本地。";
    message.className = "journal-message journal-success";
  } else {
    content.style.display = "none";
    message.textContent = "密码不对，再试一次。";
    message.className = "journal-message journal-error";
  }
}
window.unlockJournal = unlockJournal;

async function initMoodJournal() {
  const passwordInput = document.getElementById("journal-password");
  if (passwordInput) {
    passwordInput.addEventListener("keydown", event => {
      if (event.key === "Enter") unlockJournal();
    });
  }

  try {
    const response = await fetch("assets/data/mood.csv", { cache: "no-store" });
    const text = await response.text();
    const rows = parseCSV(text).filter(row => row.date && row.mood);
    renderHeatmap(rows);
    renderStats(rows);
    renderRecent(rows);
  } catch (error) {
    const heatmap = document.getElementById("mood-heatmap");
    if (heatmap) {
      heatmap.innerHTML = `<div class="mood-empty">心情数据加载失败。请确认 <code>assets/data/mood.csv</code> 存在，并且页面通过 Quarto 预览或发布后访问。</div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initMoodJournal);
