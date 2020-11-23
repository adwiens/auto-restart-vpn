const axios = require('axios');
const { promisify } = require('util');
const { exec } = require('child_process');

const numRetries = 3;
const baseTimeout = 1000;
const url = 'https://jira.lamresearch.com';
const pm2ScriptName = 'connect-lam-vpn';

setTimeout(() => {
  console.log('quitting after 59s');
  process.exit();
}, 59000); // run for < 1 minute since crontab runs this script every minute

const execPromise = promisify(exec);
const timeoutPromise = async (ms) => await new Promise(resolve => setTimeout(() => resolve(), ms));

async function execAndPrint(cmd) {
  const { stderr, stdout } = await execPromise(cmd);
  console.log(stdout);
  if (stderr && stderr.length > 0) {
    console.error(stderr);
  }
}

(async () => {
  await execAndPrint('pm2 status'); // print status first
  while (true) {
    for (let ctr = 1; ctr <= numRetries; ctr++) {
      try {
        console.log(`trying to reach ${url}...`);
        await axios({ url, timeout: 5 * baseTimeout });
        console.log(`success`);
        break;
      } catch (e) {
        console.log(`failed attempt ${ctr}`);
        if (ctr < numRetries) {
          await timeoutPromise(baseTimeout);
        } else {
          const cmd = `pm2 restart ${pm2ScriptName}`;
          console.log(`failed to reach ${url}. running "${cmd}"...`);
          await execAndPrint(cmd);
        }
      }
    }
    await timeoutPromise(5 * baseTimeout);
  }
})();
