// astro dev 에서만 /_upload 페이지를 연다. 정적 빌드(dist)에는 아무것도 남기지 않는다.
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();
// RFC 3986: encodeURIComponent 가 남기는 !'()* 까지 인코딩
const encodeKey = (key) =>
	key.split('/').map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())).join('/');

// S3 PutObject, SigV4 서명. If-None-Match: * 로 같은 키가 있으면 S3 가 412 로 거절한다(덮어쓰기 금지).
async function putObject({ region, bucket, accessKeyId, secretAccessKey }, key, body, contentType) {
	const host = `${bucket}.s3.${region}.amazonaws.com`;
	const path = '/' + encodeKey(key);
	const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
	const date = amzDate.slice(0, 8);
	const payloadHash = sha256(body);
	// 서명 헤더는 이름순이어야 한다
	const headers = { 'content-type': contentType, host, 'if-none-match': '*', 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
	const signedHeaders = Object.keys(headers).join(';');
	const canonical = ['PUT', path, '', ...Object.entries(headers).map(([k, v]) => `${k}:${v}`), '', signedHeaders, payloadHash].join('\n');
	const scope = `${date}/${region}/s3/aws4_request`;
	const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
	const kSigning = ['s3', 'aws4_request'].reduce(hmac, hmac(hmac('AWS4' + secretAccessKey, date), region));
	const signature = createHmac('sha256', kSigning).update(toSign).digest('hex');
	const url = `https://${host}${path}`;
	const res = await fetch(url, {
		method: 'PUT',
		headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` },
		body,
	});
	return { url, res };
}

const readBody = async (req) => {
	const chunks = [];
	for await (const c of req) chunks.push(c);
	return Buffer.concat(chunks);
};

const json = (res, status, data) => {
	res.statusCode = status;
	res.setHeader('content-type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(data));
};

export default function s3Upload() {
	return {
		name: 's3-upload',
		hooks: {
			'astro:server:setup': ({ server, logger }) => {
				// 셸 환경 변수보다 파일 값을 쓰고, 서버 재시작마다 다시 읽도록 process.env 에 넣지 않는다
				const envPath = join(server.config.root, '.env.local');
				if (!existsSync(envPath)) return logger.warn('.env.local 이 없어 /_upload 를 열지 않습니다');
				const env = parseEnv(readFileSync(envPath, 'utf8'));
				const cfg = { region: env.AWS_REGION, bucket: env.S3_BUCKET, accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY };
				const prefix = (env.S3_COVER_PREFIX ?? '').replace(/^\/+|\/+$/g, '');

				server.middlewares.use('/_upload', async (req, res) => {
					if (req.method === 'GET') {
						res.setHeader('content-type', 'text/html; charset=utf-8');
						return res.end(PAGE.replace('{{TARGET}}', `s3://${cfg.bucket}/${prefix}/`));
					}
					if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });
					try {
						const type = req.headers['content-type'] ?? '';
						if (!type.startsWith('image/')) return json(res, 400, { error: '이미지 파일만 올릴 수 있습니다' });
						const name = decodeURIComponent(String(req.headers['x-filename'] ?? '')).normalize('NFC').trim().replace(/\s+/g, '-').replace(/[^\w.\-가-힣]/g, '');
						if (!name || name.startsWith('.')) return json(res, 400, { error: '파일 이름이 올바르지 않습니다' });
						const key = prefix ? `${prefix}/${name}` : name;
						const put = await putObject(cfg, key, await readBody(req), type);
						// 412: 이미 있음, 409: 같은 키에 동시 쓰기
						if (put.res.status === 412 || put.res.status === 409) return json(res, 409, { error: `이미 같은 이름의 파일이 있습니다: ${name}` });
						if (!put.res.ok) return json(res, 502, { error: `S3 ${put.res.status}: ${(await put.res.text()).slice(0, 300)}` });
						json(res, 200, { url: put.url });
					} catch (e) {
						json(res, 500, { error: e.message });
					}
				});
				logger.info('S3 업로드 페이지: /_upload');
			},
		},
	};
}

const PAGE = /* html */ `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>이미지 업로드</title>
<style>
	:root { --bg: #060607; --fg: #f2f2f2; --muted: #8a8a8f; --line: #26262b; --accent: #ff5b1f; --ok: #3ecf8e; --err: #ff6b6b; }
	* { box-sizing: border-box; }
	body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, -apple-system, sans-serif; }
	main { max-width: 760px; margin: 0 auto; padding: 48px 16px; }
	h1 { font-size: 24px; margin: 0 0 4px; }
	.target { color: var(--muted); font: 14px ui-monospace, monospace; margin: 0 0 24px; }
	label.drop { display: block; border: 1.5px dashed var(--line); border-radius: 14px; padding: 40px 16px; text-align: center; cursor: pointer; color: var(--muted); }
	label.drop:hover, label.drop.over { border-color: var(--accent); color: var(--fg); }
	label.drop:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
	input[type=file] { position: absolute; opacity: 0; width: 1px; height: 1px; }
	ul { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 12px; }
	li { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 12px; align-items: center; border: 1px solid var(--line); border-radius: 12px; padding: 10px; }
	li img { width: 72px; height: 54px; object-fit: cover; border-radius: 8px; background: #111; }
	.name { font-size: 14px; color: var(--muted); overflow-wrap: anywhere; }
	.row { display: flex; gap: 8px; margin-top: 4px; }
	.row input { flex: 1; min-width: 0; background: #0e0e10; color: var(--fg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font: 13px ui-monospace, monospace; }
	button { background: var(--accent); color: #000; border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 600; cursor: pointer; }
	button:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
	.status { font-size: 14px; margin-top: 4px; }
	.status.err { color: var(--err); } .status.ok { color: var(--ok); }
</style>
</head>
<body>
<main>
	<h1>이미지 업로드</h1>
	<p class="target">{{TARGET}}</p>
	<label class="drop" id="drop">
		<input type="file" id="file" accept="image/*" multiple />
		이미지를 끌어다 놓거나 클릭해서 고르세요
	</label>
	<ul id="list"></ul>
</main>
<script>
	const list = document.getElementById('list');
	const drop = document.getElementById('drop');
	const input = document.getElementById('file');

	async function upload(file) {
		const li = document.createElement('li');
		li.innerHTML = '<img alt="" /><div><div class="name"></div><div class="status">업로드 중…</div></div>';
		li.querySelector('img').src = URL.createObjectURL(file);
		li.querySelector('.name').textContent = file.name;
		list.prepend(li);
		const status = li.querySelector('.status');
		try {
			const res = await fetch('/_upload', { method: 'POST', headers: { 'content-type': file.type, 'x-filename': encodeURIComponent(file.name) }, body: file });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			status.outerHTML = '<div class="row"><input readonly aria-label="이미지 URL" /><button type="button">복사</button></div>';
			const field = li.querySelector('.row input');
			const btn = li.querySelector('.row button');
			field.value = data.url;
			field.addEventListener('focus', () => field.select());
			btn.addEventListener('click', async () => {
				await navigator.clipboard.writeText(data.url);
				btn.textContent = '복사됨';
				setTimeout(() => (btn.textContent = '복사'), 1500);
			});
		} catch (e) {
			status.className = 'status err';
			status.textContent = e.message;
		}
	}

	const handle = (files) => [...files].filter((f) => f.type.startsWith('image/')).forEach(upload);
	input.addEventListener('change', () => { handle(input.files); input.value = ''; });
	drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
	drop.addEventListener('dragleave', () => drop.classList.remove('over'));
	drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); handle(e.dataTransfer.files); });
</script>
</body>
</html>`;
