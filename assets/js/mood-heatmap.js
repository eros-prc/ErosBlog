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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  // 防止 Excel / 数据库工具保存 CSV 时在第一列前加 BOM
  const headers = lines[0]
    .split(",")
    .map(h => h.trim().replace(/^\uFEFF/, ""));

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
    obj.date = normalizeDate(obj.date);
    obj.mood = Number(obj.mood || 0);
    obj.energy = Number(obj.energy || 0);
    return obj;
  });
}

function normalizeDate(dateString) {
  // 支持 2026-07-01 / 2026/7/1 / 2026.07.01
  const clean = String(dateString || "")
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/\//g, "-")
    .replace(/\./g, "-");
  const parts = clean.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return "";
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toLocalDate(dateString) {
  const normalized = normalizeDate(dateString);
  const [y, m, d] = normalized.split("-").map(Number);
  if ([y, m, d].some(Number.isNaN)) return new Date(NaN);
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

function renderTrend(rows, year) {
  const yearRows = [...rows]
    .filter(row => toLocalDate(row.date).getFullYear() === year)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (yearRows.length < 2) {
    return `
      <div class="mood-trend mood-trend-empty">
        数据还太少。连续记录 2 天以上后，这里会显示心情波动折线。
      </div>`;
  }

  const width = Math.max(420, yearRows.length * 42);
  const height = 128;
  const paddingX = 26;
  const paddingY = 20;
  const step = (width - paddingX * 2) / Math.max(1, yearRows.length - 1);

  const point = (row, i) => {
    const mood = Math.min(5, Math.max(1, Number(row.mood) || 1));
    const x = paddingX + i * step;
    const y = paddingY + ((5 - mood) / 4) * (height - paddingY * 2);
    return { x, y, mood, row };
  };

  const points = yearRows.map(point);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const circles = points.map(p => `
    <circle class="mood-trend-dot mood-trend-dot-${p.mood}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5">
      <title>${escapeHtml(p.row.date)}｜${escapeHtml(MOOD_LABELS[p.mood])}｜${escapeHtml(p.row.title || "未命名记录")}</title>
    </circle>`).join("");

  const firstDate = yearRows[0].date.slice(5);
  const lastDate = yearRows.at(-1).date.slice(5);

  return `
    <div class="mood-trend-block">
      <div class="mood-trend-head">
        <span>心情波动线</span>
        <small>${firstDate} — ${lastDate}</small>
      </div>
      <div class="mood-trend-scroll">
        <svg class="mood-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="心情波动折线图">
          <line class="mood-trend-guide" x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" />
          <line class="mood-trend-guide" x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" />
          <line class="mood-trend-guide" x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" />
          <path class="mood-trend-line" d="${path}" />
          ${circles}
        </svg>
      </div>
    </div>`;
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
  const latest = toLocalDate(latestDate);
  const year = latest.getFullYear();

  if (Number.isNaN(year)) {
    heatmap.innerHTML = `<div class="mood-empty">日期解析失败。请确认 <code>assets/data/mood.csv</code> 的 date 列是 <code>2026-07-01</code> 这种格式。</div>`;
    return;
  }

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
    const mood = row && isInYear ? Math.min(5, Math.max(1, Number(row.mood) || 1)) : 0;
    const title = row ? row.title : "未记录";
    const label = mood ? MOOD_LABELS[mood] : "未记录";
    const energy = row && row.energy ? `，精力：${ENERGY_LABELS[row.energy] || row.energy}` : "";
    const recorded = row && isInYear ? "mood-recorded" : "";
    cells += `<div class="mood-cell mood-${mood} ${recorded} ${isInYear ? "" : "mood-outside"}" title="${escapeHtml(dateStr)}｜${escapeHtml(label)}${escapeHtml(energy)}｜${escapeHtml(title)}" aria-label="${escapeHtml(dateStr)} ${escapeHtml(label)}"></div>`;
  }

  const weekdays = weekdayNames.map(day => `<div>${day}</div>`).join("");
  const recordedCount = rows.filter(row => toLocalDate(row.date).getFullYear() === year).length;

  heatmap.innerHTML = `
    <div class="mood-year-title">${year} 心情热力图 <span>${recordedCount} 条记录</span></div>
    <div class="mood-heatmap-wrap">
      <div></div>
      <div class="mood-months" style="grid-template-columns: repeat(${totalWeeks}, 16px);">${monthLabelHtml}</div>
      <div class="mood-weekdays">${weekdays}</div>
      <div class="mood-grid" style="grid-template-columns: repeat(${totalWeeks}, 16px);">${cells}</div>
    </div>
    <div class="mood-legend">
      <span>未记录</span><i class="mood-cell mood-0"></i>
      <span>心情低</span>
      <i class="mood-cell mood-1"></i>
      <i class="mood-cell mood-2"></i>
      <i class="mood-cell mood-3"></i>
      <i class="mood-cell mood-4"></i>
      <i class="mood-cell mood-5"></i>
      <span>心情高</span>
    </div>
    ${renderTrend(rows, year)}`;
}

function renderStats(rows) {
  const stats = document.getElementById("mood-stats");
  if (!stats || !rows.length) return;

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  const moodAvg = sorted.reduce((sum, row) => sum + row.mood, 0) / sorted.length;
  const energyAvg = sorted.reduce((sum, row) => sum + row.energy, 0) / sorted.length;
  const dateSet = new Set(sorted.map(row => row.date));

  // 连续记录：从“最新一条记录日期”往前数，每天都有记录才不断。
  // 想让它从今天开始算，就必须在 mood.csv 里补上今天这一行。
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
      <div class="mood-card-label">连续打卡</div>
      <div class="mood-card-value">${streak} 天</div>
      <div class="mood-card-sub">从最新记录往前连续</div>
    </div>
    <div class="mood-card">
      <div class="mood-card-label">累计记录</div>
      <div class="mood-card-value">${sorted.length} 天</div>
      <div class="mood-card-sub">长期看才有波动</div>
    </div>`;
}

function renderRecent(rows) {
  const list = document.getElementById("mood-recent-list");
  if (!list || !rows.length) return;

  const recent = [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  list.innerHTML = recent.map(row => {
    const tags = row.tags ? row.tags.split("|").map(tag => `<span>${escapeHtml(tag)}</span>`).join("") : "";
    return `
      <article class="mood-entry">
        <div class="mood-entry-date">${escapeHtml(row.date)}</div>
        <h3>${escapeHtml(row.title || "未命名记录")}</h3>
        <p>心情：${escapeHtml(MOOD_LABELS[row.mood] || row.mood)}｜精力：${escapeHtml(ENERGY_LABELS[row.energy] || row.energy)}</p>
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
    const rows = parseCSV(text).filter(row => {
      const validDate = row.date && !Number.isNaN(toLocalDate(row.date).getFullYear());
      const validMood = Number.isFinite(row.mood) && row.mood >= 1 && row.mood <= 5;
      return validDate && validMood;
    });
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
