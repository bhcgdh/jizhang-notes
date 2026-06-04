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
const CATEGORY_LINES = [
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

async function parseEntryWithModel(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const isLocalModel = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(LLM_BASE_URL);
  if (!apiKey && !isLocalModel) {
    throw new Error("未配置 OPENAI_API_KEY，无法调用大模型解析");
  }

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey || "ollama"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "你是记账文本解析器，只返回 JSON。",
            "从用户文字中提取 t,type,name1,name2,p,bak。",
            `今天日期是 ${today}，没有明确日期时使用今天。昨天、前天等相对日期以今天为基准。`,
            "type/name1/name2 必须从允许分类中选择完全一致的一组。",
            "p 只保留数字金额，不带货币符号。bak 是简短备注，没有备注用 none。",
            `允许分类:\n${CATEGORY_LINES.join("\n")}`,
          ].join("\n"),
        },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ledger_entry",
          strict: true,
          schema: {
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
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "大模型解析失败");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("大模型没有返回解析结果");
  const parsed = normalizeRecord(JSON.parse(content));
  const allowed = new Set(CATEGORY_LINES);
  if (!allowed.has(`${parsed.type} ${parsed.name1} ${parsed.name2}`)) {
    throw new Error("大模型返回的分类不在允许列表中");
  }
  return parsed;
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
      records.push(normalizeRecord(payload));
      writeRecords(records);
      sendJson(res, 200, { ok: true, records: readRecords() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/parse-entry") {
      const payload = JSON.parse(await readBody(req));
      const text = String(payload.text || "").trim();
      if (!text) throw new Error("请输入需要解析的记账文字");
      sendJson(res, 200, { record: await parseEntryWithModel(text) });
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

// 递归尝试启动
function startServer(port) {
    server.listen(port, () => {
        console.log(`记账笔记已启动: http://localhost:${port}`);
        // 如果你的 csvPath 是在这里定义的，保持原样输出
        // console.log(`CSV: ${csvPath}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ 端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('服务器启动错误:', err);
        }
    });
}

// 启动
startServer(BASE_PORT);


