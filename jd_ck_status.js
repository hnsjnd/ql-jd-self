/*
京东 CK 状态检测

cron: 10 8 * * *
*/

const https = require('https');

function loadNotify() {
  const paths = ['./sendNotify', '../sendNotify', '/ql/data/scripts/sendNotify', '/ql/scripts/sendNotify'];
  for (const p of paths) {
    try {
      return require(p);
    } catch (e) {}
  }
  return {
    sendNotify: async (title, content) => {
      console.log('[notify-fallback]', title);
      console.log(content);
    },
  };
}

const notify = loadNotify();

function getCookies() {
  const raw = process.env.JD_COOKIE || '';
  return raw
    .split(/[\n&]/)
    .map((s) => s.trim())
    .filter((s) => s.includes('pt_key=') && s.includes('pt_pin='));
}

function pinOf(cookie) {
  const m = cookie.match(/pt_pin=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'unknown';
}

function requestUser(cookie) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'me-api.jd.com',
        path: '/user_new/info/GetJDUserInfoUnion',
        method: 'GET',
        headers: {
          Cookie: cookie,
          Referer: 'https://home.m.jd.com/myJd/newhome.action',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        },
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ parseError: true, raw: data.slice(0, 200) });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ netError: String(err) }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ netError: 'timeout' });
    });
    req.end();
  });
}

(async () => {
  const cookies = getCookies();
  console.log(`检测开始，共 ${cookies.length} 个 JD_COOKIE`);
  if (!cookies.length) {
    const msg = '未找到 JD_COOKIE。请在青龙环境变量里添加。';
    console.log(msg);
    await notify.sendNotify('CK检测', msg);
    return;
  }

  const lines = [];
  let dead = 0;

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const pin = pinOf(cookie);
    const info = await requestUser(cookie);
    let status = '异常';
    let nick = pin;

    if (info && info.netError) {
      status = `网络失败: ${info.netError}`;
    } else if (info && info.retcode === '0' && info.data && info.data.userInfo) {
      status = '正常';
      nick = info.data.userInfo.baseInfo.nickname || pin;
    } else if (info && (info.retcode === '13' || info.retcode === '1001')) {
      status = '已掉线';
      dead += 1;
    } else {
      status = `未知(${(info && info.retcode) || 'no-code'})`;
      dead += 1;
    }

    const line = `账号${i + 1} ${nick} [${pin}] 状态: ${status}`;
    console.log(line);
    lines.push(line);
  }

  const title = dead ? `CK检测: ${dead} 个异常` : 'CK检测: 全部正常';
  await notify.sendNotify(title, lines.join('\n'));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
