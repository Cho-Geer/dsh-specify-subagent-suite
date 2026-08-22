window.__ModuleLoader__.load({
	id: "@zach-tao/dsh-specify-subagent-suite",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/agent-sidebar.js
		function factory$1(require$2) {
			const React = require$2("react");
			const styles = { insert(cssText) {
				if (typeof document === "undefined") return;
				const tagId = "dsh-specify-subagent-suite/agent-sidebar";
				if (document.querySelector("style[data-plugin-css=\"" + tagId + "\"]") !== null) return;
				const el = document.createElement("style");
				el.dataset.plugin = "dsh-specify-subagent-suite";
				el.dataset.pluginCss = tagId;
				el.textContent = cssText;
				(document.head || document.documentElement).appendChild(el);
			} };
			return {
				inject: [
					"slots",
					"sessions",
					"layout"
				],
				apply(ctx) {
					const slots = ctx.get("slots");
					const sessions = ctx.get("sessions");
					const layout = ctx.get("layout");
					if (slots === void 0 || sessions === void 0 || layout === void 0) return;
					styles.insert(`
      .sbx-host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; box-sizing: border-box; background: var(--dsw-specific-menu, rgba(24,26,32,0.98)); }
      .sbx-tabs { display: flex; gap: 4px; padding: 8px 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.16)); flex: none; }
      .sbx-tab { flex: 1; min-width: 0; border: none; background: transparent; color: var(--dsw-alias-label-secondary, #bbb); font-size: 12px; line-height: 18px; padding: 6px 4px; border-radius: 6px 6px 0 0; cursor: pointer; white-space: nowrap; }
      .sbx-tab:hover { color: var(--dsw-alias-label-primary, #e8e8e8); }
      .sbx-tab-active { color: var(--dsw-alias-label-primary, #e8e8e8); background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); }
      /* 合并后的 toggle 按钮：默认恒显，由 RestoreButton 根据祖先 data-details-collapsed
         切换 icon/title/onClick；不再用 CSS 互斥显隐。 */
      .sbx-restore { position: absolute; top: 50%; right: 0; transform: translateY(-50%); display: flex; align-items: center; justify-content: center; width: 18px; height: 64px; background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25)); border-right: none; border-radius: 8px 0 0 8px; color: var(--dsw-alias-label-secondary, #bbb); font-size: 12px; cursor: pointer; z-index: 5; box-sizing: border-box; }
      .sbx-restore:hover { color: var(--dsw-alias-label-primary, #e8e8e8); background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.12)); }
      .sbx-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary, #bbb); }
      .sbx-empty { color: var(--dsw-alias-label-tertiary, #888); padding: 12px 4px; font-size: 12px; }
      .sbx-hint { color: var(--dsw-alias-label-tertiary, #888); padding: 8px 7px; font-size: 11px; font-style: italic; }
      .sbx-row { display: flex; align-items: center; gap: 6px; padding: 5px 6px; border-radius: 6px; cursor: pointer; }
      .sbx-row:hover { background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.06)); }
      .sbx-dot { width: 8px; height: 8px; flex: none; border-radius: 50%; }
      .sbx-dot-run { background: #7cb305; box-shadow: 0 0 6px rgba(124,179,5,0.55); }
      .sbx-dot-done { background: var(--dsw-alias-border-l2, #555); }
      .sbx-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary, #e8e8e8); }
      .sbx-meta { color: var(--dsw-alias-label-tertiary, #888); font-size: 11px; flex: none; }
      .sbx-chev { flex: none; color: var(--dsw-alias-label-tertiary, #888); font-size: 10px; padding: 2px 4px; border-radius: 4px; cursor: pointer; }
      .sbx-chev:hover { background: var(--dsw-interactive-bg-hover, rgba(255,255,255,0.10)); }
      .sbx-progress { display: flex; gap: 6px; flex-wrap: wrap; padding: 6px 2px 8px; color: var(--dsw-alias-label-tertiary, #999); font-size: 11px; }
      .sbx-todo { display: flex; gap: 6px; align-items: flex-start; padding: 4px 2px; }
      .sbx-todo-content { color: var(--dsw-alias-label-primary, #e8e8e8); word-break: break-word; min-width: 0; }
      .sbx-glyph { flex: none; width: 14px; height: 14px; margin-top: 1px; color: var(--dsw-alias-label-tertiary, #888); }
      .sbx-glyph-done { color: #389e0d; }
      .sbx-glyph-prog { color: var(--dsw-alias-state-info-primary, #1890ff); }
      @keyframes sbx-progress-spin { to { transform: rotate(360deg); } }
      .sbx-glyph-prog { animation: sbx-progress-spin 1s linear infinite; transform-origin: 50% 50%; }
      @media (prefers-reduced-motion: reduce) { .sbx-glyph-prog { animation: none; } }
      .sbx-call { border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12)); padding: 6px 2px; }
      .sbx-call-head { display: flex; align-items: center; gap: 6px; cursor: pointer; }
      .sbx-call-name { color: var(--dsw-alias-label-primary, #e8e8e8); font-family: var(--dsw-font-mono, monospace); font-size: 11px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
      .sbx-call-co { color: var(--dsw-alias-label-tertiary, #888); font-size: 11px; flex: none; }
      .sbx-call-exp { margin-top: 6px; padding: 6px 8px; background: var(--dsw-fill-l2, rgba(255,255,255,0.05)); border-radius: 6px; white-space: pre-wrap; word-break: break-word; font-family: var(--dsw-font-mono, monospace); font-size: 11px; max-height: 260px; overflow: auto; color: var(--dsw-alias-label-secondary, #bbb); }
      .sbx-call-err { color: var(--dsw-alias-state-error-primary, #ff7875); }
    `);
					const openColumn = () => {
						try {
							layout.openDetails();
						} catch (e) {
							console.error("sbx: openDetails failed", e);
						}
					};
					openColumn();
					const textOf = (blocks) => {
						if (!Array.isArray(blocks)) return "";
						return blocks.filter((b) => b && typeof b === "object" && b.type === "text").map((b) => typeof b.text === "string" ? b.text : "").join("");
					};
					const pretty = (raw) => {
						if (typeof raw !== "string" || raw === "") return raw;
						try {
							return JSON.stringify(JSON.parse(raw), null, 2);
						} catch (e) {
							return raw;
						}
					};
					const glyphIcon = (status) => {
						const cls = status === "completed" ? "sbx-glyph sbx-glyph-done" : status === "in_progress" ? "sbx-glyph sbx-glyph-prog" : "sbx-glyph";
						if (status === "completed") return React.createElement("svg", {
							key: "g" + status,
							viewBox: "0 0 14 14",
							width: 14,
							height: 14,
							className: cls,
							"aria-hidden": true
						}, React.createElement("circle", {
							cx: 7,
							cy: 7,
							r: 6.4,
							stroke: "currentColor",
							strokeWidth: 1.2,
							fill: "none"
						}), React.createElement("path", {
							d: "M10.96 5.71l-3.26 3.27a3.9 3.9 0 01-.55.52c-.2.16-.42.3-.73.35-.16.02-.32.02-.48 0-.3-.05-.53-.19-.73-.35a3.9 3.9 0 01-.61-.57l-1.51-1.51.93-.93 1.51 1.51c.24.24.39.39.5.48.11.08.13.08.11.08 0 .02 0 .05-.02a3.4 3.4 0 01.5-.04l3.26-3.26.93.93z",
							fill: "currentColor"
						}));
						if (status === "in_progress") return React.createElement("svg", {
							key: "g" + status,
							viewBox: "0 0 14 14",
							width: 14,
							height: 14,
							className: cls,
							"aria-hidden": true
						}, React.createElement("circle", {
							cx: 7,
							cy: 7,
							r: 6.4,
							stroke: "currentColor",
							strokeWidth: 1.2,
							fill: "none",
							strokeDasharray: "30 14",
							strokeLinecap: "round"
						}));
						return React.createElement("svg", {
							key: "g" + status,
							viewBox: "0 0 14 14",
							width: 14,
							height: 14,
							className: cls,
							"aria-hidden": true
						}, React.createElement("circle", {
							cx: 7,
							cy: 7,
							r: 6.4,
							stroke: "currentColor",
							strokeWidth: 1.2,
							fill: "none",
							strokeDasharray: "2.4 2.4"
						}));
					};
					const todoRow = (item, idx) => {
						if (!item || typeof item !== "object") return null;
						const status = item.status === "in_progress" || item.status === "completed" ? item.status : "pending";
						return React.createElement("div", {
							key: "t" + idx + "-" + (item.content || ""),
							className: "sbx-todo"
						}, glyphIcon(status), React.createElement("span", { className: "sbx-todo-content" }, item.content || ""));
					};
					function SidebarPanel(props) {
						const { sessionId, useSession, useSessions, useProjection, openSubagent, setCatalogOpen, openDetails } = props;
						const [tab, setTab] = React.useState("agents");
						const [expanded, setExpanded] = React.useState({});
						const autoSeenRef = React.useRef(null);
						const userTouchedRef = React.useRef(null);
						const byId = useSessions((s) => s.byId);
						const catalogs = useSessions((s) => s.subagentsByParent);
						const todosProj = useProjection("todos");
						const nodes = useSession((s) => s.nodes);
						const runningCalls = useSession((s) => s.runningCalls);
						const resolvedMain = (() => {
							if (sessionId === void 0) return void 0;
							let sid = sessionId;
							for (let i = 0; i < 64; i++) {
								const rec = byId[sid];
								if (rec === void 0 || rec.origin !== "subagent") return sid;
								if (rec.parentId === void 0) return sid;
								sid = rec.parentId;
							}
							return sid;
						})();
						const [mainSessionId, setMainSessionId] = React.useState(null);
						React.useEffect(() => {
							if (mainSessionId === null && resolvedMain !== void 0) setMainSessionId(resolvedMain);
						}, [mainSessionId, resolvedMain]);
						const listRootId = mainSessionId ?? resolvedMain;
						React.useEffect(() => {
							try {
								openDetails();
							} catch (e) {
								console.error("sbx: reopen failed", e);
							}
						}, [sessionId]);
						React.useEffect(() => {
							if (autoSeenRef.current === null) autoSeenRef.current = /* @__PURE__ */ new Set();
							if (userTouchedRef.current === null) userTouchedRef.current = /* @__PURE__ */ new Set();
							const idsToExpand = [];
							for (const _parent of Object.keys(catalogs || {})) {
								const cat = catalogs[_parent];
								if (cat && Array.isArray(cat.entries)) {
									for (const entry of cat.entries) if (entry && entry.kind === "child" && entry.hasChildren && !autoSeenRef.current.has(entry.id) && !userTouchedRef.current.has(entry.id)) idsToExpand.push(entry.id);
								}
							}
							if (idsToExpand.length === 0) return;
							for (const id of idsToExpand) autoSeenRef.current.add(id);
							setExpanded((prev) => {
								const next = { ...prev };
								let changed = false;
								for (const id of idsToExpand) if (!next[id]) {
									next[id] = true;
									changed = true;
								}
								return changed ? next : prev;
							});
							for (const id of idsToExpand) try {
								setCatalogOpen(id, true);
							} catch (e) {
								console.error("sbx: setCatalogOpen failed", e);
							}
						}, [catalogs]);
						const toggleExpand = (id, open) => {
							if (userTouchedRef.current === null) userTouchedRef.current = /* @__PURE__ */ new Set();
							userTouchedRef.current.add(id);
							setExpanded((prev) => ({
								...prev,
								[id]: open
							}));
							try {
								setCatalogOpen(id, open);
							} catch (e) {
								console.error("sbx: setCatalogOpen failed", e);
							}
						};
						const renderTree = (parentId, depth) => {
							const cat = catalogs[parentId];
							const entries = [...cat && Array.isArray(cat.entries) ? cat.entries : []].reverse();
							const out = [];
							if (cat && cat.state !== "error" && cat.state !== "ready" && entries.length === 0) {
								out.push(React.createElement("div", {
									key: "load-" + parentId,
									className: "sbx-hint"
								}, "加载子代理…"));
								return out;
							}
							for (const entry of entries) {
								if (!entry || entry.kind !== "child") continue;
								const running = entry.activity === "running";
								const label = entry.label ?? entry.id;
								const isOpen = !!expanded[entry.id];
								const kids = entry.hasChildren && isOpen ? renderTree(entry.id, depth + 1) : [];
								const chevron = entry.hasChildren ? React.createElement("span", {
									key: "chev" + entry.id,
									className: "sbx-chev",
									onClick: (e) => {
										e.stopPropagation();
										toggleExpand(entry.id, !isOpen);
									}
								}, isOpen ? "▾" : "▸") : null;
								out.push(React.createElement("div", {
									key: entry.id,
									className: "sbx-row",
									style: { paddingLeft: 6 + depth * 12 },
									onClick: () => {
										openSubagent({
											parentSessionId: parentId,
											childSessionId: entry.id,
											mode: entry.mode
										});
									}
								}, React.createElement("span", { className: running ? "sbx-dot sbx-dot-run" : "sbx-dot sbx-dot-done" }), React.createElement("span", { className: "sbx-label" }, label), React.createElement("span", { className: "sbx-meta" }, entry.mode === "one-shot" ? "一次性" : "延续", running ? " · 运行中" : ""), chevron));
								for (const k of kids) out.push(k);
							}
							return out;
						};
						const runningList = [];
						for (const call of runningCalls || []) runningList.push({
							callId: call.callId,
							name: call.name,
							argsRaw: call.argsRaw,
							running: true,
							isError: false,
							resultText: ""
						});
						const settledMap = /* @__PURE__ */ new Map();
						let callOrder = 0;
						for (const node of nodes || []) if (node.kind === "assistant") {
							for (const b of node.blocks || []) if (b.kind === "tool-call") {
								const rec = {
									callId: b.callId,
									name: b.name,
									argsRaw: b.argsRaw,
									running: false,
									isError: false,
									resultText: "",
									order: callOrder++
								};
								if (!settledMap.has(b.callId) && !runningList.some((r) => r.callId === b.callId)) settledMap.set(b.callId, rec);
							}
						} else if (node.kind === "tool-result") {
							const rec = {
								callId: node.callId,
								name: node.call ? node.call.name : node.callId,
								argsRaw: node.call ? node.call.argsRaw : null,
								running: false,
								isError: !!node.isError,
								resultText: textOf(node.content),
								order: callOrder++
							};
							settledMap.set(node.callId, rec);
						}
						const settledList = [...settledMap.values()].sort((a, b) => a.order - b.order).slice(-40).reverse();
						const callRows = [...runningList, ...settledList];
						const [openCall, setOpenCall] = React.useState(null);
						const renderCall = (c, idx) => {
							const isOpen = openCall === c.callId;
							const head = React.createElement("div", {
								key: "head" + c.callId,
								className: "sbx-call-head",
								onClick: () => {
									setOpenCall(isOpen ? null : c.callId);
								}
							}, React.createElement("span", { className: c.running ? "sbx-dot sbx-dot-run" : "sbx-dot sbx-dot-done" }), React.createElement("span", { className: "sbx-call-name" }, c.name), React.createElement("span", { className: "sbx-call-co" }, c.running ? "运行中" : c.isError ? "错误" : "完成"));
							const body = isOpen ? React.createElement("div", {
								key: "body" + c.callId,
								className: "sbx-call-exp"
							}, c.argsRaw !== null && c.argsRaw !== void 0 && c.argsRaw !== "" ? React.createElement("div", null, "▸ 参数", React.createElement("div", null, pretty(c.argsRaw))) : null, c.resultText !== "" ? React.createElement("div", {
								key: "res" + c.callId,
								className: c.isError ? "sbx-call-err" : void 0
							}, c.isError ? "▸ 错误: " : "▸ 结果: ", c.resultText) : null, !c.running && c.argsRaw !== null && c.argsRaw !== "" && c.resultText === "" ? React.createElement("div", null, "（结果未注入窗口）") : null) : null;
							return React.createElement("div", {
								key: "c" + idx + "-" + c.callId,
								className: "sbx-call"
							}, head, body);
						};
						const tabsEls = [
							["agents", "Agent 列表"],
							["todo", "To-Do"],
							["calls", "工具详情"]
						].map(([id, label]) => React.createElement("button", {
							key: id,
							type: "button",
							className: id === tab ? "sbx-tab sbx-tab-active" : "sbx-tab",
							onClick: () => {
								setTab(id);
							}
						}, label));
						const header = React.createElement("div", { className: "sbx-tabs" }, tabsEls);
						let body = null;
						if (tab === "agents") {
							const rows = listRootId === void 0 ? [] : renderTree(listRootId, 0);
							if (listRootId === void 0 || rows.length === 0) console.log("sbx: agents empty", {
								sessionId,
								listRootId,
								hasById: listRootId !== void 0 && !!byId[listRootId],
								rootOrigin: listRootId !== void 0 && byId[listRootId] ? byId[listRootId].origin : void 0,
								catState: listRootId !== void 0 && catalogs[listRootId] ? catalogs[listRootId].state : void 0,
								catEntries: listRootId !== void 0 && catalogs[listRootId] ? Array.isArray(catalogs[listRootId].entries) ? catalogs[listRootId].entries.length : "n/a" : void 0
							});
							body = rows.length === 0 ? React.createElement("div", { className: "sbx-empty" }, "主会话暂无子代理。") : rows;
						} else if (tab === "todo") {
							const todoList = todosProj || [];
							body = todoList.length === 0 ? React.createElement("div", { className: "sbx-empty" }, "当前任务没有待办项。") : React.createElement("div", null, React.createElement("div", { className: "sbx-progress" }, "共 " + todoList.length + " 项"), todoList.map(todoRow));
						} else body = callRows.length === 0 ? React.createElement("div", { className: "sbx-empty" }, "会话中暂无工具调用。") : callRows.map(renderCall);
						return React.createElement("div", { className: "sbx-host" }, header, React.createElement("div", { className: "sbx-body" }, body));
					}
					function RestoreButton(props) {
						const { openDetails, closeDetails } = props;
						const [collapsed, setCollapsed] = React.useState(false);
						const ref = React.useRef(null);
						React.useEffect(() => {
							const node = ref.current;
							if (node === null) return void 0;
							const sync = () => {
								const el = node.closest("[data-details-collapsed]");
								setCollapsed(el !== null && el !== void 0);
							};
							sync();
							const observer = new MutationObserver(sync);
							observer.observe(document.documentElement, {
								attributes: true,
								attributeFilter: ["data-details-collapsed"],
								subtree: true
							});
							return () => observer.disconnect();
						}, []);
						const onClick = () => {
							try {
								if (collapsed) openDetails();
								else closeDetails();
							} catch (e) {
								console.error("sbx: toggle failed", e);
							}
						};
						return React.createElement("div", {
							ref,
							className: "sbx-restore",
							title: collapsed ? "展开右侧栏" : "收起侧边栏",
							onClick
						}, collapsed ? "‹" : "›");
					}
					const dispose = slots.inject("details", () => slots.register({
						name: "details",
						priority: -100,
						inject: () => ({
							openSubagent: (addr) => {
								try {
									sessions.openSubagent(addr);
								} catch (e) {
									try {
										sessions.open(addr.childSessionId);
									} catch (e2) {
										console.error("sbx: open subagent failed", e2);
									}
								}
							},
							setCatalogOpen: (id, open) => {
								sessions.setSubagentCatalogOpen(id, open);
							},
							openDetails: () => {
								try {
									layout.openDetails();
								} catch (e) {
									console.error("sbx: openDetails failed", e);
								}
							}
						})
					}, SidebarPanel));
					ctx.on("dispose", dispose);
					const disposeRestore = slots.inject("shell.overlay", () => slots.register({
						name: "shell.overlay",
						id: "agent-sidebar-restore",
						inject: () => ({
							openDetails: () => {
								try {
									layout.openDetails();
								} catch (e) {
									console.error("sbx: openDetails failed", e);
								}
							},
							closeDetails: () => {
								try {
									layout.closeDetails();
								} catch (e) {
									console.error("sbx: closeDetails failed", e);
								}
							}
						})
					}, RestoreButton));
					ctx.on("dispose", disposeRestore);
				}
			};
		}
		if (typeof module !== "undefined" && module.exports) module.exports = factory$1;
		//#endregion
		//#region \0dsh-css:C:\Users\USER\.dsh\plugins\dsh-specify-subagent-suite\src\client\ComposerModelBadge.module.css.mjs
		const css = ".TsjLza_frame{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-height:54px;color:var(--dsw-alias-label-tertiary);border-radius:14px;flex-direction:column;justify-content:center;align-items:center;gap:4px;margin:0 24px 20px;padding:10px 16px;font-size:13px;line-height:20px;display:flex}.TsjLza_frame strong{color:var(--dsw-alias-label-primary);font-weight:510}.TsjLza_line{justify-content:center;align-items:center;gap:8px;display:flex}.TsjLza_meta{background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary));border-radius:999px;padding:1px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px}.TsjLza_preset{background:var(--preset-tone-bg,var(--dsw-alias-bg-layer-2,transparent));color:var(--preset-tone-fg,var(--dsw-alias-label-primary,inherit));border-radius:999px;padding:1px 8px;font-size:12px;font-weight:510;line-height:18px}body[data-ds-dark-theme] .TsjLza_preset{background:var(--preset-tone-bg-dark,var(--dsw-alias-bg-layer-2,transparent));color:var(--preset-tone-fg-dark,var(--dsw-alias-label-primary,inherit))}body:not([data-ds-dark-theme]) .TsjLza_frame,body:not([data-ds-dark-theme]) .TsjLza_meta{color:#000}";
		const tagId = "@zach-tao/dsh-specify-subagent-suite/ComposerModelBadge.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@zach-tao/dsh-specify-subagent-suite";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ComposerModelBadge_module_css_default = {
			"frame": "TsjLza_frame",
			"preset": "TsjLza_preset",
			"line": "TsjLza_line",
			"meta": "TsjLza_meta"
		};
		//#endregion
		//#region src/client/preset-tone.ts
		/** Hand-picked tones for the four shipped presets, ordered by capability. */
		const SHIPPED_TONES = {
			standard: {
				background: "rgba(59, 130, 246, 0.16)",
				foreground: "#1d4ed8",
				backgroundDark: "rgba(96, 165, 250, 0.22)",
				foregroundDark: "#bfdbfe"
			},
			code: {
				background: "rgba(139, 92, 246, 0.18)",
				foreground: "#6d28d9",
				backgroundDark: "rgba(167, 139, 250, 0.24)",
				foregroundDark: "#ddd6fe"
			},
			minimal: {
				background: "rgba(100, 116, 139, 0.16)",
				foreground: "#475569",
				backgroundDark: "rgba(148, 163, 184, 0.20)",
				foregroundDark: "#cbd5e1"
			},
			cordis: {
				background: "rgba(245, 158, 11, 0.18)",
				foreground: "#b45309",
				backgroundDark: "rgba(251, 191, 36, 0.24)",
				foregroundDark: "#fde68a"
			}
		};
		/**
		* Palette for authored presets. Each entry sits at least 30° hue away from
		* every shipped tone (standard ≈ 220, code ≈ 255, minimal ≈ 215, cordis ≈ 40),
		* so a hash into this 6-slot palette never lands an authored id on a swatch
		* that reads as a built-in. Adjacent-array contrast is not claimed —
		* emerald (≈ 155°) and teal (≈ 170°) sit 15° apart, so two authored ids that
		* hash to neighbouring slots can still read as the same hue band; the
		* trade-off for fitting a 6-slot palette outside the four shipped bands.
		* Index by FNV-1a hash of the id.
		*/
		const AUTHOR_PALETTE = [
			{
				background: "rgba(16, 185, 129, 0.16)",
				foreground: "#047857",
				backgroundDark: "rgba(52, 211, 153, 0.20)",
				foregroundDark: "#6ee7b7"
			},
			{
				background: "rgba(244, 114, 182, 0.18)",
				foreground: "#be185d",
				backgroundDark: "rgba(249, 168, 212, 0.22)",
				foregroundDark: "#fbcfe8"
			},
			{
				background: "rgba(20, 184, 166, 0.18)",
				foreground: "#0f766e",
				backgroundDark: "rgba(45, 212, 191, 0.20)",
				foregroundDark: "#99f6e4"
			},
			{
				background: "rgba(132, 204, 22, 0.18)",
				foreground: "#4d7c0f",
				backgroundDark: "rgba(163, 230, 53, 0.22)",
				foregroundDark: "#d9f99d"
			},
			{
				background: "rgba(217, 70, 239, 0.18)",
				foreground: "#a21caf",
				backgroundDark: "rgba(232, 121, 249, 0.22)",
				foregroundDark: "#f5d0fe"
			},
			{
				background: "rgba(239, 68, 68, 0.14)",
				foreground: "#b91c1c",
				backgroundDark: "rgba(248, 113, 113, 0.20)",
				foregroundDark: "#fecaca"
			}
		];
		/** FNV-1a 32-bit hash. Stable, allocation-free, good enough for palette bucketing. */
		function hashId(id) {
			let hash = 2166136261;
			for (let index = 0; index < id.length; index++) {
				hash ^= id.charCodeAt(index);
				hash = Math.imul(hash, 16777619);
			}
			return hash >>> 0;
		}
		/**
		* Resolve the tone for one preset id.
		* @param id - the preset id the chip is rendering.
		* @returns a four-color tone (light + dark bg/fg). Shipped ids map to fixed
		* tones; authored ids land on a hash-stable slot in `AUTHOR_PALETTE`.
		*/
		function presetTone(id) {
			const shipped = SHIPPED_TONES[id];
			if (shipped !== void 0) return shipped;
			const palette = AUTHOR_PALETTE;
			const fallback = palette[0];
			if (fallback === void 0) throw new Error("preset-tone: AUTHOR_PALETTE must be non-empty");
			return palette[hashId(id) % palette.length] ?? fallback;
		}
		/**
		* Serialize a tone as inline CSS custom properties the chip module reads.
		* @param tone - the tone to render.
		* @returns a `style` prop value carrying four custom properties
		* (`--preset-tone-bg`, `--preset-tone-fg`, plus their `-dark` siblings).
		* The CSS module picks the matching variant under
		* `@media (prefers-color-scheme: dark)`.
		*/
		function presetToneStyle(tone) {
			return {
				"--preset-tone-bg": tone.background,
				"--preset-tone-fg": tone.foreground,
				"--preset-tone-bg-dark": tone.backgroundDark,
				"--preset-tone-fg-dark": tone.foregroundDark
			};
		}
		//#endregion
		//#region src/client/index.tsx
		/**
		* One-shot subagent read-only composer badge: shadows the stock read-only
		* banner for one-shot subagent records (chain slot 'conversation.composer',
		* priority -20 — the stock ui-subagent takeover sits at -10, so this
		* entry's selector is elected first) and appends one line of real runtime
		* request provenance: provider/model · reasoningEffort of the latest
		* trajectory request. Reads the live conversation snapshot through the
		* standard useSession hook — zero RPC for the trajectory view; the
		* agent-preset id read from `state.byId[sessionId]?.agentPreset` is
		* localized through a one-shot `api.agentPresets.list` cache kept in
		* module scope and re-read whenever the connection resets, so the badge
		* shows the preset's display name (`高精度审查模式`) instead of its
		* machine id (`high-precision`).
		*
		* Data chain: useSession(snapshot) -> snapshot.views.get('trajectory') ->
		* the LAST purpose === 'assistant' request's .requestConfig
		* (AssistantRequestConfig: provider, model, reasoningEffort?, …). Compaction
		* requests never carry reasoningEffort and would show the wrong provenance,
		* so they are skipped when locating the final generative request. Missing
		* view/request/config simply hides the line — the banner keeps the exact
		* stock copy and styling.
		*/
		/** Dictionary namespace owned by this plugin. */
		const NS = "composerModelBadge";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"readonly.oneShot.title": "一次性子代理记录",
			"readonly.oneShot.body": "一次性任务不支持后续消息，可在这里查看完整执行记录。"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"readonly.oneShot.title": "One-shot subagent record",
			"readonly.oneShot.body": "One-shot tasks do not accept follow-ups; review the full execution record here."
		};
		/**
		* Chain selector: elect this entry exactly when the owner session is a
		* one-shot subagent record. Pure over owner props (see ChainSelect);
		* everything else passes through to the stock composer entries.
		* @param owner - composer chain currency dispatched by the conversation root.
		* @returns the match, or null to decline.
		*/
		function selectModelBadge(owner) {
			const subagent = owner.session?.subagent;
			if (subagent === null || subagent === void 0) return null;
			return subagent.address.mode === "one-shot" ? { reason: "one-shot" } : null;
		}
		/**
		* Module-scope preset display-name cache.
		*
		* One `agentPresets.list` reply maps every preset id to its display name
		* (the `name` field from each preset's `preset.yml` — DSH ships four
		* shipped presets whose names come from a locale table rather than the
		* file, but those ids are all in {standard,code,minimal,cordis} and never
		* become subagent compositions in practice). The render side reads this
		* snapshot through `useSyncExternalStore` so a re-fetch after a connection
		* reset re-renders every open badge in one pass.
		*
		* `Record<string, string>` rather than `Map` so React's `useSyncExternalStore`
		* can hand it straight to its `getSnapshot` (must return a stable reference
		* when nothing changed; we keep the SAME object until a fetch lands).
		*/
		let presetDisplayById = Object.freeze({});
		const presetListeners = /* @__PURE__ */ new Set();
		const subscribe = (listener) => {
			presetListeners.add(listener);
			return () => {
				presetListeners.delete(listener);
			};
		};
		const getSnapshot = () => presetDisplayById;
		/**
		* Read-only composer badge: the stock one-shot banner (same copy, same
		* styling) plus a live runtime provenance line when the trajectory carries a
		* final request config. The runtime line is prefixed with the session's
		* runtime Agent Preset (the template this subagent was dispatched under —
		* e.g. "梁神模式") so the user can tell at a glance which preset produced
		* the recorded model+effort. The preset chip shows the published display
		* name when the roster has loaded it, falling back to the raw id until the
		* fetch lands (or forever, for a preset the host never publishes — same as
		* the stock `AgentPresetLabel` chip).
		* @param props - selector-owned match plus standard slot props (t, useSession, useSessions).
		* @returns the composer replacement.
		*/
		function ComposerModelBadge({ t, useSession, useSessions }) {
			const requestConfig = useSession((snapshot) => {
				const requests = snapshot.views.get("trajectory")?.requests;
				if (requests === void 0) return void 0;
				for (let index = requests.length - 1; index >= 0; index--) {
					const request = requests[index];
					if (request !== void 0 && request.requestConfig !== void 0 && request.purpose === "assistant") return request.requestConfig;
				}
			});
			const sessionId = useSession((snapshot) => snapshot.sessionId);
			const preset = useSessions((state) => state.byId[sessionId]?.agentPreset);
			const presetRoster = (0, react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
			const meta = requestConfig === void 0 ? void 0 : requestConfig.provider + "/" + requestConfig.model + (requestConfig.reasoningEffort ? " · " + requestConfig.reasoningEffort : "");
			const showPreset = preset !== void 0 && preset !== "";
			const presetLabel = showPreset ? presetRoster[preset] ?? preset : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ComposerModelBadge_module_css_default.frame,
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ComposerModelBadge_module_css_default.line,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("readonly.oneShot.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("readonly.oneShot.body") })]
				}), (meta !== void 0 || showPreset) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ComposerModelBadge_module_css_default.line,
					children: [showPreset && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ComposerModelBadge_module_css_default.preset,
						style: presetToneStyle(presetTone(preset)),
						title: "Agent Preset (会话模板)",
						children: presetLabel
					}), meta !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ComposerModelBadge_module_css_default.meta,
						children: meta
					})]
				})]
			});
		}
		/** Required services for the composer slot and its dictionary. */
		const inject$1 = [
			"slots",
			"locale",
			"connection",
			"remote"
		];
		/**
		* Pull the agent-preset roster once and populate the module-scope
		* `presetDisplayById` cache. Re-runs on every `connection/reset` so a new
		* connection generation refreshes the map (a preset authored between
		* generations is then visible to badges mounted before the reset, but those
		* badges already rendered their stale id and will re-render on the next
		* `useSyncExternalStore` notify).
		*
		* The roster is fetched AFTER mount rather than awaited inside `apply()`:
		* the composer chain must register synchronously to win priority -20, and a
		* late-landing roster is harmless because the chip falls back to the raw
		* id until the cache fills.
		*/
		function refreshPresetRoster(ctx) {
			const connection = ctx.get("connection");
			console.debug("[dsh-composer-model-badge] refreshPresetRoster", { hasConnection: connection !== void 0 });
			if (connection === void 0) return;
			connection.api.agentPresets.list({}).then((response) => {
				if (!response.result.ok) {
					console.warn("[dsh-composer-model-badge] agentPresets.list not ok", response.result);
					return;
				}
				const next = {};
				for (const entry of response.result.value.presets) if (entry.trust === "user" && entry.name !== void 0) next[entry.id] = entry.name;
				console.debug("[dsh-composer-model-badge] roster fetched", next);
				presetDisplayById = Object.freeze(next);
				for (const listener of presetListeners) listener();
			}, (error) => {
				console.error("[dsh-composer-model-badge] agentPresets.list threw", error);
			});
		}
		/**
		* Client plugin body: register the badge dictionary and claim the composer
		* chain ahead of the stock one-shot takeover (priority -20 < -10).
		* @param ctx - client root context.
		*/
		function apply$1(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "composer-model-badge: dictionaries");
			ctx.slots.inject("conversation.composer", () => ctx.slots.register({
				name: "conversation.composer",
				priority: -20,
				locale: NS,
				select: selectModelBadge
			}, ComposerModelBadge));
			refreshPresetRoster(ctx);
			ctx.effect(() => {
				const offs = [ctx.on("connection/reset", () => refreshPresetRoster(ctx)), ctx.remote.$on("settings/document-updated", (ns) => {
					if (ns === "agent-presets") refreshPresetRoster(ctx);
				})];
				return () => {
					for (const off of offs) off();
				};
			}, "composer-model-badge: roster refresh on connection reset / preset settings change");
		}
		var client_default = {
			apply: apply$1,
			inject: inject$1,
			ComposerModelBadge,
			selectModelBadge
		};
		//#endregion
		//#region src/client/subctl-panel.js
		function factory(require$1) {
			const React = require$1("react");
			const styles = { insert(cssText) {
				if (typeof document === "undefined") return;
				const tagId = "dsh-specify-subagent-suite/subctl-panel";
				if (document.querySelector("style[data-plugin-css=\"" + tagId + "\"]") !== null) return;
				const el = document.createElement("style");
				el.dataset.plugin = "dsh-specify-subagent-suite";
				el.dataset.pluginCss = tagId;
				el.textContent = cssText;
				(document.head || document.documentElement).appendChild(el);
			} };
			const inject = ["slots", "remote"];
			function apply(ctx) {
				const slots = ctx.slots;
				if (slots === void 0) return;
				styles.insert(`
      .subctl-wrap { position: relative; display: inline-flex; align-items: center; }
      .subctl-button { display: inline-flex; align-items: center; gap: 6px; min-height: 28px; padding: 3px 2px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 12px; line-height: 18px; cursor: pointer; white-space: nowrap; }
      .subctl-button:hover, .subctl-button:focus-visible { color: var(--dsw-alias-label-primary, #f0f0f0); }
      .subctl-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-alias-label-secondary, #b8b8b8)); outline-offset: 2px; }
      .subctl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-success-primary, #4caf50); display: inline-block; flex: none; }
      .subctl-caret { flex: none; display: inline-flex; align-items: center; justify-content: center; color: inherit; transition: transform 120ms ease; }
      .subctl-caret svg { display: block; }
      .subctl-caret-open { transform: rotate(180deg); }
      .subctl-panel-backdrop { position: fixed; inset: 0; z-index: 1040; }
      /* 高度封顶 50vh（dvh 回退写法：支持动态视窗高度的浏览器用 dvh，移动端地址栏收展自适应）；
         宽度 clamp 流式（手机 ~92vw → 桌面 440px 封顶），适配平板/手机。 */
      .subctl-panel { position: absolute; top: calc(100% + 6px); left: 0; z-index: 1100; box-sizing: border-box; width: clamp(300px, 92vw, 440px); max-height: min(50vh, 720px); max-height: min(50dvh, 720px); padding: 10px 6px; display: flex; flex-direction: column; gap: 0; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.5)); border-radius: 12px; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1, #2a2b2e)); box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3); overflow-x: hidden; overflow-y: auto; scrollbar-gutter: stable; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 12px; }
      .subctl-panel::-webkit-scrollbar { width: 8px; }
      .subctl-panel::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2, rgba(128,128,128,0.4)); border-radius: 4px; }
      .subctl-panel::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-border-l2, rgba(128,128,128,0.65)); }
      .subctl-panel::-webkit-scrollbar-track { background: transparent; }
      .subctl-panel { scrollbar-width: thin; scrollbar-color: var(--dsw-alias-border-l2, rgba(128,128,128,0.4)) transparent; }
      .subctl-empty { padding: 10px; color: var(--dsw-alias-label-secondary, #999); font-size: 12px; }
      .subctl-row { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px; border-radius: 8px; min-width: 0; max-width: 100%; box-sizing: border-box; }
      .subctl-row:not(:last-child) { border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08)); padding-bottom: 10px; margin-bottom: 6px; }
      .subctl-row:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); }
      .subctl-row-head { display: flex; flex-direction: column; gap: 4px; min-width: 0; max-width: 100%; padding-right: 0; }
      .subctl-row-title { display: flex; align-items: center; gap: 7px; min-width: 0; max-width: 100%; }
      .subctl-name { font-weight: 600; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 13px; line-height: 20px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .subctl-tag { flex: none; padding: 0 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 18px; }
      .subctl-desc { color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 16px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; overflow-wrap: anywhere; min-width: 0; max-width: 100%; padding-right: 4px; }
      .subctl-selects { display: flex; gap: 12px; min-width: 0; max-width: 100%; width: 100%; box-sizing: border-box; }
      .subctl-select-model { position: relative; flex: 8 1 0; min-width: 0; }
      .subctl-select-effort { position: relative; flex: 5 1 0; min-width: 0; }
      .subctl-select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 5px; width: 100%; max-width: 100%; min-height: 28px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary, #f0f0f0); background: var(--dsw-alias-bg-base, transparent); border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); border-radius: 6px; padding: 4px 9px; cursor: pointer; text-align: left; min-width: 0; box-sizing: border-box; }
      .subctl-select-trigger:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.15)); }
      .subctl-select-trigger.disabled { opacity: 0.4; cursor: not-allowed; }
      .subctl-select-trigger .subctl-placeholder { color: var(--dsw-alias-label-secondary, #999); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .subctl-select-trigger .subctl-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .subctl-arrow { color: var(--dsw-alias-label-secondary, #999); font-size: 9px; flex: none; }
      .subctl-popup { position: fixed; z-index: 1200; box-sizing: border-box; padding: 2px; display: flex; flex-direction: column; border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.5)); border-radius: 7px; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1, #2a2b2e)); box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3); max-height: 320px; overflow-y: auto; }
      .subctl-opt { display: flex; align-items: center; min-height: 26px; padding: 3px 7px; border: none; border-radius: 5px; background: transparent; cursor: pointer; color: var(--dsw-alias-label-primary, #f0f0f0); font-size: 12px; line-height: 18px; text-align: left; white-space: nowrap; }
      .subctl-opt:hover { background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); }
      .subctl-opt.selected { font-weight: 600; background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.18)); }
      .subctl-opt.empty-opt { color: var(--dsw-alias-label-secondary, #999); }
      .subctl-group-label { padding: 4px 7px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary, #999); }
      .subctl-backdrop { position: fixed; inset: 0; z-index: 1100; }
      .subctl-error { color: var(--dsw-alias-state-error-primary, #ff7875); padding: 6px 4px; font-size: 12px; }
      .subctl-meta { color: var(--dsw-alias-label-secondary, #999); padding: 6px 4px; font-size: 12px; }
      .subctl-button.disabled { opacity: 0.4; cursor: not-allowed; }
      .subctl-scopebar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 8px; flex: none; }
      .subctl-scope-btn { padding: 2px 9px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); background: transparent; color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 18px; cursor: pointer; }
      .subctl-scope-btn.active { color: var(--dsw-alias-label-primary, #f0f0f0); background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.18)); font-weight: 600; }
      .subctl-refresh { margin-left: auto; padding: 2px 7px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary, #999); font-size: 11px; line-height: 18px; cursor: pointer; min-width: 36px; box-sizing: border-box; text-align: center; }
      .subctl-refresh:hover { color: var(--dsw-alias-label-primary, #f0f0f0); }
      .subctl-refresh.busy { opacity: 0.6; cursor: progress; }
      .subctl-refresh-icon { display: inline-block; width: 12px; height: 12px; vertical-align: -2px; animation: subctl-spin 0.8s linear infinite; color: currentColor; }
      @media (prefers-reduced-motion: reduce) {
        .subctl-refresh-icon { animation: none; }
      }
      @keyframes subctl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .subctl-layer-tag { flex: none; padding: 0 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.2)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 10px; line-height: 16px; }
      .subctl-broken { color: var(--dsw-alias-state-error-primary, #ff7875); font-size: 11px; line-height: 16px; padding: 2px 0; }
      .subctl-busy-note { margin: 2px 6px 6px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.4)); background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12)); color: var(--dsw-alias-label-secondary, #b8b8b8); font-size: 11px; line-height: 16px; }
    `);
				const call = (wire) => async (args) => {
					const response = await fetch("/subagent-controller/rpc", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							method: wire,
							args: args === void 0 ? {} : args
						})
					});
					if (!response.ok) throw new Error("subctl RPC " + wire + " failed: HTTP " + response.status);
					const result = await response.json();
					if (result === null || typeof result !== "object" || result.ok !== true) {
						const message = result !== null && typeof result === "object" && typeof result.message === "string" ? result.message : "";
						throw new Error(message || "subctl RPC " + wire + " failed");
					}
					return result.value;
				};
				ctx.provide("remote.subagentTemplateControl", {
					listTemplates: call("list-templates"),
					listTemplateConfigs: call("list-template-configs"),
					getTemplateConfig: call("get-template-config"),
					applyTemplateConfig: call("apply-template-config"),
					listModels: call("list-models"),
					resolveEfforts: call("resolve-efforts"),
					getPanelState: call("get-panel-state")
				});
				const remote = ctx.remote.subagentTemplateControl;
				const ChevronDownIcon = React.createElement("svg", {
					width: 14,
					height: 14,
					viewBox: "0 0 14 14",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg"
				}, React.createElement("path", {
					d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
					fill: "currentColor"
				}));
				const Caret = (props) => React.createElement("span", { className: "subctl-caret" + (props.open ? " subctl-caret-open" : "") }, ChevronDownIcon);
				function MiniSelect(props) {
					const { value, placeholder, groups, onChange, disabled, disabledReason, widthClass, closeSignal } = props;
					const [open, setOpen] = React.useState(false);
					const [rect, setRect] = React.useState(null);
					const selectedLabel = React.useMemo(() => {
						if (value === "" || value === void 0 || value === null) return null;
						let found = null;
						for (const group of groups || []) for (const option of group.options || []) if (option.value === value) found = option.label;
						return found;
					}, [value, groups]);
					React.useEffect(() => {
						if (closeSignal === true && open) setOpen(false);
					}, [closeSignal]);
					if (disabled) return React.createElement("div", { className: widthClass || "subctl-select-model" }, React.createElement("div", {
						className: "subctl-select-trigger disabled",
						title: typeof disabledReason === "string" && disabledReason !== "" ? disabledReason : void 0
					}, selectedLabel === null ? React.createElement("span", { className: "subctl-placeholder" }, placeholder) : React.createElement("span", { className: "subctl-value" }, selectedLabel)));
					const openAt = (event) => {
						const node = event.currentTarget;
						if (node && typeof node.getBoundingClientRect === "function") setRect(node.getBoundingClientRect());
						setOpen(true);
					};
					const optionViews = (groups || []).map((group) => {
						return [group.label ? React.createElement("div", {
							key: "h:" + group.label,
							className: "subctl-group-label"
						}, group.label) : null, (group.options || []).map((option) => {
							const isSelected = option.value === value;
							return React.createElement("div", {
								key: option.value,
								className: "subctl-opt" + (isSelected ? " selected" : "") + (option.value === "" ? " empty-opt" : ""),
								onClick: () => {
									onChange(option.value);
									setOpen(false);
								}
							}, option.label);
						})];
					});
					const popupStyle = rect === null ? {
						left: 0,
						top: 0,
						visibility: "hidden"
					} : {
						left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)) + "px",
						top: Math.min(rect.bottom + 3, window.innerHeight - 40) + "px",
						minWidth: "280px",
						maxWidth: "460px"
					};
					return React.createElement("div", { className: widthClass || "subctl-select-model" }, open ? React.createElement("div", {
						className: "subctl-backdrop",
						onClick: () => setOpen(false)
					}) : null, React.createElement("div", {
						className: "subctl-select-trigger",
						onClick: (event) => {
							if (open) setOpen(false);
							else openAt(event);
						}
					}, selectedLabel === null ? React.createElement("span", { className: "subctl-placeholder" }, placeholder) : React.createElement("span", { className: "subctl-value" }, selectedLabel), React.createElement("span", { className: "subctl-arrow" }, open ? "▲" : "▼")), open && rect !== null ? React.createElement("div", {
						className: "subctl-popup",
						style: popupStyle
					}, optionViews) : null);
				}
				function TemplateController(props) {
					const propSessionId = props !== void 0 && typeof props.sessionId === "string" ? props.sessionId : "";
					const useSessionsFn = props !== void 0 && typeof props.useSessions === "function" ? props.useSessions : null;
					const readSessionRow = () => {
						try {
							return useSessionsFn !== null ? useSessionsFn((s) => propSessionId !== "" && s !== null && typeof s === "object" && s.byId && s.byId[propSessionId] ? s.byId[propSessionId] : void 0) : void 0;
						} catch (err) {
							console.error("subctl: useSessions read failed", err);
							return;
						}
					};
					const sessionRow = readSessionRow();
					const presetRaw = sessionRow !== void 0 && typeof sessionRow.agentPreset === "string" ? sessionRow.agentPreset : void 0;
					const currentPreset = typeof presetRaw === "string" ? presetRaw : "";
					const isSubagentView = sessionRow !== void 0 && sessionRow.origin === "subagent";
					const [open, setOpen] = React.useState(false);
					const [scope, setScope] = React.useState("global");
					const [data, setData] = React.useState(null);
					const [efforts, setEfforts] = React.useState({});
					const effortsRef = React.useRef({});
					const [busy, setBusy] = React.useState(false);
					const [error, setError] = React.useState(null);
					const [sessionBusy, setSessionBusy] = React.useState(false);
					const epochRef = React.useRef(0);
					const refresh = React.useCallback(async () => {
						const myEpoch = ++epochRef.current;
						setBusy(true);
						setError(null);
						try {
							const [templates, models, configs] = await Promise.all([
								remote.listTemplates(),
								remote.listModels(),
								remote.listTemplateConfigs()
							]);
							const hostConfigs = configs && typeof configs === "object" && configs.global && typeof configs.global === "object" ? configs : {
								global: configs && typeof configs === "object" ? configs : {},
								sessions: {}
							};
							const tpls = Array.isArray(templates) ? templates : [];
							const sessionLayer = hostConfigs.sessions && typeof hostConfigs.sessions === "object" && propSessionId !== "" ? hostConfigs.sessions[propSessionId] : void 0;
							const effCfg = (t) => scope === "session" ? sessionLayer && sessionLayer[t.id] || hostConfigs.global[t.id] : hostConfigs.global[t.id];
							for (const t of tpls) {
								const cfg = effCfg(t);
								if (cfg && typeof cfg.provider === "string" && cfg.provider !== "" && typeof cfg.model === "string" && cfg.model !== "") {
									const modelKey = cfg.provider + "/" + cfg.model;
									if (effortsRef.current[modelKey] !== void 0) continue;
									remote.resolveEfforts({
										provider: cfg.provider,
										model: cfg.model
									}).then((res) => {
										effortsRef.current[modelKey] = true;
										setEfforts((prev) => ({
											...prev,
											[modelKey]: res
										}));
									}).catch(() => {});
								}
							}
							if (epochRef.current !== myEpoch) return;
							setData({
								templates: tpls,
								models: Array.isArray(models) ? models : [],
								configs: hostConfigs
							});
							if (propSessionId !== "" && hostConfigs.busySessions && typeof hostConfigs.busySessions === "object") setSessionBusy(hostConfigs.busySessions[propSessionId] === true);
						} catch (err) {
							if (epochRef.current !== myEpoch) return;
							setError(String(err && err.message ? err.message : err));
						} finally {
							if (epochRef.current === myEpoch) setBusy(false);
						}
					}, [propSessionId, scope]);
					React.useEffect(() => {
						if (open) refresh();
					}, [open, refresh]);
					React.useEffect(() => {
						if (!open || propSessionId === "") return void 0;
						let cancelled = false;
						const poll = async () => {
							try {
								const st = await remote.getPanelState({ editorSessionId: propSessionId });
								if (!cancelled && st !== null && typeof st === "object") setSessionBusy(st.busy === true);
							} catch {}
						};
						poll();
						const h = setInterval(poll, 1e3);
						return () => {
							cancelled = true;
							clearInterval(h);
						};
					}, [open, propSessionId]);
					if (isSubagentView) return React.createElement("div", { className: "subctl-wrap" }, React.createElement("button", {
						className: "subctl-button disabled",
						disabled: true,
						title: "子Agent模板仅在主会话中可用；当前页面是子 Agent 执行流。"
					}, React.createElement("span", { className: "subctl-dot" }), React.createElement("span", null, "子Agent模板"), React.createElement(Caret, { open: false })));
					if (!open) return React.createElement("div", { className: "subctl-wrap" }, React.createElement("button", {
						className: "subctl-button",
						onClick: () => setOpen(true)
					}, React.createElement("span", { className: "subctl-dot" }), React.createElement("span", null, "子Agent模板"), React.createElement(Caret, { open: false })));
					const sessionLayer = data !== null && data.configs.sessions && typeof data.configs.sessions === "object" && propSessionId !== "" ? data.configs.sessions[propSessionId] : void 0;
					const templateConfig = (id) => {
						if (data === null) return {};
						if (scope === "session" && sessionLayer && sessionLayer[id]) return sessionLayer[id];
						if (data.configs.global && data.configs.global[id]) return data.configs.global[id];
						return {};
					};
					const layerOfTemplate = (id) => scope === "session" && sessionLayer && sessionLayer[id] ? "session" : "global";
					const scopeArgs = scope === "session" ? {
						scope: "session",
						sessionId: propSessionId
					} : { scope: "global" };
					const setLocalConfig = (templateId, patch) => {
						setData((prev) => {
							if (prev === null) return prev;
							const layer = scope === "session" && prev.configs.sessions && prev.configs.sessions[propSessionId] ? prev.configs.sessions[propSessionId] : scope === "session" ? {} : prev.configs.global;
							const merged = {
								...layer && layer[templateId] || {},
								...patch
							};
							const clean = {};
							if (merged.provider !== void 0 && merged.provider !== "") clean.provider = merged.provider;
							if (merged.model !== void 0 && merged.model !== "") clean.model = merged.model;
							if (merged.effort !== void 0 && merged.effort !== "") clean.effort = merged.effort;
							if (scope === "session") {
								const sessions = {
									...prev.configs.sessions,
									[propSessionId]: {
										...layer,
										[templateId]: clean
									}
								};
								return {
									...prev,
									configs: {
										...prev.configs,
										sessions
									}
								};
							}
							return {
								...prev,
								configs: {
									...prev.configs,
									global: {
										...prev.configs.global,
										[templateId]: clean
									}
								}
							};
						});
					};
					const changeModel = (template, value) => {
						if (sessionBusy || value === "") return;
						const slash = value.indexOf("/");
						if (slash === -1) return;
						const provider = value.slice(0, slash);
						const model = value.slice(slash + 1);
						setLocalConfig(template.id, {
							provider,
							model,
							effort: ""
						});
						remote.applyTemplateConfig({
							...scopeArgs,
							editorSessionId: propSessionId,
							presetId: template.id,
							provider,
							model,
							effort: ""
						}).then((res) => {
							if (res && res.ok === false && res.message) setError(res.message);
						}).catch((err) => setError(String(err && err.message ? err.message : err)));
						const modelKey = provider + "/" + model;
						if (effortsRef.current[modelKey] !== void 0) return;
						remote.resolveEfforts({
							provider,
							model
						}).then((res) => {
							effortsRef.current[modelKey] = true;
							setEfforts((prev) => ({
								...prev,
								[modelKey]: res
							}));
						}).catch((err) => {
							setEfforts((prev) => ({
								...prev,
								[modelKey]: {
									efforts: [],
									defaultEffort: void 0
								}
							}));
							setError("解析强度档位失败: " + String(err && err.message ? err.message : err));
						});
					};
					const changeEffort = (template, value) => {
						if (sessionBusy) return;
						setLocalConfig(template.id, { effort: value });
						remote.applyTemplateConfig({
							...scopeArgs,
							editorSessionId: propSessionId,
							presetId: template.id,
							effort: value
						}).then((res) => {
							if (res && res.ok === false && res.message) setError(res.message);
						}).catch((err) => setError(String(err && err.message ? err.message : err)));
					};
					const clearOverride = (template) => {
						if (busy || sessionBusy) return;
						setBusy(true);
						setError(null);
						remote.applyTemplateConfig({
							...scopeArgs,
							editorSessionId: propSessionId,
							presetId: template.id,
							clear: true
						}).then((res) => {
							if (res && res.ok === false && res.message) setError(res.message);
							return refresh();
						}).catch((err) => {
							setError(String(err && err.message ? err.message : err));
							setBusy(false);
						});
					};
					const templates = data !== null ? data.templates || [] : [];
					const rowViews = templates.map((template) => {
						const config = templateConfig(template.id);
						const currentModel = config.provider && config.model ? config.provider + "/" + config.model : "";
						const isLocked = currentPreset !== "" && template.id === currentPreset;
						const lockReason = isLocked ? "当前会话正在使用该模板对应的 preset（" + currentPreset + "）。模板覆盖只影响以此 preset 派发的子 Agent，不影响本会话。" : void 0;
						const effortInfo = efforts[config.provider && config.model ? config.provider + "/" + config.model : ""];
						const modelGroups = busy ? [] : (data !== null ? data.models || [] : []).map((providerEntry) => ({
							label: providerEntry.name || providerEntry.provider,
							options: (providerEntry.models || []).map((m) => ({
								value: providerEntry.provider + "/" + m.id,
								label: (m.name || m.id) + " (" + providerEntry.provider + ")"
							}))
						}));
						const effortGroups = busy ? [{
							label: null,
							options: [{
								value: "",
								label: "— 默认强度 —"
							}]
						}] : [{
							label: null,
							options: [{
								value: "",
								label: "— 默认强度 —"
							}, ...(effortInfo ? effortInfo.efforts : []).map((entry) => ({
								value: entry.id,
								label: entry.name || entry.id
							}))]
						}];
						const desc = template.description || "";
						const isBroken = typeof template.broken === "string" && template.broken !== "";
						const rowDisabled = isBroken;
						const rowDisabledReason = isBroken ? "该模板的 composition 已损坏，无法挂载：" + template.broken : void 0;
						const layer = layerOfTemplate(template.id);
						const hasValue = currentModel !== "" || (config.effort || "") !== "";
						return React.createElement("div", {
							key: template.id,
							className: "subctl-row"
						}, React.createElement("div", { className: "subctl-row-head" }, React.createElement("div", { className: "subctl-row-title" }, React.createElement("span", { className: "subctl-name" }, template.name || template.id), template.trust ? React.createElement("span", { className: "subctl-tag" }, template.trust) : null, hasValue && scope === "session" ? React.createElement("span", { className: "subctl-layer-tag" }, layer === "session" ? "本会话" : "全局回落") : null, isLocked ? React.createElement("span", {
							className: "subctl-tag",
							title: lockReason
						}, "当前会话") : null), desc ? React.createElement("div", { className: "subctl-desc" }, desc) : null, isBroken ? React.createElement("div", { className: "subctl-broken" }, template.broken) : null), React.createElement("div", { className: "subctl-selects" }, React.createElement(MiniSelect, {
							value: currentModel,
							placeholder: "— 继承默认模型 —",
							groups: modelGroups,
							disabled: rowDisabled || busy || sessionBusy,
							disabledReason: sessionBusy ? "会话执行中（主 agent 或子 agent 在途），子Agent模板已无效化；执行完毕后自动恢复。" : rowDisabledReason !== void 0 ? rowDisabledReason : busy ? "模型列表刷新中…" : void 0,
							closeSignal: busy || sessionBusy,
							onChange: (value) => changeModel(template, value),
							widthClass: "subctl-select-model"
						}), React.createElement(MiniSelect, {
							value: config.effort || "",
							placeholder: "— 默认强度 —",
							groups: effortGroups,
							disabled: rowDisabled || currentModel === "" || busy || sessionBusy,
							disabledReason: sessionBusy ? "会话执行中（主 agent 或子 agent 在途），子Agent模板已无效化；执行完毕后自动恢复。" : rowDisabledReason !== void 0 ? rowDisabledReason : busy ? "模型列表刷新中…" : isLocked ? lockReason : void 0,
							closeSignal: busy || sessionBusy,
							onChange: (value) => changeEffort(template, value),
							widthClass: "subctl-select-effort"
						})), hasValue && scope === "session" && layer === "session" ? React.createElement("div", { className: "subctl-selects" }, React.createElement("button", {
							className: "subctl-refresh" + (busy || sessionBusy ? " busy" : ""),
							disabled: busy || sessionBusy,
							"aria-busy": busy || sessionBusy,
							onClick: () => clearOverride(template)
						}, "× 清除本会话覆盖")) : null);
					});
					return React.createElement("div", { className: "subctl-wrap" }, React.createElement("div", {
						className: "subctl-panel-backdrop",
						onClick: () => setOpen(false)
					}), React.createElement("button", {
						className: "subctl-button",
						onClick: () => setOpen(false)
					}, React.createElement("span", { className: "subctl-dot" }), React.createElement("span", null, "子Agent模板"), React.createElement(Caret, { open: true })), React.createElement("div", { className: "subctl-panel" }, React.createElement("div", { className: "subctl-scopebar" }, React.createElement("button", {
						className: "subctl-scope-btn" + (scope === "global" ? " active" : ""),
						disabled: sessionBusy,
						title: sessionBusy ? "会话执行中，子Agent模板已无效化" : void 0,
						onClick: () => setScope("global")
					}, "全局默认"), React.createElement("button", {
						className: "subctl-scope-btn" + (scope === "session" ? " active" : ""),
						disabled: propSessionId === "" || sessionBusy,
						title: propSessionId === "" ? "无当前会话 id，无法使用会话级配置" : sessionBusy ? "会话执行中，子Agent模板已无效化" : "仅影响当前会话派发的子 Agent",
						onClick: () => setScope("session")
					}, "仅本会话"), React.createElement("button", {
						className: "subctl-refresh" + (busy || sessionBusy ? " busy" : ""),
						disabled: busy || sessionBusy,
						"aria-busy": busy || sessionBusy,
						title: busy ? "刷新中" : sessionBusy ? "会话执行中，子Agent模板已无效化" : "重新加载列表与模型",
						onClick: () => refresh()
					}, busy ? React.createElement("svg", {
						className: "subctl-refresh-icon",
						role: "img",
						"aria-label": "刷新中",
						viewBox: "0 0 12 12",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg"
					}, React.createElement("path", {
						d: "M6 1a5 5 0 0 1 5 5h-1.5a3.5 3.5 0 0 0-3.5-3.5V1zM6 11a5 5 0 0 1-5-5h1.5a3.5 3.5 0 0 0 3.5 3.5V11z",
						fill: "currentColor"
					})) : "刷新")), sessionBusy ? React.createElement("div", { className: "subctl-busy-note" }, "会话执行中（主 agent 或子 agent 在途），子Agent模板已无效化；执行完毕后自动恢复。") : null, error !== null ? React.createElement("div", { className: "subctl-error" }, error) : null, busy && data === null ? React.createElement("div", { className: "subctl-meta" }, "加载中…") : null, data !== null && templates.length === 0 && !busy && error === null ? React.createElement("div", { className: "subctl-empty" }, "暂无自定义子 Agent 模板") : null, rowViews));
				}
				slots.inject("conversation.session.header.actions", () => slots.register({
					name: "conversation.session.header.actions",
					id: "subagent-controller",
					order: 26,
					label: "子Agent模板"
				}, (props) => React.createElement(TemplateController, props)));
			}
			return {
				inject,
				apply
			};
		}
		if (typeof module !== "undefined" && module.exports) module.exports = factory;
		//#endregion
		//#region src/index.js
		const inject = [
			"slots",
			"sessions",
			"layout",
			"locale",
			"connection",
			"remote"
		];
		function apply(ctx) {
			factory$1(require).apply(ctx);
			client_default.apply(ctx);
			factory(require).apply(ctx);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
