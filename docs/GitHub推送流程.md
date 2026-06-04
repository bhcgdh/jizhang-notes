# GitHub 推送流程

本文档用于将 `F:\zz_codexs\记账笔记` 的更新提交并推送到 GitHub。

仓库信息：

```text
本地目录：F:\zz_codexs\记账笔记
远程仓库：https://github.com/bhcgdh/jizhang-notes.git
远程名称：origin
推送分支：main
本机代理：http://127.0.0.1:7897
```

## 完整推送流程

### 1. 进入项目目录

```powershell
cd F:\zz_codexs\记账笔记
```

### 2. 检查修改内容

```powershell
git status --short
git diff --stat
git diff --check
```

说明：

- `git status --short`：查看已修改和未跟踪的文件。
- `git diff --stat`：查看每个文件的大致修改量。
- `git diff --check`：检查空白字符等格式问题。

提交前应确认没有密码、Token、模型权重、个人数据或无关临时文件。

### 3. 运行代码检查

当前项目可运行：

```powershell
node --check server.js
node --check public\app.js
```

如果检查命令报错，应先修复错误，再继续提交。

### 4. 暂存需要提交的文件

推荐明确指定文件，避免误提交无关内容：

```powershell
git add -- server.js package.json public\app.js public\index.html public\styles.css docs
```

如果确认当前所有修改都需要提交，也可以使用：

```powershell
git add -A
```

再次检查暂存结果：

```powershell
git status --short
git diff --cached --stat
```

### 5. 创建提交

```powershell
git commit -m "简短说明本次修改"
```

示例：

```powershell
git commit -m "Update bookkeeping parser documentation"
```

检查最新提交：

```powershell
git log -1 --oneline
```

### 6. 推送到 GitHub

本机访问 GitHub 需要使用 `127.0.0.1:7897` 代理。仅对本次命令临时使用代理：

```powershell
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main
```

推送成功后，输出类似：

```text
main -> main
```

### 7. 确认推送成功

```powershell
git status -sb
git log -1 --oneline --decorate
```

正常情况下应看到：

```text
## main...origin/main
```

并且最新提交同时标记为：

```text
HEAD -> main, origin/main
```

## 日常快速命令

确认本次所有修改都应该上传后，可以依次执行：

```powershell
cd F:\zz_codexs\记账笔记

git status --short
git diff --check
node --check server.js
node --check public\app.js

git add -A
git commit -m "说明本次修改"
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main

git status -sb
```

## 常见问题

### 无法连接 GitHub 443 端口

错误示例：

```text
Failed to connect to github.com port 443
```

先检查代理端口：

```powershell
Test-NetConnection 127.0.0.1 -Port 7897
```

如果 `TcpTestSucceeded` 为 `True`，使用带代理的推送命令：

```powershell
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main
```

如果为 `False`，需要先启动本机代理软件。

### 没有内容可以提交

提示：

```text
nothing to commit
```

说明当前没有新的已暂存修改。运行以下命令检查：

```powershell
git status --short
```

### 推送前远程已有更新

如果推送提示远程分支领先，先获取并变基：

```powershell
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 pull --rebase origin main
```

确认没有冲突后再推送：

```powershell
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main
```

### 查看远程仓库

```powershell
git remote -v
```

当前仓库应显示：

```text
origin  https://github.com/bhcgdh/jizhang-notes.git
```

## 注意事项

- 不要将 GitHub 密码、PAT Token 或其他密钥写入仓库。
- 不要提交 `node_modules`、模型权重或大型临时文件。
- 不要使用 `git reset --hard` 清理未确认的修改。
- 推送前先运行 `git status --short`，确认提交文件范围。
- 提交说明应简短描述本次修改内容。
