const http = require('http');
const { internalIpV4 } = require('internal-ip');

async function scan() {
  const ip = await internalIpV4();
  if (!ip) {
    console.log('No internal IP found');
    return;
  }
  
  const baseIp = ip.split('.').slice(0, 3).join('.');
  console.log('Scanning subnet:', baseIp + '.x');
  
  const promises = [];
  
  for (let i = 1; i < 255; i++) {
    const targetIp = `${baseIp}.${i}`;
    const p = new Promise(resolve => {
        const req = http.get(`http://${targetIp}:8001/api/v2/`, { timeout: 1500 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const info = JSON.parse(data);
                    if (info && info.device && info.device.type === 'Samsung SmartTV') {
                        resolve({ ip: targetIp, info: info.device });
                    } else {
                        resolve(null);
                    }
                } catch(e) { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
    promises.push(p);
  }
  
  console.log('Waiting for responses (max 2s)...');
  const results = await Promise.all(promises);
  const tvs = results.filter(r => r !== null);
  
  if (tvs.length > 0) {
      console.log('--- FOUND TVs ---');
      tvs.forEach(t => console.log(`- ${t.info.name} (${t.ip})`));
  } else {
      console.log('No TVs found on port 8001. You might want to try port 8002.');
  }
}

scan();
