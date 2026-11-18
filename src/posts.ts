import { getCollection } from 'astro:content';

// 초안은 프로덕션 빌드에서만 제외하고, dev에서는 미리보기를 위해 보여준다.
export const getPosts = async () =>
	(await getCollection('posts', ({ data }) => !import.meta.env.PROD || !data.draft))
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
