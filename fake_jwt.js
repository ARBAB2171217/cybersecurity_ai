const header = Buffer.from(JSON.stringify({alg: "HS256", typ: "JWT"})).toString('base64');
const payload = Buffer.from(JSON.stringify({role: "CITIZEN", exp: 9999999999})).toString('base64');
console.log(`${header}.${payload}.signature`);
