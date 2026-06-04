const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const XLSX = require("xlsx");

//const PORT = Number(process.env.PORT || 5174);
// 起始端口（保留环境变量支持）
const BASE_PORT = Number(process.env.PORT || 5174);


let csvPath = process.env.CSV_PATH || "F:\\daysz\\dfsz.csv";
let fundsPath = process.env.FUNDS_XLSX_PATH || "F:\\daysz\\hisdata\\mark1.xlsx";
const LLM_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const LLM_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const PUBLIC_DIR = path.join(__dirname, "public");
const COLUMNS = ["t", "type", "name1", "name2", "p", "bak", "month", "year", "ym"];
const EDIT_COLUMNS = ["t", "type", "name1", "name2", "p", "bak"];
const CATEGORY_ALIASES = {
  "衣服": "衣物",
};
const CATEGORY_HINTS = [
  { pattern: /甜品|甜点/, name1: "食物支出", name2: "甜点" },
  { pattern: /衣服|衣物/, name1: "日用支出", name2: "衣物" },
  { pattern: /手机/, name1: "日用支出", name2: "电器电子" },
  { pattern: /零食/, name1: "食物支出", name2: "零食" },
];
const DEFAULT_CATEGORY_LINES = [
  "家里支出 医疗支出 医疗",
  "家里支出 医疗支出 保健品",
  "家里支出 固定支出 生活费",
  "家里支出 娱乐支出 社交",
  "家里支出 娱乐支出 运动",
  "家里支出 日用支出 洗护类",
  "家里支出 日用支出 衣物",
  "家里支出 日用支出 厨房用品",
  "家里支出 日用支出 电器电子",
  "家里支出 日用支出 办公用品",
  "家里支出 日用支出 纸巾类",
  "家里支出 日用支出 维修",
  "家里支出 日用支出 护肤品",
  "家里支出 食物支出 零食",
  "家里支出 食物支出 蔬菜",
  "家里支出 食物支出 水果",
  "家里支出 食物支出 外餐",
  "家里支出 食物支出 干货",
  "家里支出 食物支出 花茶",
  "家里支出 食物支出 调料",
  "家里支出 食物支出 咖啡",
  "家里支出 食物支出 甜点",
  "家里支出 食物支出 虾仁",
  "自己支出 其他 其他",
  "自己支出 医疗支出 艾草",
  "自己支出 医疗支出 保健品",
  "自己支出 医疗支出 医疗",
  "自己支出 固定支出 水电",
  "自己支出 固定支出 房租",
  "自己支出 固定支出 公交地铁",
  "自己支出 固定支出 房贷",
  "自己支出 固定支出 其他",
  "自己支出 固定支出 话费",
  "自己支出 娱乐支出 门票",
  "自己支出 娱乐支出 社交",
  "自己支出 娱乐支出 电影",
  "自己支出 娱乐支出 玩具",
  "自己支出 娱乐支出 彩票",
  "自己支出 日用支出 衣物",
  "自己支出 日用支出 其他",
  "自己支出 日用支出 厨房用品",
  "自己支出 日用支出 书籍",
  "自己支出 日用支出 办公用品",
  "自己支出 日用支出 电器电子",
  "自己支出 日用支出 洗护类",
  "自己支出 日用支出 纸巾类",
  "自己支出 日用支出 护肤品",
  "自己支出 日用支出 快递",
  "自己支出 日用支出 化妆品",
  "自己支出 日用支出 维修",
  "自己支出 猫咪支出 猫咪用品",
  "自己支出 猫咪支出 猫粮",
  "自己支出 猫咪支出 猫玩具",
  "自己支出 食物支出 水果",
  "自己支出 食物支出 外餐",
  "自己支出 食物支出 零食",
  "自己支出 食物支出 蔬菜",
  "自己支出 食物支出 咖啡",
  "自己支出 食物支出 调料",
  "自己支出 食物支出 花茶",
  "自己支出 食物支出 干货",
  "自己支出 食物支出 甜点",
  "自己支出 食物支出 甜品",
  "自己收入 基金 none",
  "自己收入 工资收入 none",
  "自己收入 红包收入 none",
  "自己收入 股票 none",
];
let categoryLines = [...DEFAULT_CATEGORY_LINES];

function categoriesPath() {
  return path.join(path.dirname(csvPath), `${path.basename(csvPath, path.extname(csvPath))}.categories.json`);
}

function loadCategories() {
  const filePath = categoriesPath();
  if (!fs.existsSync(filePath)) {
    categoryLines = [...DEFAULT_CATEGORY_LINES];
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed) || !parsed.length || parsed.some((row) => !Array.isArray(row) || row.length !== 3)) {
    throw new Error("分类配置文件格式无效");
  }
  categoryLines = parsed.map((row) => row.map((value) => String(value).trim()).join(" "));
}

function nextBackupPath(filePath) {
  const directory = path.dirname(filePath);
  const extension = path.extname(filePath);
  const baseName = path.basename(filePath, extension).replace(/_\d{2}$/, "");
  for (let index = 1; index < 100; index += 1) {
    const candidate = path.join(directory, `${baseName}_${String(index).padStart(2, "0")}${extension}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error("备份文件数量已达到上限");
}

function updateCategories(payload) {
  if (!Array.isArray(payload.rows) || !payload.rows.length) throw new Error("分类列表不能为空");

  const rows = payload.rows.map((row) => ({
    original: Array.isArray(row.original) ? row.original.map((value) => String(value).trim()) : null,
    values: Array.isArray(row.values) ? row.values.map((value) => String(value).trim()) : [],
  }));
  if (rows.some((row) => row.values.length !== 3 || row.values.some((value) => !value || /\s/.test(value)))) {
    throw new Error("三级分类都不能为空，且不能包含空格");
  }

  const nextKeys = rows.map((row) => row.values.join(" "));
  if (new Set(nextKeys).size !== nextKeys.length) throw new Error("分类组合不能重复");

  const originalKeys = new Set(categoryLines);
  const submittedOriginalKeys = new Set(rows.filter((row) => row.original?.length === 3).map((row) => row.original.join(" ")));
  const hasDeletedCategories = [...originalKeys].some((key) => !submittedOriginalKeys.has(key));
  const hasRenamedCategories = rows.some((row) => row.original?.length === 3 && row.original.join(" ") !== row.values.join(" "));
  const affectsCsv = hasDeletedCategories || hasRenamedCategories;

  const mapping = new Map(rows.filter((row) => row.original?.length === 3).map((row) => [row.original.join(" "), row.values]));
  let records = null;
  let backupPath = null;
  if (affectsCsv) {
    records = readRecords().map((record) => {
      const key = `${record.type} ${record.name1} ${record.name2}`;
      const replacement = mapping.get(key);
      if (replacement) {
        return { ...record, type: replacement[0], name1: replacement[1], name2: replacement[2] };
      }
      if (!nextKeys.includes(key)) throw new Error(`分类仍被账单使用，不能直接删除：${key}`);
      return record;
    });

    ensureCsvFile();
    backupPath = nextBackupPath(csvPath);
    fs.copyFileSync(csvPath, backupPath);
  }
  fs.writeFileSync(categoriesPath(), `${JSON.stringify(rows.map((row) => row.values), null, 2)}\n`, "utf8");
  categoryLines = nextKeys;
  if (records) writeRecords(records);
  return { backupPath, categories: rows.map((row) => row.values), records: records ? readRecords() : null };
}

function ensureCsvFile() {
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, `\uFEFF${COLUMNS.join(",")}\n`, "utf8");
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function dateParts(t) {
  const match = String(t || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", ym: "" };
  return { year: match[1], month: String(Number(match[2])), ym: `${match[1]}-${match[2]}` };
}

function normalizeRecord(record) {
  const clean = {};
  for (const key of EDIT_COLUMNS) {
    clean[key] = String(record[key] ?? "").trim();
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.t)) {
    throw new Error("时间必须是 YYYY-MM-DD 格式");
  }
  if (!clean.type || !clean.name1 || !clean.name2) {
    throw new Error("三个分类都必须填写");
  }
  if (!Number.isFinite(Number(clean.p))) {
    throw new Error("金额必须是数字");
  }

  clean.p = String(Number(clean.p));
  clean.bak = clean.bak || "none";
  return { ...clean, ...dateParts(clean.t) };
}

function readRecords() {
  ensureCsvFile();
  const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const header = rows[0];
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));

  return rows.slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row, index) => {
      const record = { id: String(index) };
      for (const key of EDIT_COLUMNS) record[key] = row[indexes[key]] ?? "";
      return record;
    });
}

function writeRecords(records) {
  const normalized = records.map(normalizeRecord);
  const lines = [
    COLUMNS.join(","),
    ...normalized.map((record) => COLUMNS.map((key) => escapeCsv(record[key])).join(",")),
  ];
  fs.writeFileSync(csvPath, `\uFEFF${lines.join("\n")}\n`, "utf8");
}

function setCsvPath(nextPath) {
  const clean = String(nextPath || "").trim();
  if (!clean) throw new Error("账本文件路径不能为空");
  if (path.extname(clean).toLowerCase() !== ".csv") throw new Error("账本文件必须是 CSV 文件");
  csvPath = path.resolve(clean);
  ensureCsvFile();
  loadCategories();
  return csvPath;
}

function normalizeCellText(cell) {
  return String(cell?.w ?? cell?.v ?? "").trim();
}

function excelDateToTimestamp(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value) && XLSX.SSF.parse_date_code(value)) {
    return Date.UTC(1899, 11, 30) + value * 86400000;
  }

  const text = String(value || "").trim().replace(/\//g, "-");
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatExcelDate(cell) {
  const text = normalizeCellText(cell);
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text)) return text.replace(/\//g, "-");

  if (typeof cell?.v === "number" && XLSX.SSF.parse_date_code(cell.v)) {
    const parsed = XLSX.SSF.parse_date_code(cell.v);
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }

  return text;
}

function readFundsWorkbook() {
  if (!fs.existsSync(fundsPath)) throw new Error("资金表文件不存在");

  const workbook = XLSX.readFile(fundsPath, { cellDates: true });
  const sheetName = "现有资金";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) throw new Error("没有找到 现有资金 表");

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let headerRow = -1;
  let timeCol = -1;
  let targetCol = -1;

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 49); r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const text = normalizeCellText(sheet[XLSX.utils.encode_cell({ r, c })]);
      if (text === "时间") {
        headerRow = r;
        timeCol = c;
      }
      if (text === "非公积金") targetCol = c;
    }
  }

  if (timeCol < 0 || targetCol < 0) throw new Error("没有找到 时间 或 非公积金 字段");

  let latestRow = -1;
  let latestTime = -Infinity;
  for (let r = headerRow + 1; r <= range.e.r; r += 1) {
    const timeCell = sheet[XLSX.utils.encode_cell({ r, c: timeCol })];
    const timestamp = excelDateToTimestamp(timeCell?.v ?? timeCell?.w);
    if (Number.isFinite(timestamp) && timestamp >= latestTime) {
      latestTime = timestamp;
      latestRow = r;
    }
  }

  if (latestRow < 0) throw new Error("没有找到时间有值的数据行");

  const valueCell = sheet[XLSX.utils.encode_cell({ r: latestRow, c: targetCol })];
  const value = Number(String(valueCell?.v ?? valueCell?.w ?? "").replace(/,/g, ""));
  if (!Number.isFinite(value)) throw new Error("最大时间行的非公积金不是有效数字");

  return {
    path: fundsPath,
    sheet: sheetName,
    row: latestRow + 1,
    time: formatExcelDate(sheet[XLSX.utils.encode_cell({ r: latestRow, c: timeCol })]),
    value,
  };
}

async function setFundsPath(nextPath) {
  const clean = String(nextPath || "").trim();
  if (!clean) throw new Error("资金表路径不能为空");
  if (path.extname(clean).toLowerCase() !== ".xlsx") throw new Error("资金表必须是 xlsx 文件");
  if (!fs.existsSync(clean)) throw new Error("资金表文件不存在");
  fundsPath = path.resolve(clean);
  return readFundsWorkbook();
}

function splitLedgerText(text) {
  const amountPattern = /(?:\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百千万]+)\s*(?:元|块)?\s*$/;
  const datePattern = /(?:\d{2,4}年\d{1,2}月\d{1,2}[日号]|今天|昨天|前天)/;
  const parts = text.split(/[,，;；。.\n]+/).map((part) => part.trim()).filter(Boolean);
  const entries = [];
  let dateContext = "";

  for (const part of parts) {
    const date = part.match(datePattern)?.[0];
    if (date) dateContext = date;
    if (!amountPattern.test(part)) continue;
    entries.push(dateContext && !part.includes(dateContext) ? `${dateContext}，${part}` : part);
  }

  if (entries.length < 2) return [text];
  return entries;
}

function countLedgerEntries(text) {
  return splitLedgerText(text).length;
}

function applyDefaultType(record, text, allowed) {
  if (record.type !== "家里支出" || text.includes("家里")) return record;
  const selfType = `自己支出 ${record.name1} ${record.name2}`;
  return allowed.has(selfType) ? { ...record, type: "自己支出" } : record;
}

function normalizeCategoryAliases(record) {
  return {
    ...record,
    name1: CATEGORY_ALIASES[record.name1] || record.name1,
    name2: CATEGORY_ALIASES[record.name2] || record.name2,
  };
}

function normalizeModelRecord(record) {
  const normalized = { ...record };
  if (/^\d{2}-\d{2}-\d{2}$/.test(String(normalized.t || ""))) {
    normalized.t = `20${normalized.t}`;
  }
  return normalizeRecord(normalized);
}

function chineseNumberToNumber(text) {
  const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const units = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
  let total = 0;
  let current = 0;
  for (const char of text) {
    if (char in digits) {
      current = digits[char];
    } else if (char in units) {
      const unit = units[char];
      if (unit === 10000) {
        total = (total + current) * unit;
        current = 0;
      } else {
        total += (current || 1) * unit;
        current = 0;
      }
    }
  }
  return total + current;
}

function applyInputAmount(record, text) {
  if (splitLedgerText(text).length !== 1) return record;
  const match = text.match(/(?:花了?|消费|支出|买了?)(\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百千万]+)\s*(?:元|块)?\s*$/);
  if (!match) return record;
  const amount = /^\d/.test(match[1]) ? Number(match[1]) : chineseNumberToNumber(match[1]);
  return Number.isFinite(amount) && amount > 0 ? { ...record, p: String(amount) } : record;
}

function applyInputBak(record, text) {
  if (!/(?:^[\d,，\s]+$|[,，]\d+$)/.test(record.bak) || splitLedgerText(text).length !== 1) return record;
  const item = text
    .replace(/^(?:\d{2,4}年\d{1,2}月\d{1,2}[日号]|今天|昨天|前天)[,，]?/, "")
    .replace(/^(?:给)?家里/, "")
    .replace(/^买(?:了)?/, "")
    .replace(/花了?(?:\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百千万]+)\s*(?:元|块)?\s*$/, "")
    .trim();
  return item ? { ...record, bak: item } : record;
}

function applyCategoryHint(record, text, allowed) {
  const hint = CATEGORY_HINTS.find(({ pattern }) => pattern.test(record.bak));
  if (!hint) return record;
  const hinted = { ...record, name1: hint.name1, name2: hint.name2 };
  return allowed.has(`${hinted.type} ${hinted.name1} ${hinted.name2}`) ? hinted : record;
}

async function parseEntriesFromModel(text, correction = "", correctionAttempts = 0) {
  const apiKey = process.env.OPENAI_API_KEY;
  const isLocalModel = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(LLM_BASE_URL);
  if (!apiKey && !isLocalModel) {
    throw new Error("未配置 OPENAI_API_KEY，无法调用大模型解析");
  }

  const requestBody = {
    model: LLM_MODEL,
    messages: [
      {
        role: "user",
        content: [
          "你是一个个人记账文本解析器，请把用户输入解析成 t,type,name1,name2,p,bak 字段，type/name1/name2 必须从给定类别中选择，只输出 JSON。",
          `用户输入：${text}`,
          correction,
        ].filter(Boolean).join("\n"),
      },
    ],
  };

  if (!isLocalModel) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: "ledger_entries",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              t: { type: "string", description: "YYYY-MM-DD" },
              type: { type: "string" },
              name1: { type: "string" },
              name2: { type: "string" },
              p: { type: "number" },
              bak: { type: "string" },
            },
            required: ["t", "type", "name1", "name2", "p", "bak"],
          },
        },
      },
    };
  }

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey || "ollama"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "大模型解析失败");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("大模型没有返回解析结果");
  let rawRecords;
  try {
    const jsonText = content.match(/\[[\s\S]*\]/)?.[0] || content.match(/\{[\s\S]*\}/)?.[0];
    const parsed = JSON.parse(jsonText);
    rawRecords = Array.isArray(parsed) ? parsed : Array.isArray(parsed.records) ? parsed.records : [parsed];
  } catch {
    rawRecords = [...content.matchAll(/\{[^{}]*\}/g)].map((match) => JSON.parse(match[0]));
  }
  if (!rawRecords.length) throw new Error("大模型返回的内容不是 JSON");

  const allowed = new Set(categoryLines);
  const records = rawRecords
    .map(normalizeModelRecord)
    .map(normalizeCategoryAliases)
    .map((record) => applyDefaultType(record, text, allowed))
    .map((record) => applyCategoryHint(record, text, allowed))
    .map((record) => applyInputAmount(record, text))
    .map((record) => applyInputBak(record, text));
  for (const record of records) {
    if (!allowed.has(`${record.type} ${record.name1} ${record.name2}`)) {
      const invalid = `${record.type} ${record.name1} ${record.name2}`;
      if (correctionAttempts < 2) {
        const typeOptions = categoryLines.filter((line) => line.startsWith(`${record.type} `));
        return parseEntriesFromModel(text, [
          `上次返回的分类组合“${invalid}”无效，请修正后重新输出全部记录。`,
          `允许分类组合：\n${typeOptions.join("\n")}`,
        ].join("\n"), correctionAttempts + 1);
      }
      throw new Error(`大模型返回的分类不在允许列表中：${invalid}`);
    }
  }
  return records;
}

async function parseEntryWithModel(text) {
  const parts = splitLedgerText(text);
  try {
    const whole = await parseEntriesFromModel(text);
    if (parts.length === 1 || whole.length >= countLedgerEntries(text)) return whole;
  } catch (error) {
    if (parts.length === 1) throw error;
  }

  const parsed = await Promise.all(parts.map(parseEntriesFromModel));
  return parsed.flat();
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("请求内容过大"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  const type = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  }[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/records") {
      sendJson(res, 200, { path: csvPath, records: readRecords() });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/categories") {
      sendJson(res, 200, { categories: categoryLines.map((line) => line.split(" ")) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/funds") {
      sendJson(res, 200, { funds: await readFundsWorkbook() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/csv-path") {
      const payload = JSON.parse(await readBody(req));
      sendJson(res, 200, { path: setCsvPath(payload.path), records: readRecords() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/funds-path") {
      const payload = JSON.parse(await readBody(req));
      sendJson(res, 200, { funds: await setFundsPath(payload.path) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/records") {
      const payload = JSON.parse(await readBody(req));
      const records = readRecords();
      const additions = Array.isArray(payload.records) ? payload.records : [payload];
      records.push(...additions.map(normalizeRecord));
      writeRecords(records);
      sendJson(res, 200, { ok: true, records: readRecords() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/parse-entry") {
      const payload = JSON.parse(await readBody(req));
      const text = String(payload.text || "").trim();
      if (!text) throw new Error("请输入需要解析的记账文字");
      sendJson(res, 200, { records: await parseEntryWithModel(text) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/categories") {
      const payload = JSON.parse(await readBody(req));
      sendJson(res, 200, updateCategories(payload));
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/records") {
      const payload = JSON.parse(await readBody(req));
      if (!Array.isArray(payload.records)) throw new Error("records 必须是数组");
      writeRecords(payload.records);
      sendJson(res, 200, { ok: true, records: readRecords() });
      return;
    }

    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

//server.listen(PORT, () => {
//  console.log(`记账笔记已启动: http://localhost:${PORT}`);
//  console.log(`CSV: ${csvPath}`);
//});

function startServer(port) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("服务器启动错误:", err);
    }
  });

  server.listen(port, () => {
    if (server.address()?.port === port) {
      console.log(`记账笔记已启动: http://localhost:${port}`);
    }
  });
}

loadCategories();
startServer(BASE_PORT);
