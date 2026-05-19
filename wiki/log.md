---
title: 操作日志
updated: 2026-05-14
---

# 操作日志

此文件按时间顺序记录 wiki 的所有操作 (ingest / create / update / delete / lint / reindex 等)。
后续阶段由 MCP Server 的 `log-parser` 模块追加与解析条目。

## 条目

<!-- 日志条目格式 (后续由 log-parser 维护):
- 2026-05-14T20:55:00Z [ingest] some-source.md → some-page: 摘要内容
-->
{"timestamp":"2026-05-19T03:56:45.886Z","level":"info","action":"write_page","message":"Page written: hermes-plugin-memory"}
{"timestamp":"2026-05-19T03:56:45.931Z","level":"info","action":"write_page","message":"Page written: src-adapters"}
{"timestamp":"2026-05-19T03:56:45.977Z","level":"info","action":"write_page","message":"Page written: src-cli"}
{"timestamp":"2026-05-19T03:56:46.026Z","level":"info","action":"write_page","message":"Page written: src-core"}
{"timestamp":"2026-05-19T03:56:46.066Z","level":"info","action":"write_page","message":"Page written: src-gateway"}
{"timestamp":"2026-05-19T03:56:46.113Z","level":"info","action":"write_page","message":"Page written: src-offload"}
{"timestamp":"2026-05-19T03:56:46.157Z","level":"info","action":"write_page","message":"Page written: src-utils"}
{"timestamp":"2026-05-19T03:57:15.491Z","level":"info","action":"write_page","message":"Page written: tencentdb-agent-memory-architecture"}
