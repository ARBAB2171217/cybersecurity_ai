import psycopg2, jwt, datetime, requests

conn = psycopg2.connect(dbname='currency_detection', user='arbab', password='ArbabPostgres2026', host='db', port=5432)
cursor = conn.cursor()
cursor.execute('SELECT id FROM users WHERE is_verified = true LIMIT 1;')
user_id = cursor.fetchone()[0]
token = jwt.encode({'sub': str(user_id), 'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1), 'iat': datetime.datetime.now(datetime.timezone.utc), 'type': 'access', 'role': 'user'}, '44a8fb3a921d74659b8c3df192b027c95a043c5bcfbfce1fe24e0f523c921389', algorithm='HS256')

# create dummy image
with open('dummy.png', 'wb') as f:
    f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')

files = {'file': ('dummy.png', open('dummy.png', 'rb'), 'image/png')}
headers = {'Authorization': f'Bearer {token}'}
res = requests.post('http://localhost:8000/api/v1/scanner/scan', files=files, headers=headers)
print('SCAN POST:', res.status_code, res.text)
if res.status_code == 200:
    report_id = res.json()['data']['report_id']
    get_res = requests.get(f'http://localhost:8000/api/v1/detection/{report_id}', headers=headers)
    print('GET REPORT:', get_res.status_code, get_res.text[:300])
