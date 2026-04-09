const crypto = require('crypto');

const fieldMap = {
  type: 't',
  school_id: 's',
  grade: 'g',
  class_id: 'cl',
  course_id: 'co',
  teaching_group_id: 'tg',
  creater_id: 'cr',
  create_time: 'ct',
  ttl: 'ttl',
  college_id: 'ci', // The fix
};

const reverseFieldMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k]),
);

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = Buffer.from('a_very_secure_default_32_char_ke');
const IV_LENGTH = 16;

function encryptInvitation(data) {
  const compactData = {};
  for (const key in data) {
    if (data[key] !== undefined && fieldMap[key]) {
      compactData[fieldMap[key]] = data[key];
    }
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(compactData), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return (iv.toString('base64') + ':' + encrypted).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decryptInvitation(code) {
  const normalizedCode = code.replace(/-/g, '+').replace(/_/g, '/');
  const parts = normalizedCode.split(':');
  const iv = Buffer.from(parts[0], 'base64');
  const encryptedText = Buffer.from(parts[1], 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  const compactData = JSON.parse(decrypted);
  const originalData = {};
  for (const key in compactData) {
    if (reverseFieldMap[key]) {
      originalData[reverseFieldMap[key]] = compactData[key];
    }
  }
  return originalData;
}

const testData = {
  type: 1,
  school_id: 'school_123',
  college_id: 'college_456',
  grade: '2024',
};

const code = encryptInvitation(testData);
console.log('Generated Code:', code);
const decrypted = decryptInvitation(code);
console.log('Decrypted Data:', decrypted);

if (decrypted.college_id === testData.college_id) {
  console.log('Verification Success: college_id preserved.');
} else {
  console.log('Verification Failed: college_id lost!');
  process.exit(1);
}
