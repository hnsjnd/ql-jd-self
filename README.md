# ql-jd-self

飞牛青龙自用小库：检测京东 Cookie 是否掉线，并可把结果发到青龙已配好的通知（如微信 PushPlus）。

不包含第三方加密签到脚本，也不依赖 `function/dylanv` 这类文件。

## 青龙订阅

订阅管理 → 创建订阅，名称栏粘贴：

```text
ql repo https://github.com/hnsjnd/ql-jd-self.git "jd_" "" "sendNotify" "main"
```

- 类型：公开仓库
- 定时规则：`20 8 * * *`
- 自动添加定时任务：勾选

保存后点运行。

## 脚本

| 文件 | 作用 |
|---|---|
| `jd_ck_status.js` | 检测 `JD_COOKIE` 是否有效，掉线会发通知 |
| `jd_notify_test.js` | 只发一条测试通知，用来确认微信/通知通了 |

## 环境变量

已有 `JD_COOKIE` 即可。多账号请每个变量一条，不要合在一起。

微信通知仍在青龙配置文件里填 `PUSH_PLUS_TOKEN` 或 `PUSH_KEY`。
