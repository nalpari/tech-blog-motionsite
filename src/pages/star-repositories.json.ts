import { getPosts } from '../posts';

export async function GET() {
	const posts = await getPosts();
	return Response.json([...new Set(posts.flatMap(({ data }) => data.repository ? [data.repository] : []))]);
}
