import { db } from '../../src/lib/db';

export async function getOrCreateTestUser() {
    let actor = await db.user.findFirst();
    if (!actor) {
        actor = await db.user.create({
            data: {
                name: 'Integration Test Runner',
                email: `ci-runner-${Date.now()}@potholemap.test`,
                role: 'USER',
            },
        });
    }
    return actor;
}
