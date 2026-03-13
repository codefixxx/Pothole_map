import { db } from '@/src/lib/db';

const words = [
    'road',
    'lane',
    'path',
    'bridge',
    'signal',
    'pothole',
    'crater',
    'patch',
    'pit',
    'bump',
    'fixer',
    'mapper',
    'scout',
    'tracker',
    'patrol',
];

function pick(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 5); // 3 chars e.g. "k3x"
}

export async function generateUniqueUsername(name: string): Promise<string> {
    const base = name
        .toLowerCase()
        .split(' ')[0]
        .replace(/[^a-z]/g, '')
        .slice(0, 6); // shorter base too

    let username = `${base}_${pick(words)}_${randomSuffix()}`;
    let attempts = 0;

    while (attempts < 10) {
        const existing = await db.user.findUnique({ where: { username } });
        if (!existing) break;
        username = `${base}_${pick(words)}_${randomSuffix()}`;
        attempts++;
    }

    return username;
}
