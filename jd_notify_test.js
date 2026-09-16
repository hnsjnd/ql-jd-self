/*
 new Env('通知渠道测试');
 cron: 5 9 * * *
 */

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

(async () => {
  const when = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const msg = '青龙通知测试成功\n时间: ' + when;
  console.log(msg);
  await notify.sendNotify('青龙通知测试', msg);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
