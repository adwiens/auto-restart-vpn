const axios = require('axios');
const { promisify } = require('util');
const { exec } = require('child_process');

const numRetries = 3;
const baseTimeout = 1000;
const url = 'https://jira.lamresearch.com';
const pm2ScriptName = 'connect-lam-vpn';

setTimeout(() => process.exit(), 59000); // run for 1 minute max

const execPromise = promisify(exec);
const timeoutPromise = async (ms) => await new Promise(resolve => setTimeout(() => resolve(), ms));

(async () => {
  while (true) {
    let success = false;
    for (let ctr = 1; !success && ctr <= numRetries; ctr++) {
      try {
        console.log(`trying to reach ${url}...`);
        await axios({ url, timeout: 5 * baseTimeout });
        console.log(`success`);
        success = true;
      } catch (e) {
        console.log(`failed attempt ${ctr}`);
        await timeoutPromise(ctr * baseTimeout);
      }
    }
    if (!success) {
      const cmd = `pm2 restart ${pm2ScriptName}`;
      console.log(`failed to reach ${url}. running "${cmd}"...`);
      const { stderr, stdout } = await execPromise(cmd);
      console.log(stdout);
      if (stderr && stderr.length > 0) {
        console.error(stderr);
      }
    }
    await timeoutPromise(5 * baseTimeout);
  }
})();
