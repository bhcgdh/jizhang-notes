const CATEGORIES = [
  ["家里支出", "医疗支出", "医疗"],
  ["家里支出", "医疗支出", "保健品"],
  ["家里支出", "固定支出", "生活费"],
  ["家里支出", "娱乐支出", "社交"],
  ["家里支出", "娱乐支出", "运动"],
  ["家里支出", "日用支出", "洗护类"],
  ["家里支出", "日用支出", "衣物"],
  ["家里支出", "日用支出", "厨房用品"],
  ["家里支出", "日用支出", "电器电子"],
  ["家里支出", "日用支出", "办公用品"],
  ["家里支出", "日用支出", "纸巾类"],
  ["家里支出", "日用支出", "维修"],
  ["家里支出", "日用支出", "护肤品"],
  ["家里支出", "食物支出", "零食"],
  ["家里支出", "食物支出", "蔬菜"],
  ["家里支出", "食物支出", "水果"],
  ["家里支出", "食物支出", "外餐"],
  ["家里支出", "食物支出", "干货"],
  ["家里支出", "食物支出", "花茶"],
  ["家里支出", "食物支出", "调料"],
  ["家里支出", "食物支出", "咖啡"],
  ["家里支出", "食物支出", "甜点"],
  ["家里支出", "食物支出", "虾仁"],
  ["自己支出", "其他", "其他"],
  ["自己支出", "医疗支出", "艾草"],
  ["自己支出", "医疗支出", "保健品"],
  ["自己支出", "医疗支出", "医疗"],
  ["自己支出", "固定支出", "水电"],
  ["自己支出", "固定支出", "房租"],
  ["自己支出", "固定支出", "公交地铁"],
  ["自己支出", "固定支出", "房贷"],
  ["自己支出", "固定支出", "其他"],
  ["自己支出", "固定支出", "话费"],
  ["自己支出", "娱乐支出", "门票"],
  ["自己支出", "娱乐支出", "社交"],
  ["自己支出", "娱乐支出", "电影"],
  ["自己支出", "娱乐支出", "玩具"],
  ["自己支出", "娱乐支出", "彩票"],
  ["自己支出", "日用支出", "衣物"],
  ["自己支出", "日用支出", "其他"],
  ["自己支出", "日用支出", "厨房用品"],
  ["自己支出", "日用支出", "书籍"],
  ["自己支出", "日用支出", "办公用品"],
  ["自己支出", "日用支出", "电器电子"],
  ["自己支出", "日用支出", "洗护类"],
  ["自己支出", "日用支出", "纸巾类"],
  ["自己支出", "日用支出", "护肤品"],
  ["自己支出", "日用支出", "快递"],
  ["自己支出", "日用支出", "化妆品"],
  ["自己支出", "日用支出", "维修"],
  ["自己支出", "猫咪支出", "猫咪用品"],
  ["自己支出", "猫咪支出", "猫粮"],
  ["自己支出", "猫咪支出", "猫玩具"],
  ["自己支出", "食物支出", "水果"],
  ["自己支出", "食物支出", "外餐"],
  ["自己支出", "食物支出", "零食"],
  ["自己支出", "食物支出", "蔬菜"],
  ["自己支出", "食物支出", "咖啡"],
  ["自己支出", "食物支出", "调料"],
  ["自己支出", "食物支出", "花茶"],
  ["自己支出", "食物支出", "干货"],
  ["自己支出", "食物支出", "甜点"],
  ["自己支出", "食物支出", "甜品"],
  ["自己收入", "基金", "none"],
  ["自己收入", "工资收入", "none"],
  ["自己收入", "红包收入", "none"],
  ["自己收入", "股票", "none"],
];

const state = {
  records: [],
  page: "book",
  monthSort: "desc",
  monthSummarySort: "dateDesc",
  monthDetailKind: "income",
  analysisDetail: { type: "all", name1: "all", name2: "all", start: "", end: "", min: "", max: "", bak: "" },
  analysisDetailDraft: { type: "all", name1: "all", name2: "all", start: "", end: "", min: "", max: "", bak: "" },
  analysisDetailSort: { key: "t", dir: "desc" },
  categoryMonthSort: "dateDesc",
  categoryRawMonth: "all",
  categoryRawSort: { key: "t", dir: "desc" },
  categoryFilter: { type: "自己支出", name1: "all", name2: "all" },
};
const byType = groupOptions(CATEGORIES, 0);

const $ = (id) => document.getElementById(id);
const formatMoney = (value) => Number(value || 0).toFixed(2);
const formatWan = (value) => (Number(value || 0) / 10000).toFixed(1);
const formatSmartAmount = (value) => Math.abs(Number(value || 0)) >= 10000
  ? `${(Number(value || 0) / 10000).toFixed(2)}万`
  : String(Math.round(Number(value || 0)));
const formatFundsAmount = (value) => (Number(value || 0) / 10000).toFixed(1);
const CHART_COLORS = ["#FFB7B2", "#FFDAC1", "#B2F2BB", "#A2CFFE", "#D1C4E9"];

function isIncome(record) {
  return String(record.type || "").includes("收入");
}

function isExpense(record) {
  return !isIncome(record);
}

function typeName2Key(record) {
  return `${record.type} / ${record.name2}`;
}

function groupOptions(rows, index, filters = {}) {
  const values = rows
    .filter((row) => Object.entries(filters).every(([key, value]) => row[Number(key)] === value))
    .map((row) => row[index]);
  return [...new Set(values)];
}

function setOptions(select, values) {
  select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function setFilterOptions(select, values, selected, allLabel = "全部") {
  const options = [["all", allLabel], ...values.map((value) => [value, value])];
  select.innerHTML = options.map(([value, label]) => (
    `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`
  )).join("");
  if (![...select.options].some((option) => option.value === selected)) {
    select.value = "all";
  }
}

function todayText(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function currentMonthText() {
  return todayText().slice(0, 7);
}

function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  $("startDate").value = todayText(start);
  $("endDate").value = todayText(now);
  render();
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
}

function updateFormOptions(scope = document) {
  const type = scope.querySelector("[name='type']");
  const name1 = scope.querySelector("[name='name1']");
  const name2 = scope.querySelector("[name='name2']");
  if (!type || !name1 || !name2) return;

  const currentName1 = name1.value;
  const currentName2 = name2.value;
  if (!type.options.length) setOptions(type, byType);
  const name1s = groupOptions(CATEGORIES, 1, { 0: type.value });
  setOptions(name1, name1s);
  if (name1s.includes(currentName1)) name1.value = currentName1;
  const name2s = groupOptions(CATEGORIES, 2, { 0: type.value, 1: name1.value });
  setOptions(name2, name2s);
  if (name2s.includes(currentName2)) name2.value = currentName2;
}

function entryRowHtml(record = {}) {
  const type = byType.includes(record.type) ? record.type : byType[0];
  const name1s = groupOptions(CATEGORIES, 1, { 0: type });
  const name1 = name1s.includes(record.name1) ? record.name1 : name1s[0];
  const name2s = groupOptions(CATEGORIES, 2, { 0: type, 1: name1 });
  const name2 = name2s.includes(record.name2) ? record.name2 : name2s[0];
  const options = (values, selected) => values.map((value) => (
    `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`
  )).join("");

  return `
    <div class="entry-row">
      <label>时间<input name="t" type="date" value="${escapeHtml(record.t || todayText())}" required></label>
      <label>一级分类<select name="type" required>${options(byType, type)}</select></label>
      <label>二级分类<select name="name1" required>${options(name1s, name1)}</select></label>
      <label>三级分类<select name="name2" required>${options(name2s, name2)}</select></label>
      <label>金额<input name="p" type="number" step="0.01" value="${escapeHtml(record.p ?? "")}" required></label>
      <label class="wide">备注<input name="bak" type="text" value="${escapeHtml(record.bak || "none")}" placeholder="none"></label>
      <button class="danger remove-entry-btn" type="button">移除</button>
    </div>
  `;
}

function fillEntryForms(records) {
  const rows = records.length ? records : [{}];
  $("entryForm").innerHTML = `${rows.map(entryRowHtml).join("")}<div class="entry-actions"><button type="submit">全部保存到账表</button></div>`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(response.ok ? "服务返回内容不是 JSON" : `服务接口不可用：${text || response.status}`);
  }
  if (!response.ok || payload.error) throw new Error(payload.error || "请求失败");
  return payload;
}

async function loadRecords() {
  const payload = await requestJson("/api/records");
  state.records = payload.records;
  $("csvPathInput").value = payload.path;
  render();
}

async function changeCsvPath() {
  const nextPath = $("csvPathInput").value.trim();
  const payload = await requestJson("/api/csv-path", {
    method: "POST",
    body: JSON.stringify({ path: nextPath }),
  });
  state.records = payload.records;
  $("csvPathInput").value = payload.path;
  render();
  $("csvPathPanel").classList.remove("open");
  toast("账本文件已切换");
}

async function loadFunds() {
  try {
    const payload = await requestJson("/api/funds");
    renderFunds(payload.funds);
  } catch (error) {
    $("currentFundsValue").textContent = "-";
    $("currentFundsTime").textContent = error.message;
  }
}

function renderFunds(funds) {
  $("currentFundsValue").textContent = formatFundsAmount(funds.value);
  $("currentFundsTime").textContent = "";
  $("fundsPathInput").value = funds.path;
}

async function changeFundsPath() {
  const nextPath = $("fundsPathInput").value.trim();
  const payload = await requestJson("/api/funds-path", {
    method: "POST",
    body: JSON.stringify({ path: nextPath }),
  });
  renderFunds(payload.funds);
  $("fundsPathPanel").classList.remove("open");
  toast("资金表已切换");
}

function currentRows() {
  const start = $("startDate").value;
  const end = $("endDate").value;
  return state.records.filter((record) => (!start || record.t >= start) && (!end || record.t <= end));
}

function makeSelect(name, value, values) {
  const options = values.map((item) => `<option value="${item}" ${item === value ? "selected" : ""}>${item}</option>`);
  return `<select name="${name}">${options.join("")}</select>`;
}

function renderTable(rows) {
  $("recordBody").innerHTML = rows.map((record) => {
    const name1s = groupOptions(CATEGORIES, 1, { 0: record.type });
    const name2s = groupOptions(CATEGORIES, 2, { 0: record.type, 1: record.name1 });
    return `
      <tr data-id="${record.id}">
        <td><input name="t" type="date" value="${record.t}"></td>
        <td>${makeSelect("type", record.type, byType)}</td>
        <td>${makeSelect("name1", record.name1, name1s)}</td>
        <td>${makeSelect("name2", record.name2, name2s)}</td>
        <td><input name="p" type="number" step="0.01" value="${record.p}"></td>
        <td><input name="bak" type="text" value="${escapeHtml(record.bak)}"></td>
        <td><button class="danger delete-btn" type="button">删除</button></td>
      </tr>
    `;
  }).join("");
}

function renderMonthTable(rows) {
  const sorted = [...rows].sort((a, b) => {
    const diff = (Number(a.p) || 0) - (Number(b.p) || 0);
    return state.monthSort === "asc" ? diff : -diff;
  });
  $("monthSortIcon").textContent = state.monthSort === "asc" ? "↑" : "↓";
  $("monthRecordBody").innerHTML = sorted.map((record) => `
    <tr>
      <td>${escapeHtml(record.t)}</td>
      <td><span class="tag ${isIncome(record) ? "income" : "expense"}">${isIncome(record) ? "收入" : "支出"}</span></td>
      <td>${escapeHtml(record.type)}</td>
      <td>${escapeHtml(record.name1)}</td>
      <td>${escapeHtml(record.name2)}</td>
      <td>${formatMoney(record.p)}</td>
      <td>${escapeHtml(record.bak)}</td>
    </tr>
  `).join("");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderStats(rows) {
  let expense = 0;
  let income = 0;
  for (const record of rows) {
    const value = Number(record.p) || 0;
    if (record.type.includes("收入")) income += value;
    else expense += value;
  }
  $("expenseTotal").textContent = String(Math.round(expense));
  $("incomeTotal").textContent = String(Math.round(income));
  $("netTotal").textContent = String(Math.round(income - expense));
  $("recordCount").textContent = String(rows.length);
}

function summarize(rows, key) {
  const totals = new Map();
  for (const record of rows) {
    const signed = record.type.includes("收入") ? Number(record.p) || 0 : -(Number(record.p) || 0);
    totals.set(record[key], (totals.get(record[key]) || 0) + signed);
  }
  return [...totals.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 12);
}

function summarizeExpenses(rows, key, limit = 12) {
  const totals = new Map();
  for (const record of expenseRows(rows)) {
    const label = typeof key === "function" ? key(record) : record[key];
    addToMap(totals, label, Number(record.p) || 0);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function renderChart(id, data) {
  const max = Math.max(1, ...data.map(([, value]) => Math.abs(value)));
  $(id).innerHTML = data.length ? data.map(([label, value]) => {
    const percent = Math.max(4, Math.round(Math.abs(value) / max * 100));
    const income = value >= 0;
    return `
      <div class="bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill ${income ? "income" : ""}" style="width:${percent}%"></div></div>
        <span class="bar-value">${formatMoney(value)}</span>
      </div>
    `;
  }).join("") : "<p>当前筛选范围没有数据</p>";
}

function expenseRows(records) {
  return records.filter((record) => isExpense(record) && Number(record.p) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(record.t));
}

function addToMap(map, key, value) {
  map.set(key, (map.get(key) || 0) + value);
}

function totalsBy(records, keyFn) {
  const totals = new Map();
  for (const record of records) addToMap(totals, keyFn(record), Number(record.p) || 0);
  return [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function renderPositiveBars(id, data) {
  const max = Math.max(1, ...data.map(([, value]) => value));
  $(id).innerHTML = data.length ? data.map(([label, value]) => {
    const percent = Math.max(4, Math.round(value / max * 100));
    return `
      <div class="bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
        <span class="bar-value">${formatMoney(value)}</span>
      </div>
    `;
  }).join("") : "<p>暂无支出数据</p>";
}

function renderMonthSummaryTable(data, coreData) {
  let rows = [...data];
  const coreMap = new Map(coreData);
  if (state.monthSummarySort === "dateDesc" || state.monthSummarySort === "dateAsc") {
    rows.sort((a, b) => state.monthSummarySort === "dateAsc" ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]));
    $("monthSummaryDateSortIcon").textContent = state.monthSummarySort === "dateAsc" ? "↑" : "↓";
    $("monthSummarySortIcon").textContent = "↕";
    $("monthSummaryCoreSortIcon").textContent = "↕";
  } else if (state.monthSummarySort === "coreAsc" || state.monthSummarySort === "coreDesc") {
    rows.sort((a, b) => {
      const av = coreMap.get(a[0]) || 0;
      const bv = coreMap.get(b[0]) || 0;
      return state.monthSummarySort === "coreAsc" ? av - bv : bv - av;
    });
    $("monthSummaryDateSortIcon").textContent = "↕";
    $("monthSummarySortIcon").textContent = "↕";
    $("monthSummaryCoreSortIcon").textContent = state.monthSummarySort === "coreAsc" ? "↑" : "↓";
  } else {
    rows.sort((a, b) => state.monthSummarySort === "asc" ? a[1] - b[1] : b[1] - a[1]);
    $("monthSummaryDateSortIcon").textContent = "↕";
    $("monthSummarySortIcon").textContent = state.monthSummarySort === "asc" ? "↑" : "↓";
    $("monthSummaryCoreSortIcon").textContent = "↕";
  }
  $("monthSummaryBody").innerHTML = rows.map(([month, value]) => `
    <tr>
      <td>${escapeHtml(month)}</td>
      <td class="num">${Math.round(value)}</td>
      <td class="num">${Math.round(coreMap.get(month) || 0)}</td>
    </tr>
  `).join("");
}

function renderColumnChart(id, data, options = {}) {
  if (!data.length) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  const width = options.width || 360;
  const height = options.height || 190;
  const pad = { left: 48, right: 16, top: 16, bottom: 32 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map(([, value]) => value));
  const gap = 18;
  const barW = Math.min(34, Math.max(14, (plotW - gap * (data.length - 1)) / data.length));
  const bars = data.map(([label, value], index) => {
    const h = value / max * plotH;
    const x = pad.left + index * (barW + gap);
    const y = pad.top + plotH - h;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="${options.color || "#A2CFFE"}">
        <title>${label}: ${formatMoney(value)}</title>
      </rect>
      <text class="line-label" x="${x + barW / 2}" y="${Math.max(12, y - 5)}" text-anchor="middle">${options.integerLabel ? Math.round(value) : `${formatWan(value)}万`}</text>
      <text class="line-label" x="${x + barW / 2}" y="${height - 12}" text-anchor="middle">${escapeHtml(label)}</text>
    `;
  }).join("");

  $(id).innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="年度支出趋势">
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${width - pad.right}" y2="${pad.top + plotH}" stroke="#eadfce"></line>
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#eadfce"></line>
      <text class="line-label" x="6" y="${pad.top + 8}">${formatMoney(max)}</text>
      ${bars}
    </svg>
  `;
}

function renderRatioList(id, data) {
  const total = data.reduce((sum, [, value]) => sum + value, 0);
  $(id).innerHTML = data.length ? data.map(([label, value]) => {
    const ratio = total ? `${(value / total * 100).toFixed(1)}%` : "0.0%";
    return `
      <div class="ratio-row">
        <span>${escapeHtml(label)}</span>
        <span>${ratio}</span>
        <span class="bar-value">${formatMoney(value)}</span>
      </div>
    `;
  }).join("") : "<p>暂无支出数据</p>";
}

function renderPie(id, data) {
  const total = data.reduce((sum, [, value]) => sum + value, 0);
  if (!data.length || !total) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  let cursor = 0;
  const parts = data.map(([, value], index) => {
    const start = cursor;
    cursor += value / total * 100;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${cursor}%`;
  });
  const legend = data.map(([label, value], index) => `
    <div class="legend-row">
      <span class="legend-swatch" style="background:${CHART_COLORS[index % CHART_COLORS.length]}"></span>
      <span>${escapeHtml(label)}</span>
      <span>${(value / total * 100).toFixed(1)}%</span>
    </div>
  `).join("");

  $(id).innerHTML = `
    <div class="pie-circle" style="background:conic-gradient(${parts.join(",")})"></div>
    <div class="pie-legend">${legend}</div>
  `;
}

function renderTrend(id, data) {
  if (!data.length) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  const width = Math.max(760, data.length * 72);
  const height = 260;
  const pad = { left: 52, right: 18, top: 18, bottom: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map(([, value]) => value));
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map(([, value], index) => {
    const x = pad.left + index * step;
    const y = pad.top + plotH - value / max * plotH;
    return [x, y, value];
  });
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const labels = data.map(([label], index) => {
    const x = pad.left + index * step;
    return `<text class="line-label" x="${x}" y="${height - 12}" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("");
  const dots = points.map(([x, y, value], index) => `<circle cx="${x}" cy="${y}" r="4"><title>${data[index][0]}: ${formatMoney(value)}</title></circle>`).join("");

  $(id).innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="月度支出趋势">
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${width - pad.right}" y2="${pad.top + plotH}" stroke="#d9ded7"></line>
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#d9ded7"></line>
      <text class="line-label" x="6" y="${pad.top + 8}">${formatMoney(max)}</text>
      <text class="line-label" x="10" y="${pad.top + plotH}">0</text>
      <polyline points="${polyline}" fill="none" stroke="#A2CFFE" stroke-width="3"></polyline>
      <g fill="#A2CFFE">${dots}</g>
      ${labels}
    </svg>
  `;
}

function renderMultiLineTrend(id, labels, series) {
  if (!labels.length || !series.length) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  const width = Math.max(760, labels.length * 72);
  const height = 270;
  const pad = { left: 58, right: 18, top: 18, bottom: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap((item) => item.values));
  const step = labels.length > 1 ? plotW / (labels.length - 1) : 0;
  const lineEls = series.map((item) => {
    const points = item.values.map((value, index) => {
      const x = pad.left + index * step;
      const y = pad.top + plotH - value / max * plotH;
      return [x, y, value];
    });
    const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
    const dots = points.map(([x, y, value], index) => `
      <circle cx="${x}" cy="${y}" r="3.2" fill="${item.color}">
        <title>${item.name} ${labels[index]}: ${formatMoney(value)}</title>
      </circle>
      ${item.name === "总支出" ? `<text class="line-label" x="${x}" y="${Math.max(12, y - 8)}" text-anchor="middle">${formatWan(value)}万</text>` : ""}
    `).join("");
    return `<polyline points="${polyline}" fill="none" stroke="${item.color}" stroke-width="2.5"></polyline>${dots}`;
  }).join("");
  const xLabels = labels.map((label, index) => {
    const x = pad.left + index * step;
    return `<text class="line-label" x="${x}" y="${height - 32}" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("");
  $("monthTrendLegend").innerHTML = series.map((item) => `
    <span class="trend-legend-item">
      <span class="trend-legend-swatch" style="background:${item.color}"></span>
      ${escapeHtml(item.name)}
    </span>
  `).join("");

  $(id).innerHTML = `
    <div class="y-axis-panel">
      <span class="max">${formatMoney(max)}</span>
      <span class="zero">0</span>
    </div>
    <div class="chart-scroll">
      <svg viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="月度支出趋势">
        <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${width - pad.right}" y2="${pad.top + plotH}" stroke="#eadfd9"></line>
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#eadfd9"></line>
        ${lineEls}
        ${xLabels}
      </svg>
    </div>
  `;
}

function renderDailyTrend(id, data, average) {
  if (!data.length) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  const width = Math.max(760, data.length * 44);
  const height = 260;
  const pad = { left: 52, right: 18, top: 18, bottom: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, average, ...data.map(([, value]) => value));
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map(([, value], index) => {
    const x = pad.left + index * step;
    const y = pad.top + plotH - value / max * plotH;
    return [x, y, value];
  });
  const avgY = pad.top + plotH - average / max * plotH;
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const labels = data.map(([label], index) => {
    const x = pad.left + index * step;
    return `<text class="line-label" x="${x}" y="${height - 12}" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("");
  const dots = points.map(([x, y, value], index) => `<circle cx="${x}" cy="${y}" r="3.5"><title>${data[index][0]}日: ${formatMoney(value)}</title></circle>`).join("");

  $(id).innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="当月每日支出">
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${width - pad.right}" y2="${pad.top + plotH}" stroke="#d9ded7"></line>
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#d9ded7"></line>
      <line x1="${pad.left}" y1="${avgY}" x2="${width - pad.right}" y2="${avgY}" stroke="#FFB7B2" stroke-dasharray="6 5"></line>
      <text class="line-label" x="${width - pad.right - 86}" y="${avgY - 6}">日均 ${formatMoney(average)}</text>
      <text class="line-label" x="6" y="${pad.top + 8}">${formatMoney(max)}</text>
      <polyline points="${polyline}" fill="none" stroke="#A2CFFE" stroke-width="3"></polyline>
      <g fill="#A2CFFE">${dots}</g>
      ${labels}
    </svg>
  `;
}

function renderPinnedSingleTrend(id, data, average) {
  if (!data.length) {
    $(id).innerHTML = "<p>暂无支出数据</p>";
    return;
  }

  const width = Math.max(760, data.length * 72);
  const height = 270;
  const pad = { left: 52, right: 18, top: 18, bottom: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, average, ...data.map(([, value]) => value));
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map(([, value], index) => {
    const x = pad.left + index * step;
    const y = pad.top + plotH - value / max * plotH;
    return [x, y, value];
  });
  const avgY = pad.top + plotH - average / max * plotH;
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const labels = data.map(([label], index) => {
    const x = pad.left + index * step;
    return `<text class="line-label" x="${x}" y="${height - 12}" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("");
  const dots = points.map(([x, y, value], index) => `
    <circle cx="${x}" cy="${y}" r="4" fill="#A2CFFE">
      <title>${data[index][0]}: ${Math.round(value)}</title>
    </circle>
    <text class="line-label" x="${x}" y="${Math.max(12, y - 8)}" text-anchor="middle">${Math.round(value)}</text>
  `).join("");

  $(id).innerHTML = `
    <div class="y-axis-panel">
      <span class="max">${Math.round(max)}</span>
      <span class="zero">0</span>
    </div>
    <div class="chart-scroll">
      <svg viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="年月总支出趋势">
        <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${width - pad.right}" y2="${pad.top + plotH}" stroke="#eadfce"></line>
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#eadfce"></line>
        <line x1="${pad.left}" y1="${avgY}" x2="${width - pad.right}" y2="${avgY}" stroke="#FFB7B2" stroke-dasharray="6 5"></line>
        <text class="line-label" x="${width - pad.right - 86}" y="${avgY - 6}">月均 ${Math.round(average)}</text>
        <polyline points="${polyline}" fill="none" stroke="#A2CFFE" stroke-width="3"></polyline>
        ${dots}
        ${labels}
      </svg>
    </div>
  `;
}

function renderYearSummary(id, data, total, yearSpans) {
  $(id).innerHTML = data.length ? `
    <div class="year-row summary-head">
      <span>年份</span><span>长度</span><span class="num">年度支出</span><span class="num">占比</span>
    </div>
    ${data.map(([year, value]) => `
    <div class="year-row">
      <span>${escapeHtml(year)}</span>
      <span>${(yearSpans.get(year) || 0).toFixed(1)}年</span>
      <span class="num">${formatWan(value)}万</span>
      <span class="num">${total ? (value / total * 100).toFixed(1) : "0.0"}%</span>
    </div>
  `).join("")}` : "<p>暂无支出数据</p>";
}

function renderMonthCalendar(id, month, data) {
  const totals = new Map(data);
  const [year, monthText] = month.split("-").map(Number);
  const days = new Date(year, monthText, 0).getDate();
  const firstOffset = (new Date(year, monthText - 1, 1).getDay() + 6) % 7;
  const max = Math.max(1, ...data.map(([, value]) => value));
  const heads = ["一", "二", "三", "四", "五", "六", "日"]
    .map((label) => `<div class="calendar-head">${label}</div>`);
  const blanks = Array.from({ length: firstOffset }, () => "<div class=\"calendar-cell empty\"></div>");
  const cells = Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const value = totals.get(day) || 0;
    const alpha = value ? 0.20 + value / max * 0.60 : 0;
    const bg = value ? `rgba(162, 207, 254, ${alpha.toFixed(2)})` : "#fffaf3";
    return `
      <div class="calendar-cell" style="background:${bg}" title="${day}日: ${formatMoney(value)}">
        <div class="calendar-day">${day}</div>
        <div class="calendar-amount">${value ? formatMoney(value) : ""}</div>
      </div>
    `;
  });
  $(id).innerHTML = [...heads, ...blanks, ...cells].join("");
}

function renderAnalysis(records) {
  const rows = expenseRows(records);
  const incomeRows = records.filter((record) => isIncome(record) && Number(record.p) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(record.t));
  const yearTotals = totalsBy(rows, (record) => record.t.slice(0, 4));
  const selfYearTotals = totalsBy(rows.filter((record) => record.type === "自己支出"), (record) => record.t.slice(0, 4));
  const noMortgageYearTotals = totalsBy(rows.filter((record) => record.name2 !== "房贷"), (record) => record.t.slice(0, 4));
  const monthTotals = totalsBy(rows, (record) => record.t.slice(0, 7));
  const coreMonthTotals = totalsBy(rows.filter((record) => record.name2 !== "房贷" && record.name2 !== "房租"), (record) => record.t.slice(0, 7));
  const monthLabels = monthTotals.map(([label]) => label);
  const monthTotalMap = new Map(monthTotals);
  const typeLabels = [...new Set(rows.map((record) => record.type))].sort();
  const typeMonthMaps = typeLabels.map((type) => ({
    type,
    totals: new Map(totalsBy(rows.filter((record) => record.type === type), (record) => record.t.slice(0, 7))),
  }));
  const monthSeries = [
    { name: "总支出", color: "#FFB7B2", values: monthLabels.map((label) => monthTotalMap.get(label) || 0) },
    ...typeMonthMaps.map((item, index) => ({
      name: item.type,
      color: CHART_COLORS[(index + 2) % CHART_COLORS.length],
      values: monthLabels.map((label) => item.totals.get(label) || 0),
    })),
  ];
  const categoryTotals = totalsBy(rows, (record) => record.name1).sort((a, b) => b[1] - a[1]);
  const name2Totals = totalsBy(rows, typeName2Key).sort((a, b) => b[1] - a[1]);
  const dates = rows.map((record) => record.t).sort();
  const total = rows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const incomeTotal = incomeRows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const start = dates[0] || "-";
  const end = dates[dates.length - 1] || "-";
  const days = dates.length ? Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1) : 0;
  const years = days ? days / 365 : 0;
  const yearSpans = new Map();
  for (const [year] of yearTotals) {
    const yearDates = rows.filter((record) => record.t.startsWith(year)).map((record) => record.t).sort();
    const yearStart = yearDates[0];
    const yearEnd = yearDates[yearDates.length - 1];
    const yearDays = Math.max(1, Math.round((new Date(yearEnd) - new Date(yearStart)) / 86400000) + 1);
    yearSpans.set(year, yearDays / 365);
  }

  $("analysisStart").textContent = start;
  $("analysisEnd").textContent = end;
  $("analysisYears").textContent = years.toFixed(1);
  $("analysisTotal").textContent = formatWan(total);
  $("analysisIncomeTotal").textContent = formatWan(incomeTotal);
  $("analysisSurplusTotal").textContent = formatWan(incomeTotal - total);
  $("analysisDailyAvg").textContent = String(Math.round(days ? total / days : 0));
  renderColumnChart("yearTrendTotalChart", yearTotals, { color: "#A2CFFE" });
  renderColumnChart("yearTrendSelfChart", selfYearTotals, { color: "#B2F2BB" });
  renderColumnChart("yearTrendNoMortgageChart", noMortgageYearTotals, { color: "#FFDAC1" });
  renderYearSummary("yearSummaryList", yearTotals, total, yearSpans);
  renderMonthSummaryTable(monthTotals, coreMonthTotals);
  renderRatioList("ratioList", name2Totals.slice(0, 20));
  renderPie("categoryPieChart", categoryTotals.slice(0, 8));
  renderMultiLineTrend("monthTrendChart", monthLabels, monthSeries);
}

function renderAnalysisDetailFilters(records) {
  const filter = state.analysisDetailDraft;
  const typeRows = records.filter((record) => filter.type === "all" || record.type === filter.type);
  const name1Rows = typeRows.filter((record) => filter.name1 === "all" || record.name1 === filter.name1);
  const types = [...new Set(records.map((record) => record.type))].sort();
  const name1s = [...new Set(typeRows.map((record) => record.name1))].sort();
  const name2s = [...new Set(name1Rows.map((record) => record.name2))].sort();

  if (filter.type !== "all" && !types.includes(filter.type)) filter.type = "all";
  if (filter.name1 !== "all" && !name1s.includes(filter.name1)) filter.name1 = "all";
  if (filter.name2 !== "all" && !name2s.includes(filter.name2)) filter.name2 = "all";

  setFilterOptions($("analysisDetailType"), types, filter.type, "全部");
  setFilterOptions($("analysisDetailName1"), name1s, filter.name1, "全部");
  setFilterOptions($("analysisDetailName2"), name2s, filter.name2, "全部");
  $("analysisDetailStart").value = filter.start;
  $("analysisDetailEnd").value = filter.end;
  $("analysisDetailMin").value = filter.min;
  $("analysisDetailMax").value = filter.max;
  $("analysisDetailBak").value = filter.bak;
}

function renderAnalysisDetailTable(records) {
  const filter = state.analysisDetail;
  const sort = state.analysisDetailSort;
  const min = filter.min === "" ? null : Number(filter.min);
  const max = filter.max === "" ? null : Number(filter.max);
  const bak = filter.bak.trim();
  const rows = records.filter((record) => {
    const amount = Number(record.p) || 0;
    return (!filter.start || record.t >= filter.start)
      && (!filter.end || record.t <= filter.end)
      && (filter.type === "all" || record.type === filter.type)
      && (filter.name1 === "all" || record.name1 === filter.name1)
      && (filter.name2 === "all" || record.name2 === filter.name2)
      && (min == null || amount >= min)
      && (max == null || amount <= max)
      && (!bak || String(record.bak || "").includes(bak));
  }).sort((a, b) => {
    const av = sort.key === "p" ? Number(a.p) || 0 : String(a[sort.key] || "");
    const bv = sort.key === "p" ? Number(b.p) || 0 : String(b[sort.key] || "");
    const result = sort.key === "p" ? av - bv : av.localeCompare(bv);
    return sort.dir === "asc" ? result : -result;
  });
  const total = rows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const dates = rows.map((record) => record.t).sort();
  const firstDate = dates[0];
  const days = firstDate ? Math.max(1, Math.round((new Date(todayText()) - new Date(firstDate)) / 86400000) + 1) : 0;
  const months = days ? days / 30.4375 : 0;
  const dailyAvg = days ? total / days : 0;
  const monthlyAvg = months ? total / months : 0;
  $("analysisDetailSummary").innerHTML = `
    <span>总金额：${formatSmartAmount(total)}</span>
    <span>日均：${formatSmartAmount(dailyAvg)}</span>
    <span>月均：${formatSmartAmount(monthlyAvg)}</span>
  `;
  setSortIcons("analysisDetail", {
    t: "Time",
    type: "Type",
    name1: "Name1",
    name2: "Name2",
    p: "Amount",
    bak: "Bak",
  }[sort.key], sort);

  $("analysisDetailBody").innerHTML = rows.map((record) => `
    <tr>
      <td>${escapeHtml(record.t)}</td>
      <td>${escapeHtml(record.type)}</td>
      <td>${escapeHtml(record.name1)}</td>
      <td>${escapeHtml(record.name2)}</td>
      <td>${formatMoney(record.p)}</td>
      <td>${escapeHtml(record.bak)}</td>
    </tr>
  `).join("");
}

function renderAnalysisDetail(records) {
  renderAnalysisDetailFilters(records);
  renderAnalysisDetailTable(records);
}

function renderMonthPage(records) {
  const month = $("monthPicker").value || currentMonthText();
  const monthRows = records.filter((record) => String(record.t || "").startsWith(month));
  const monthExpenses = expenseRows(monthRows);
  const categoryTotals = totalsBy(monthExpenses, typeName2Key).sort((a, b) => b[1] - a[1]);
  const name2Totals = categoryTotals;
  const dailyTotals = totalsBy(monthExpenses, (record) => record.t.slice(8, 10));
  let expense = 0;
  let coreExpense = 0;
  let income = 0;

  for (const record of monthRows) {
    const value = Number(record.p) || 0;
    if (isIncome(record)) {
      income += value;
    } else {
      expense += value;
      if (record.name2 !== "房贷" && record.name2 !== "房租") coreExpense += value;
    }
  }

  $("monthExpense").textContent = formatMoney(expense);
  $("monthCoreExpense").textContent = formatMoney(coreExpense);
  $("monthIncome").textContent = formatMoney(income);
  $("monthNet").textContent = formatMoney(income - expense);
  $("monthCount").textContent = String(monthRows.length);
  renderPie("monthPieChart", categoryTotals.slice(0, 8));
  renderRatioList("monthRankList", name2Totals.slice(0, 12));
  renderMonthCalendar("monthDailyCalendar", month, dailyTotals);
  $("monthDetailKind").value = state.monthDetailKind;
  const detailRows = monthRows.filter((record) => {
    if (state.monthDetailKind === "all") return true;
    return state.monthDetailKind === "income" ? isIncome(record) : isExpense(record);
  });
  renderMonthTable(detailRows);
}

function renderCategoryFilters(rows) {
  const typeSelect = $("categoryTypeFilter");
  const name1Select = $("categoryName1Filter");
  const name2Select = $("categoryName2Filter");
  const types = [...new Set(rows.map((record) => record.type))].sort();
  if (!types.includes(state.categoryFilter.type)) state.categoryFilter.type = types.includes("自己支出") ? "自己支出" : "all";

  const typeRows = rows.filter((record) => state.categoryFilter.type === "all" || record.type === state.categoryFilter.type);
  const name1s = [...new Set(typeRows.map((record) => record.name1))].sort();
  if (state.categoryFilter.name1 !== "all" && !name1s.includes(state.categoryFilter.name1)) state.categoryFilter.name1 = "all";

  const name1Rows = typeRows.filter((record) => state.categoryFilter.name1 === "all" || record.name1 === state.categoryFilter.name1);
  const name2s = [...new Set(name1Rows.map((record) => record.name2))].sort();
  if (state.categoryFilter.name2 !== "all" && !name2s.includes(state.categoryFilter.name2)) state.categoryFilter.name2 = "all";

  setFilterOptions(typeSelect, types, state.categoryFilter.type, "全部一级");
  setFilterOptions(name1Select, name1s, state.categoryFilter.name1, "全部二级");
  setFilterOptions(name2Select, name2s, state.categoryFilter.name2, "全部三级");
}

function categoryFilteredRows(rows) {
  return rows.filter((record) => (
    (state.categoryFilter.type === "all" || record.type === state.categoryFilter.type)
    && (state.categoryFilter.name1 === "all" || record.name1 === state.categoryFilter.name1)
    && (state.categoryFilter.name2 === "all" || record.name2 === state.categoryFilter.name2)
  ));
}

function renderCategoryMonthTable(data, average) {
  const rows = [...data].sort((a, b) => {
    if (state.categoryMonthSort === "dateAsc") return a[0].localeCompare(b[0]);
    if (state.categoryMonthSort === "dateDesc") return b[0].localeCompare(a[0]);
    if (state.categoryMonthSort === "amountAsc") return a[1] - b[1];
    return b[1] - a[1];
  });
  $("categoryMonthDateSortIcon").textContent = state.categoryMonthSort === "dateAsc" ? "↑" : state.categoryMonthSort === "dateDesc" ? "↓" : "↕";
  $("categoryMonthAmountSortIcon").textContent = state.categoryMonthSort === "amountAsc" ? "↑" : state.categoryMonthSort === "amountDesc" ? "↓" : "↕";
  $("categoryMonthTable").innerHTML = rows
    .map(([month, value]) => {
      const diff = average - value;
      const tone = diff < 0 ? "delta-over" : "delta-under";
      return `
      <tr>
        <td>${escapeHtml(month)}</td>
        <td class="num">${Math.round(value)}</td>
        <td class="num">${Math.round(average)}</td>
        <td class="num ${tone}">${Math.round(diff)}</td>
        <td class="num ${tone}">${average ? `${(diff / average * 100).toFixed(1)}%` : "0.0%"}</td>
      </tr>
    `;
    }).join("");
}

function renderCategoryRawMonthFilter(rows) {
  const months = [...new Set(rows.map((record) => record.t.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const select = $("categoryRawMonthFilter");
  setFilterOptions(select, months, state.categoryRawMonth, "全部时间");
  if (state.categoryRawMonth !== "all" && !months.includes(state.categoryRawMonth)) {
    state.categoryRawMonth = "all";
    select.value = "all";
  }
}

function setSortIcons(prefix, activeKey, sortState) {
  for (const key of ["Time", "Type", "Name1", "Name2", "Amount"]) {
    const el = $(`${prefix}${key}SortIcon`);
    if (el) el.textContent = "↕";
  }
  const active = $(`${prefix}${activeKey}SortIcon`);
  if (active) active.textContent = sortState.dir === "asc" ? "↑" : "↓";
}

function renderCategoryRawTable(rows) {
  renderCategoryRawMonthFilter(rows);
  const filteredRows = state.categoryRawMonth === "all"
    ? rows
    : rows.filter((record) => record.t.startsWith(state.categoryRawMonth));
  const sort = state.categoryRawSort;
  const sorted = [...filteredRows].sort((a, b) => {
    const av = sort.key === "p" ? Number(a.p) || 0 : String(a[sort.key] || "");
    const bv = sort.key === "p" ? Number(b.p) || 0 : String(b[sort.key] || "");
    const result = sort.key === "p" ? av - bv : av.localeCompare(bv);
    return sort.dir === "asc" ? result : -result;
  });
  setSortIcons("categoryRaw", {
    t: "Time",
    type: "Type",
    name1: "Name1",
    name2: "Name2",
    p: "Amount",
  }[sort.key], sort);
  $("categoryRawBody").innerHTML = sorted
    .map((record) => `
      <tr>
        <td>${escapeHtml(record.t)}</td>
        <td>${escapeHtml(record.type)}</td>
        <td>${escapeHtml(record.name1)}</td>
        <td>${escapeHtml(record.name2)}</td>
        <td class="num">${formatMoney(record.p)}</td>
        <td>${escapeHtml(record.bak)}</td>
      </tr>
    `).join("");
}

function renderCategoryPage(records) {
  const rows = expenseRows(records);
  const selfRows = rows.filter((record) => record.type === "自己支出");
  const noMortgageRows = selfRows.filter((record) => record.name2 !== "房贷");
  const noMortgageRentRows = noMortgageRows.filter((record) => record.name2 !== "房租");
  const allExpenseTotal = rows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const selfTotal = selfRows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const noMortgageTotal = noMortgageRows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const noMortgageRentTotal = noMortgageRentRows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const summaryText = (value) => `${formatWan(value)}万 / ${allExpenseTotal ? (value / allExpenseTotal * 100).toFixed(1) : "0.0"}%`;

  $("categorySelfName1Summary").textContent = summaryText(selfTotal);
  $("categoryNoMortgageSummary").textContent = summaryText(noMortgageTotal);
  $("categoryNoMortgageRentSummary").textContent = summaryText(noMortgageRentTotal);
  renderPositiveBars("categorySelfName1", totalsBy(selfRows, (record) => record.name1).sort((a, b) => b[1] - a[1]));
  renderRatioList("categoryNoMortgage", totalsBy(noMortgageRows, (record) => record.name1).sort((a, b) => b[1] - a[1]));
  renderRatioList("categoryNoMortgageRent", totalsBy(noMortgageRentRows, (record) => record.name1).sort((a, b) => b[1] - a[1]));

  renderCategoryFilters(rows);
  const filtered = categoryFilteredRows(rows);
  const filteredSelfRows = categoryFilteredRows(selfRows);
  const filteredNoMortgageRows = categoryFilteredRows(noMortgageRows);
  const filteredNoMortgageRentRows = categoryFilteredRows(noMortgageRentRows);
  renderRatioList("categorySelfName2", totalsBy(filteredSelfRows, (record) => record.name2).sort((a, b) => b[1] - a[1]));
  renderRatioList("categoryNoMortgageName2", totalsBy(filteredNoMortgageRows, (record) => record.name2).sort((a, b) => b[1] - a[1]));
  renderRatioList("categoryNoMortgageRentName2", totalsBy(filteredNoMortgageRentRows, (record) => record.name2).sort((a, b) => b[1] - a[1]));
  const total = filtered.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const baseTotal = rows.reduce((sum, record) => sum + (Number(record.p) || 0), 0);
  const dates = filtered.map((record) => record.t).sort();
  const baseDates = rows.map((record) => record.t).sort();
  const start = dates[0];
  const today = todayText();
  const days = dates.length ? Math.max(1, Math.round((new Date(today) - new Date(start)) / 86400000) + 1) : 0;
  const baseDays = baseDates.length ? Math.max(1, Math.round((new Date(baseDates[baseDates.length - 1]) - new Date(baseDates[0])) / 86400000) + 1) : 0;
  const monthTotals = totalsBy(filtered, (record) => record.t.slice(0, 7));
  const baseMonthTotals = totalsBy(rows, (record) => record.t.slice(0, 7));
  const yearTotals = totalsBy(filtered, (record) => record.t.slice(0, 4));
  const months = days ? days / 30.4375 : 0;
  const years = days ? days / 365 : 0;
  const baseYears = baseDays ? Math.max(baseDays / 365, 1 / 365) : 0;
  const dailyAvg = days ? total / days : 0;
  const monthlyAvg = months ? total / months : 0;
  const yearlyAvg = years ? total / years : 0;
  const baseDailyAvg = baseDays ? baseTotal / baseDays : 0;
  const baseMonthlyAvg = baseMonthTotals.length ? baseTotal / baseMonthTotals.length : 0;
  const baseYearlyAvg = baseYears ? baseTotal / baseYears : 0;
  const pctText = (value, base) => (base ? `${(value / base * 100).toFixed(1)}%` : "0.0%");

  $("categoryTotal").textContent = formatMoney(total);
  $("categoryDailyAvg").textContent = String(Math.round(dailyAvg));
  $("categoryMonthlyAvg").textContent = formatMoney(monthlyAvg);
  $("categoryYearlyAvg").textContent = formatMoney(yearlyAvg);
  $("categoryTotalPct").textContent = pctText(total, baseTotal);
  $("categoryDailyPct").textContent = pctText(dailyAvg, baseDailyAvg);
  $("categoryMonthlyPct").textContent = pctText(monthlyAvg, baseMonthlyAvg);
  $("categoryYearlyPct").textContent = pctText(yearlyAvg, baseYearlyAvg);
  renderColumnChart("categoryYearChart", yearTotals, { color: "#D1C4E9", integerLabel: true });
  renderPinnedSingleTrend("categoryMonthTrend", monthTotals, monthlyAvg);
  renderCategoryMonthTable(monthTotals, monthlyAvg);
  renderCategoryRawTable(filtered);
}

function setPage(page) {
  state.page = page;
  document.querySelectorAll(".page").forEach((el) => el.classList.toggle("active", el.id === `${page}Page`));
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.toggle("active", el.dataset.page === page));
}

function render() {
  const rows = currentRows();
  renderStats(rows);
  renderAnalysis(state.records);
  renderAnalysisDetail(state.records);
  renderMonthPage(state.records);
  renderCategoryPage(state.records);
  renderTable(rows);
  renderPositiveBars("typeChart", summarizeExpenses(rows, "type"));
  renderPositiveBars("nameChart", summarizeExpenses(rows, "name1"));
  renderPositiveBars("topName2Chart", summarizeExpenses(rows, typeName2Key, 5));
}

function collectTableRecords() {
  const changed = new Map();
  for (const tr of $("recordBody").querySelectorAll("tr")) {
    const record = {};
    for (const field of ["t", "type", "name1", "name2", "p", "bak"]) {
      record[field] = tr.querySelector(`[name='${field}']`).value.trim();
    }
    changed.set(tr.dataset.id, record);
  }
  return state.records.map((record) => changed.get(record.id) ? { id: record.id, ...changed.get(record.id) } : record);
}

async function saveVisibleEdits() {
  state.records = collectTableRecords();
  const payload = await requestJson("/api/records", {
    method: "PUT",
    body: JSON.stringify({ records: state.records }),
  });
  state.records = payload.records;
  render();
  toast("CSV 已保存");
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => setPage(button.dataset.page));
  });
  $("entryForm").addEventListener("change", (event) => {
    if (!event.target.matches("[name='type'], [name='name1']")) return;
    updateFormOptions(event.target.closest(".entry-row"));
  });
  $("entryForm").addEventListener("click", (event) => {
    if (!event.target.classList.contains("remove-entry-btn")) return;
    event.target.closest(".entry-row").remove();
    if (!$("entryForm").querySelector(".entry-row")) fillEntryForms([{}]);
  });
  $("parseBtn").addEventListener("click", async () => {
    try {
      const text = $("parseText").value.trim();
      if (!text) {
        toast("请输入需要解析的记账文字");
        return;
      }
      $("parseBtn").disabled = true;
      $("parseBtn").textContent = "解析中...";
      const payload = await requestJson("/api/parse-entry", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      fillEntryForms(payload.records);
      toast("已解析到表单，请确认后保存");
    } catch (error) {
      toast(error.message);
    } finally {
      $("parseBtn").disabled = false;
      $("parseBtn").textContent = "解析到表单";
    }
  });
  $("entryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const records = [...event.currentTarget.querySelectorAll(".entry-row")].map((row) => (
      Object.fromEntries(["t", "type", "name1", "name2", "p", "bak"].map((name) => (
        [name, row.querySelector(`[name='${name}']`).value]
      )))
    ));
    const payload = await requestJson("/api/records", { method: "POST", body: JSON.stringify({ records }) });
    state.records = payload.records;
    fillEntryForms([{}]);
    render();
    toast("已追加到 CSV");
  });

  $("recordBody").addEventListener("change", (event) => {
    const tr = event.target.closest("tr");
    if (!tr || !event.target.matches("select")) return;
    const type = tr.querySelector("[name='type']");
    const name1 = tr.querySelector("[name='name1']");
    const name2 = tr.querySelector("[name='name2']");
    if (event.target.name === "type") {
      setOptions(name1, groupOptions(CATEGORIES, 1, { 0: type.value }));
    }
    if (event.target.name === "type" || event.target.name === "name1") {
      setOptions(name2, groupOptions(CATEGORIES, 2, { 0: type.value, 1: name1.value }));
    }
  });

  $("recordBody").addEventListener("click", (event) => {
    if (!event.target.classList.contains("delete-btn")) return;
    const id = event.target.closest("tr").dataset.id;
    state.records = state.records.filter((record) => record.id !== id);
    render();
    toast("已从表格移除，点击保存修改后写入 CSV");
  });

  $("recordBody").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !event.target.matches("input, select")) return;
    event.preventDefault();
    saveVisibleEdits().catch((error) => toast(error.message));
  });

  $("saveTableBtn").addEventListener("click", saveVisibleEdits);
  $("reloadBtn").addEventListener("click", loadRecords);
  $("toggleCsvBtn").addEventListener("click", () => $("csvPathPanel").classList.toggle("open"));
  $("changeCsvBtn").addEventListener("click", () => changeCsvPath().catch((error) => toast(error.message)));
  $("toggleFundsBtn").addEventListener("click", () => $("fundsPathPanel").classList.toggle("open"));
  $("changeFundsBtn").addEventListener("click", () => changeFundsPath().catch((error) => toast(error.message)));
  $("weekBtn").addEventListener("click", setThisWeek);
  $("startDate").addEventListener("change", render);
  $("endDate").addEventListener("change", render);
  $("monthPicker").addEventListener("change", render);
  $("monthDetailKind").addEventListener("change", (event) => {
    state.monthDetailKind = event.target.value;
    render();
  });
  $("monthSummaryDateSortBtn").addEventListener("click", () => {
    state.monthSummarySort = state.monthSummarySort === "dateDesc" ? "dateAsc" : "dateDesc";
    render();
  });
  $("monthSummarySortBtn").addEventListener("click", () => {
    state.monthSummarySort = state.monthSummarySort === "desc" ? "asc" : "desc";
    render();
  });
  $("monthSummaryCoreSortBtn").addEventListener("click", () => {
    state.monthSummarySort = state.monthSummarySort === "coreDesc" ? "coreAsc" : "coreDesc";
    render();
  });
  $("analysisDetailType").addEventListener("change", (event) => {
    state.analysisDetailDraft.type = event.target.value;
    state.analysisDetailDraft.name1 = "all";
    state.analysisDetailDraft.name2 = "all";
    render();
  });
  $("analysisDetailName1").addEventListener("change", (event) => {
    state.analysisDetailDraft.name1 = event.target.value;
    state.analysisDetailDraft.name2 = "all";
    render();
  });
  $("analysisDetailName2").addEventListener("change", (event) => {
    state.analysisDetailDraft.name2 = event.target.value;
    render();
  });
  for (const [id, key] of [
    ["analysisDetailStart", "start"],
    ["analysisDetailEnd", "end"],
    ["analysisDetailMin", "min"],
    ["analysisDetailMax", "max"],
    ["analysisDetailBak", "bak"],
  ]) {
    $(id).addEventListener("input", (event) => {
      state.analysisDetailDraft[key] = event.target.value;
      renderAnalysisDetailFilters(state.records);
    });
  }
  $("analysisDetailApplyBtn").addEventListener("click", () => {
    state.analysisDetail = { ...state.analysisDetailDraft };
    render();
  });
  for (const [id, key] of [
    ["analysisDetailTimeSortBtn", "t"],
    ["analysisDetailTypeSortBtn", "type"],
    ["analysisDetailName1SortBtn", "name1"],
    ["analysisDetailName2SortBtn", "name2"],
    ["analysisDetailAmountSortBtn", "p"],
    ["analysisDetailBakSortBtn", "bak"],
  ]) {
    $(id).addEventListener("click", () => {
      if (state.analysisDetailSort.key === key) {
        state.analysisDetailSort.dir = state.analysisDetailSort.dir === "desc" ? "asc" : "desc";
      } else {
        state.analysisDetailSort = { key, dir: key === "p" || key === "t" ? "desc" : "asc" };
      }
      renderAnalysisDetailTable(state.records);
    });
  }
  $("categoryTypeFilter").addEventListener("change", (event) => {
    state.categoryFilter.type = event.target.value;
    state.categoryFilter.name1 = "all";
    state.categoryFilter.name2 = "all";
    render();
  });
  $("categoryName1Filter").addEventListener("change", (event) => {
    state.categoryFilter.name1 = event.target.value;
    state.categoryFilter.name2 = "all";
    render();
  });
  $("categoryName2Filter").addEventListener("change", (event) => {
    state.categoryFilter.name2 = event.target.value;
    render();
  });
  $("categoryMonthDateSortBtn").addEventListener("click", () => {
    state.categoryMonthSort = state.categoryMonthSort === "dateDesc" ? "dateAsc" : "dateDesc";
    render();
  });
  $("categoryMonthAmountSortBtn").addEventListener("click", () => {
    state.categoryMonthSort = state.categoryMonthSort === "amountDesc" ? "amountAsc" : "amountDesc";
    render();
  });
  $("categoryRawMonthFilter").addEventListener("change", (event) => {
    state.categoryRawMonth = event.target.value;
    render();
  });
  for (const [id, key] of [
    ["categoryRawTimeSortBtn", "t"],
    ["categoryRawTypeSortBtn", "type"],
    ["categoryRawName1SortBtn", "name1"],
    ["categoryRawName2SortBtn", "name2"],
    ["categoryRawAmountSortBtn", "p"],
  ]) {
    $(id).addEventListener("click", () => {
      if (state.categoryRawSort.key === key) {
        state.categoryRawSort.dir = state.categoryRawSort.dir === "desc" ? "asc" : "desc";
      } else {
        state.categoryRawSort = { key, dir: key === "p" ? "desc" : "asc" };
      }
      render();
    });
  }
  $("monthSortBtn").addEventListener("click", () => {
    state.monthSort = state.monthSort === "asc" ? "desc" : "asc";
    render();
  });
}

fillEntryForms([{}]);
$("monthPicker").value = currentMonthText();
setThisWeek();
setPage("book");
bindEvents();
loadRecords().catch((error) => toast(error.message));
loadFunds();
