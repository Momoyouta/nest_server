const now = Math.floor(Date.now() / 1000);
console.log('Current Epoch:', now);
const ct = 1775706479;
const ttl = 3600;
console.log('Code ends at:', ct + ttl);
console.log('Remaining:', ct + ttl - now);
