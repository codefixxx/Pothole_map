import { formatRelativeTime, normalizeName, getValidDomains, cn } from '../../src/lib/utils';

export async function runUtilsUnitTests() {
    console.log('--- [UNIT TEST] General Helper Utilities ---');

    // 1. Name normalization test
    const rawName = "  john  o'connor-smith  123  ";
    const normalized = normalizeName(rawName);
    if (normalized === "John O'connor-smith") {
        console.log('  ✅ normalizeName formatting: PASSED');
    } else {
        console.error(`❌ normalizeName formatting failed. Expected "John O'connor-smith", got "${normalized}"`);
        return false;
    }

    // 2. Relative time formatting
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);
    const twoMinutesAgo = new Date(now.getTime() - 120 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400 * 1000);

    const relJustNow = formatRelativeTime(tenSecondsAgo);
    const relMin = formatRelativeTime(twoMinutesAgo);
    const relHour = formatRelativeTime(threeHoursAgo);
    const relDay = formatRelativeTime(fiveDaysAgo);

    if (relJustNow === 'Just now' && relMin === '2m ago' && relHour === '3h ago' && relDay === '5d ago') {
        console.log('  ✅ formatRelativeTime relative date display: PASSED');
    } else {
        console.error('❌ formatRelativeTime failed:', { relJustNow, relMin, relHour, relDay });
        return false;
    }

    // 3. Class merging utility (cn)
    const combinedClass = cn('px-2 py-1', 'bg-red-500', { 'text-white': true, 'hidden': false });
    if (combinedClass.includes('px-2') && combinedClass.includes('bg-red-500') && combinedClass.includes('text-white')) {
        console.log('  ✅ cn Tailwind class merger: PASSED');
    } else {
        console.error('❌ cn class merger failed:', combinedClass);
        return false;
    }

    console.log('✅ Utils Unit Suite: ALL TESTS PASSED');
    return true;
}
