import { db } from '@/src/lib/db';

export async function findUserById(id: string) {
    return db.user.findUnique({
        where: { id },
    });
}

export async function findUserByEmail(email: string) {
    return db.user.findUnique({
        where: { email },
    });
}

export async function banUser(id: string) {
    return db.user.update({
        where: { id },
        data: { banned: true },
    });
}

export async function unbanUser(id: string) {
    return db.user.update({
        where: { id },
        data: { banned: false },
    });
}

export async function updateRole(id: string, role: 'USER' | 'ADMIN') {
    return db.user.update({
        where: { id },
        data: { role },
    });
}