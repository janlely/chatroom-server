const cookieSignature = require('cookie-signature');

// 获取命令行参数
const [, , cookieSecret, cookieValue] = process.argv;

if (!cookieSecret || !cookieValue) {
  console.log('Usage: node sign-cookie.js <secret> <cookie-value>');
  process.exit(1);
}

const signedCookie = cookieSignature.sign(cookieValue, cookieSecret);
console.log(signedCookie);
