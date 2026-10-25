# 随机上线 v2.2.2（Beta）

【更新内容】

· 更新包下载修好了：之前下载总是失败，是因为直连 github.com 走不通；现在改成走 GitHub 接口下载，实测一次就成
· 不再重复下载：包已经在手机里时，再点下载会直接告诉你“已存在”，不会又跑一遍
· 下载失败会给原因：连不上、限流、磁盘不足，都用人话说清楚
· 面板上的版本号改为真实版本（以前写死了一行，容易让人误以为已经升级）
· 下载中关掉面板再打开，能看到“正在下载”，不会变回“下载更新包”
· 去掉了自己安装的功能，下载完去「包管理 → 导入」安装

【技术实现】

- 下载线路：`https://api.github.com/repos/{repo}/releases/assets/{id}` + `Accept: application/octet-stream`（实测 github.com 超时、api.github.com 200/5.5s、objects.githubusercontent.com 通）
- 删除 probe 预下载（原做法把同一个包下两遍，且它的字节数是 base64 累计，会报 132KB 假数字）
- 下载改为单次请求；超时 45s，重试 2 次；连接类错误转中文提示
- 失败时 `received` 归零，避免“已下载 100%”与“下载失败”同屏
- 文件已存在且字节数与 asset_size 一致 → 直接返回 cached
- UI 轮询单例化（startPollOnce），恢复块不再被 alreadyInited 拦住
- `get_xy` 返回 `current_version`，面板不再写死版本号
- 删除 install_package / open_package / import_package

【升级方式】

在面板点「下载更新包」，下载完成后到「包管理 → 导入」选择刚下载的 .toolpkg，然后彻底关掉 Operit 再打开。
