import { get, put } from '@vercel/blob';

const day = 86_400_000;
const dateAt = (time) => new Date(time).toISOString().slice(0, 10);
const pathFor = (date) => `repository-stars/${date}.json`;

async function collect(date, origin) {
	const response = await fetch(new URL('/star-repositories.json', origin), { signal: AbortSignal.timeout(8_000) });
	if (!response.ok) throw new Error('저장소 목록을 읽을 수 없습니다.');
	const repositories = await response.json();
	const results = await Promise.allSettled(repositories.map(async (repository) => {
		const response = await fetch(`https://api.github.com/repos/${repository}/stargazers/count`, {
			headers: { 'X-GitHub-Api-Version': '2026-03-10' },
			signal: AbortSignal.timeout(8_000),
		});
		if (!response.ok) throw new Error(`${repository}: ${response.status}`);
		const { count } = await response.json();
		if (!Number.isSafeInteger(count) || count < 0) throw new Error(`${repository}: 유효하지 않은 스타 수`);
		return [repository, count];
	}));
	const counts = Object.fromEntries(results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []));
	if (!Object.keys(counts).length && repositories.length) throw new Error('스타 수를 수집하지 못했습니다.');

	// 같은 날 실행이 겹쳐도 최초로 기록한 저장소별 값을 보존한다.
	const previous = await get(pathFor(date), { access: 'private', useCache: false });
	const stored = previous ? await new Response(previous.stream).json() : {};
	await put(pathFor(date), JSON.stringify({ ...counts, ...stored }), {
		access: 'private',
		contentType: 'application/json',
		ttlDays: 10,
		...(previous && { ifMatch: previous.blob.etag }),
	});
	const missing = repositories.filter((repository) => !Object.hasOwn(counts, repository) && !Object.hasOwn(stored, repository));
	return Response.json({ collected: Object.keys(counts).length, missing }, { status: missing.length ? 502 : 200 });
}

export async function GET(request) {
	const url = new URL(request.url);
	const now = Date.now();
	try {
		if (url.searchParams.has('collect')) {
			const secret = process.env.CRON_SECRET;
			if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
				return new Response(null, { status: 401 });
			}
			const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
			return await collect(dateAt(now), host ? `https://${host}` : url.origin);
		}

		const dates = Array.from({ length: 9 }, (_, index) => dateAt(now - (8 - index) * day));
		const snapshots = await Promise.all(dates.map(async (date) => {
			const blob = await get(pathFor(date), { access: 'private' });
			return { date, counts: blob ? await new Response(blob.stream).json() : {} };
		}));
		return Response.json(snapshots, {
			headers: { 'Cache-Control': 'public, max-age=60, s-maxage=900' },
		});
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 503 });
	}
}
