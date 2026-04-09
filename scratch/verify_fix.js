const { encryptInvitation, decryptInvitation } = require('../src/common/utils/invite.util');

const testData = {
  type: 1,
  school_id: 'school_123',
  college_id: 'college_456',
  grade: '2024',
  creater_id: 'user_789',
  create_time: '1234567890',
  ttl: 3600
};

const code = encryptInvitation(testData);
console.log('Generated Code:', code);
const decrypted = decryptInvitation(code);
console.log('Decrypted Data:', decrypted);

if (decrypted.college_id === testData.college_id) {
  console.log('Verification Success: college_id preserved.');
} else {
  console.log('Verification Failed: college_id lost!');
  console.log('Actual decrypted:', decrypted);
}
