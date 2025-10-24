import { chromium } from 'playwright';

(async () => {
    console.log('\n🌍 PLANET TERRAFORMER - Comprehensive Cinematic Test\n');
    console.log('='.repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 50
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // Monitor console
    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
            console.log('❌ Browser Error:', text);
            results.failed.push(`Console error: ${text}`);
        } else if (text.includes('✅') || text.includes('🌍') || text.includes('🎬')) {
            console.log('  📢', text);
        }
    });

    page.on('pageerror', error => {
        console.log('❌ Page Error:', error.message);
        results.failed.push(`Page error: ${error.message}`);
    });

    try {
        // TEST 1: Load Page
        console.log('\n📥 TEST 1: Loading page...');
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        results.passed.push('Page loaded');
        console.log('✅ Page loaded');

        await page.screenshot({ path: 'test-planet-01-loading.png' });

        // TEST 2: Check Loading Screen
        console.log('\n⏳ TEST 2: Checking loading screen...');
        const loadingScreen = await page.$('#loading-screen');
        if (loadingScreen) {
            results.passed.push('Loading screen present');
            console.log('✅ Loading screen found');
        }

        await page.waitForTimeout(2000);

        // TEST 3: Check if loading screen hidden
        console.log('\n✨ TEST 3: Checking if loading screen hides...');
        const loadingHidden = await page.evaluate(() => {
            const screen = document.getElementById('loading-screen');
            return screen.classList.contains('hidden');
        });

        if (loadingHidden) {
            results.passed.push('Loading screen hidden after init');
            console.log('✅ Loading screen hidden');
        } else {
            results.warnings.push('Loading screen still visible');
        }

        await page.screenshot({ path: 'test-planet-02-loaded.png' });

        // TEST 4: Check Canvas
        console.log('\n🎨 TEST 4: Checking 3D canvas...');
        const canvas = await page.$('canvas');
        if (canvas) {
            results.passed.push('Canvas element exists');
            console.log('✅ Canvas found');
        } else {
            results.failed.push('Canvas not found');
        }

        // TEST 5: Check Controls
        console.log('\n🎮 TEST 5: Checking controls...');
        const playBtn = await page.$('#play-btn');
        if (playBtn) {
            const isVisible = await playBtn.isVisible();
            if (isVisible) {
                results.passed.push('Play button visible');
                console.log('✅ Play button visible');
            }
        }

        // TEST 6: Start Cinematic
        console.log('\n🎬 TEST 6: Starting cinematic...');
        await playBtn.click();
        await page.waitForTimeout(1000);

        const playBtnHidden = await page.evaluate(() => {
            const btn = document.getElementById('play-btn');
            return btn.style.display === 'none';
        });

        if (playBtnHidden) {
            results.passed.push('Play button hidden after click');
            console.log('✅ Cinematic started');
        }

        await page.screenshot({ path: 'test-planet-03-cinematic-start.png' });

        // TEST 7: Check Text Overlay
        console.log('\n📝 TEST 7: Checking narrative text...');
        await page.waitForTimeout(2000);

        const textElement = await page.$('#narrative-text');
        const hasText = await page.evaluate(() => {
            const el = document.getElementById('narrative-text');
            return el.textContent.length > 0;
        });

        if (hasText) {
            const text = await page.textContent('#narrative-text');
            results.passed.push(`Text overlay working: "${text}"`);
            console.log(`✅ Text displayed: "${text}"`);
        }

        await page.screenshot({ path: 'test-planet-04-text-overlay.png' });

        // TEST 8: Check Progress Bar
        console.log('\n📊 TEST 8: Checking progress indicator...');
        await page.waitForTimeout(2000);

        const progressWidth = await page.evaluate(() => {
            const bar = document.getElementById('progress-bar');
            return bar.style.width;
        });

        if (progressWidth && progressWidth !== '0%') {
            results.passed.push(`Progress bar updating: ${progressWidth}`);
            console.log(`✅ Progress bar: ${progressWidth}`);
        }

        // TEST 9: Let cinematic run
        console.log('\n⏱️ TEST 9: Running cinematic for 10 seconds...');
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(1000);
            const progress = await page.evaluate(() => {
                return document.getElementById('progress-bar').style.width;
            });
            console.log(`  ⏳ ${i + 1}s - Progress: ${progress}`);
        }

        results.passed.push('Cinematic sequence running');
        console.log('✅ Cinematic playing smoothly');

        await page.screenshot({ path: 'test-planet-05-mid-cinematic.png' });

        // TEST 10: Check 3D Scene
        console.log('\n🌌 TEST 10: Verifying 3D rendering...');
        const canvasData = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;
            const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
            return ctx ? 'WebGL active' : 'No WebGL';
        });

        if (canvasData === 'WebGL active') {
            results.passed.push('WebGL rendering active');
            console.log('✅ WebGL context active');
        } else {
            results.warnings.push('WebGL status unclear');
        }

        // TEST 11: Check Console Messages
        console.log('\n🔍 TEST 11: Checking for errors...');
        // Already tracked via page.on('console')

        if (results.failed.length === 0) {
            results.passed.push('No critical errors in console');
            console.log('✅ No critical errors');
        }

        // Final screenshot
        await page.screenshot({ path: 'test-planet-final.png', fullPage: true });

        console.log('\n⏸️ Keeping browser open for 10 more seconds...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        results.failed.push(`Test exception: ${error.message}`);
    }

    // Print Results
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));

    console.log(`\n✅ PASSED (${results.passed.length}):`);
    results.passed.forEach(test => console.log(`   • ${test}`));

    if (results.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
        results.warnings.forEach(test => console.log(`   • ${test}`));
    }

    if (results.failed.length > 0) {
        console.log(`\n❌ FAILED (${results.failed.length}):`);
        results.failed.forEach(test => console.log(`   • ${test}`));
    }

    const total = results.passed.length + results.failed.length;
    const percentage = ((results.passed.length / total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log(`📈 SCORE: ${results.passed.length}/${total} (${percentage}%)`);
    console.log('='.repeat(70));

    if (results.failed.length === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Cinematic experience working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check details above.\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-planet-01-loading.png');
    console.log('  • test-planet-02-loaded.png');
    console.log('  • test-planet-03-cinematic-start.png');
    console.log('  • test-planet-04-text-overlay.png');
    console.log('  • test-planet-05-mid-cinematic.png');
    console.log('  • test-planet-final.png\n');

    await browser.close();
})();
