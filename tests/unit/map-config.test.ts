import { MAP_STYLES, STATUS_COLORS, DEFAULT_MAP_CENTER } from '../../src/lib/map-config';

export async function runMapConfigUnitTests() {
    console.log('--- [UNIT TEST] Map Configuration & Status Color Design Tokens ---');

    // 1. Default Center Coordinates
    if (DEFAULT_MAP_CENTER.length === 2 && DEFAULT_MAP_CENTER[0] === 77.209 && DEFAULT_MAP_CENTER[1] === 28.6139) {
        console.log('  ✅ Default Center Coordinates (New Delhi [lng, lat]): PASSED');
    } else {
        console.error('❌ Default Center Coordinates: FAILED', DEFAULT_MAP_CENTER);
        return false;
    }

    // 2. Map Styles Object
    if (MAP_STYLES.light && MAP_STYLES.dark && MAP_STYLES.light.sources['osm-tiles']) {
        console.log('  ✅ Light & Dark Map Style Spec Configuration: PASSED');
    } else {
        console.error('❌ Map Style Configuration: FAILED');
        return false;
    }

    // 3. Status Color Palette Mappings
    const requiredStatuses = ['PENDING', 'VERIFIED', 'ONGOING', 'FIXED', 'REJECTED'];
    const allStatusesValid = requiredStatuses.every(
        (status) => STATUS_COLORS[status] && STATUS_COLORS[status].hex && STATUS_COLORS[status].bg
    );

    if (allStatusesValid) {
        console.log('  ✅ Design System Status Badge Palette Mapping: PASSED');
    } else {
        console.error('❌ Status Badge Mapping: FAILED');
        return false;
    }

    console.log('✅ Map Config Unit Suite: ALL TESTS PASSED');
    return true;
}
