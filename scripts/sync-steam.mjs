// ============================================================
// scripts/sync-steam.mjs · 从 Steam 拉取游戏数据，写进 data/steam.json
// 由 GitHub Action 每天跑一次（.github/workflows/sync-steam.yml），也可以本地手动跑：
//   STEAM_API_KEY=你的key STEAM_ID=你的SteamID64 node scripts/sync-steam.mjs
// 需要：Steam 个人资料和「游戏详情」都设为公开
// 不想显示的游戏：把 appid 写进 data/steam.config.json 的 hide
// ============================================================

import { readFile, writeFile } from 'node:fs/promises';

const KEY = process.env.STEAM_API_KEY;
// STEAM_ID 可以填 17 位的 SteamID64，也可以直接填 Steam 里的「好友代码」（一串较短的数字），这里自动换算
const RAW_ID = (process.env.STEAM_ID || '').trim();
const ID = /^\d{1,10}$/.test(RAW_ID) ? (BigInt(RAW_ID) + 76561197960265728n).toString() : RAW_ID;
if (ID !== RAW_ID) console.log('STEAM_ID 填的是好友代码，已自动换算成 SteamID64');
// 诊断信息（不打印密钥本身）
console.log(`STEAM_API_KEY：${KEY ? `已设置（${KEY.length} 位）` : '没有设置'}`);
console.log(`STEAM_ID：${ID ? `已设置（${ID.length} 位${/^7656\d{13}$/.test(ID) ? '，格式正确' : '，格式不对：应该是 7656 开头的 17 位数字'}）` : '没有设置'}`);
if (!KEY || !ID) { console.error('✗ 缺少 STEAM_API_KEY 或 STEAM_ID：请在仓库 Settings → Secrets and variables → Actions → Repository secrets 里添加，名字要完全一样'); process.exit(1); }
if (KEY.length !== 32) console.warn('⚠ Steam API Key 一般是 32 位，请检查有没有多复制空格或少复制字符');

const cfg = JSON.parse(await readFile('data/steam.config.json', 'utf8').catch(() => '{}'));
const hide = new Set((cfg.hide || []).map(Number));
const TOP = cfg.top ?? 12;

const api = async (path, params) => {
  const u = new URL(`https://api.steampowered.com/${path}`);
  Object.entries({ key: KEY, steamid: ID, format: 'json', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (r.status === 401 || r.status === 403) throw new Error(`${path} → HTTP ${r.status}：API Key 无效，或这个 SteamID 的资料不公开`);
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
  return r.json();
};

const hours = (min) => Math.round((min / 60) * 10) / 10;
const img = (id) => ({
  cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`,
  header: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
});

const [player, owned, recent] = await Promise.all([
  api('ISteamUser/GetPlayerSummaries/v2/', { steamids: ID }),
  api('IPlayerService/GetOwnedGames/v1/', { include_appinfo: 1, include_played_free_games: 1 }),
  api('IPlayerService/GetRecentlyPlayedGames/v1/', { count: 0 }),   // 0 = 最近两周玩过的全部
]);

const p = player.response?.players?.[0];
const games = (owned.response?.games || []).filter((g) => !hide.has(g.appid));
if (!games.length) console.warn('没有拿到游戏列表：请确认 Steam「游戏详情」设为公开');
const ownedIds = new Set(games.map((g) => g.appid));
const today = new Date().toISOString().slice(0, 10);

const recentList = (recent.response?.games || []).filter((g) => !hide.has(g.appid)).map((g) => ({
  appid: g.appid, name: g.name, hours2w: hours(g.playtime_2weeks || 0), hours: hours(g.playtime_forever || 0),
  ...(ownedIds.has(g.appid) ? {} : { family: true }), ...img(g.appid),
}));

/* 家庭库的游戏：Steam 的「拥有的游戏」接口不会返回它们，只有「最近两周玩过」里有。
   所以每天把最近玩过、又不在自己库里的游戏记进 family 历史里（时长取见过的最大值），越攒越全。
   以前玩过、最近没碰的家庭库游戏，可以手动写进 data/steam.config.json 的 family。 */
const prevData = JSON.parse(await readFile('data/steam.json', 'utf8').catch(() => '{}'));
const family = new Map();
for (const g of prevData._sample ? [] : prevData.family || []) family.set(g.appid, g);
for (const g of cfg.family || []) {
  const id = Number(g.appid); if (!id || hide.has(id) || ownedIds.has(id)) continue;
  const old = family.get(id);
  family.set(id, { appid: id, name: g.name || old?.name || `App ${id}`, hours: Math.max(Number(g.hours) || 0, old?.hours || 0), last: old?.last || null, manual: true });
}
for (const g of recentList) {
  if (!g.family) continue;
  const old = family.get(g.appid);
  family.set(g.appid, { appid: g.appid, name: g.name, hours: Math.max(g.hours, old?.hours || 0), last: today });
}
for (const id of hide) family.delete(id);
const familyList = [...family.values()].sort((a, b) => b.hours - a.hours);

const all = [
  ...games.filter((g) => g.playtime_forever > 0).map((g) => ({
    appid: g.appid, name: g.name, hours: hours(g.playtime_forever),
    last: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString().slice(0, 10) : null,
  })),
  ...familyList.filter((g) => g.hours > 0).map((g) => ({ appid: g.appid, name: g.name, hours: g.hours, last: g.last, family: true })),
];
const top = all.sort((a, b) => b.hours - a.hours).slice(0, TOP).map((g) => ({ ...g, ...img(g.appid) }));

const out = {
  updated: new Date().toISOString(),
  profile: p ? { name: p.personaname, url: p.profileurl, avatar: p.avatarfull } : null,
  stats: {
    owned: games.length,
    family: familyList.length,
    played: all.length,
    hours: Math.round(all.reduce((s, g) => s + g.hours, 0)),
    hours2w: Math.round(recentList.reduce((s, g) => s + g.hours2w, 0) * 10) / 10,
  },
  recent: recentList,
  top,
  family: familyList,
};

// 内容没变就不写（避免每天一次空提交）
const prev = await readFile('data/steam.json', 'utf8').catch(() => '');
const strip = (s) => s.replace(/"updated":\s*"[^"]*",?/, '');
const next = JSON.stringify(out, null, 2) + '\n';
if (prev && strip(prev) === strip(next)) { console.log('Steam 数据没有变化'); process.exit(0); }
await writeFile('data/steam.json', next);
console.log(`已更新：最近在玩 ${recentList.length} 款，最常玩 ${top.length} 款；自己的库 ${out.stats.owned} 款，家庭库记录了 ${out.stats.family} 款`);
