export interface OfflinePotholeReport {
    id: string;
    title: string;
    description: string;
    severity: number;
    latitude: number;
    longitude: number;
    locationSource: 'GPS' | 'MANUAL_ADJUSTMENT';
    locationAccuracy?: number | null;
    captureTimestamp: string;
    imageUrl?: string;
    createdAt: string;
}

const DB_NAME = 'PotholeMapOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_reports';

function openOfflineDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB is not supported in this environment'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveOfflineReport(report: Omit<OfflinePotholeReport, 'id' | 'createdAt'>): Promise<OfflinePotholeReport> {
    const db = await openOfflineDB();
    const offlineReport: OfflinePotholeReport = {
        ...report,
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(offlineReport);

        request.onsuccess = () => resolve(offlineReport);
        request.onerror = () => reject(request.error);
    });
}

export async function getOfflineReports(): Promise<OfflinePotholeReport[]> {
    try {
        const db = await openOfflineDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return [];
    }
}

export async function deleteOfflineReport(id: string): Promise<void> {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function syncOfflineReports(): Promise<{ syncedCount: number; errors: number }> {
    if (typeof window === 'undefined' || !navigator.onLine) {
        return { syncedCount: 0, errors: 0 };
    }

    const reports = await getOfflineReports();
    if (reports.length === 0) {
        return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    for (const report of reports) {
        try {
            const payload = {
                title: report.title,
                description: report.description,
                severity: report.severity,
                latitude: report.latitude,
                longitude: report.longitude,
                locationSource: report.locationSource,
                locationAccuracy: report.locationAccuracy,
                captureTimestamp: report.captureTimestamp,
                imageUrl: report.imageUrl,
            };

            const res = await fetch('/api/potholes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await deleteOfflineReport(report.id);
                syncedCount++;
            } else {
                errors++;
            }
        } catch {
            errors++;
        }
    }

    return { syncedCount, errors };
}
