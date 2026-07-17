const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
    // 1. Get a test token
    let token;
    try {
        const res = await axios.post('http://localhost:8000/api/v1/auth/login/user', {
            email: 'citizen@cybershield.in',
            password: 'SecurePassword123!'
        });
        token = res.data.data.access_token;
    } catch(e) {
        console.log("Login failed, skipping upload test");
        return;
    }

    // 2. Prepare file
    fs.writeFileSync('test.png', 'fake image content');
    const fd = new FormData();
    fd.append('file', fs.createReadStream('test.png'));
    fd.append('denomination', '500');

    // 3. Test with explicit json header (THIS SHOULD FAIL with 422!)
    try {
        await axios.post('http://localhost:8000/api/v1/scanner/scan', fd, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch(e) {
        console.log("JSON Header Test Failed with:", e.response ? e.response.status : e.message);
    }

    // 4. Test with explicit multipart header (THIS SHOULD SUCCEED past the 422 stage, might hit 400 because fake image)
    try {
        await axios.post('http://localhost:8000/api/v1/scanner/scan', fd, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...fd.getHeaders()
            }
        });
        console.log("Multipart upload succeeded!");
    } catch(e) {
        console.log("Multipart Header Test Failed with:", e.response ? e.response.status : e.message);
    }
}
run();
