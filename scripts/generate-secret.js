const crypto = require('crypto');

// Generate a secure random string for JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT_SECRET:');
console.log(jwtSecret);
console.log('\nGenerated NEXTAUTH_SECRET:');
console.log(nextAuthSecret);
console.log('\nAdd these to your .env.local file:');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);
