// 블로그 이름·설명은 여기 한 곳에서 바꾼다.
export const SITE = {
	name: 'RUNTIME',
	org: 'Engineering',
	description: '우리 팀이 실제로 운영하며 배운 것들. 장애 회고, 설계 결정, 그리고 그 사이의 트레이드오프를 기록합니다.',
};

export const CATEGORIES: Record<string, string> = {
	infra: 'Infra',
	frontend: 'Frontend',
	data: 'Data',
	platform: 'Platform',
	security: 'Security',
};

// 한글 기준 분당 약 500자
export const readingMinutes = (body = '') => Math.max(1, Math.round(body.replace(/\s+/g, '').length / 500));

export const formatDate = (d: Date) =>
	d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.\s?/g, '.').replace(/\.$/, '');
