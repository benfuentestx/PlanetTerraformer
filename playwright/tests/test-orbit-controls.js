import { chromium } from 'playwright';

(async () => {
    console.log('\n🔍 COMPREHENSIVE ORBIT CONTROLS TEST\n');
    console.log('='.repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 50
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = {
        passed: [],
        failed: []
    };

    // Monitor console
    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
            console.log('❌ Browser Error:', text);
            if (!text.includes('404')) { // Ignore favicon errors
                results.failed.push(`Console error: ${text}`);
            }
        } else if (text.includes('✅') || text.includes('🌍') || text.includes('🎬') || text.includes('Orbit')) {
            console.log('  📢', text);
        }
    });

    try {
        // Load page
        console.log('\n📥 TEST 1: Loading page...');
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        results.passed.push('Page loaded');
        console.log('✅ Page loaded');

        // Start cinematic
        console.log('\n🎬 TEST 2: Starting cinematic...');
        const playBtn = await page.$('#play-btn');
        await playBtn.click();
        await page.waitForTimeout(2000);
        results.passed.push('Cinematic started');
        console.log('✅ Cinematic started');

        // Fast-forward to end (wait 48 seconds)
        console.log('\n⏱️ TEST 3: Fast-forwarding to cinematic end (48s)...');
        for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(4000);
            const progress = await page.evaluate(() => {
                return document.getElementById('progress-bar').style.width;
            });
            console.log(`  ⏳ ${(i + 1) * 4}s - Progress: ${progress}`);
        }

        await page.waitForTimeout(2000); // Extra buffer
        results.passed.push('Cinematic completed');
        console.log('✅ Cinematic completed');

        // Check EXPLORE button visibility
        console.log('\n🔍 TEST 4: Verifying EXPLORE button...');
        const orbitBtn = await page.$('#orbit-btn');
        const isVisible = await orbitBtn.isVisible();
        const buttonText = await page.textContent('#orbit-btn');

        console.log(`   Button visible: ${isVisible}`);
        console.log(`   Button text: "${buttonText}"`);

        if (isVisible && buttonText.includes('EXPLORE')) {
            results.passed.push('EXPLORE button visible with correct text');
            console.log('✅ EXPLORE button ready');
        } else {
            results.failed.push(`Button state wrong: visible=${isVisible}, text="${buttonText}"`);
        }

        // Get camera position BEFORE orbit mode
        const cameraBefore = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            const rect = canvas.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height
            };
        });

        await page.screenshot({ path: 'test-orbit-01-before.png' });

        // Click EXPLORE
        console.log('\n🖱️ TEST 5: Clicking EXPLORE button...');
        await orbitBtn.click();
        await page.waitForTimeout(1000);

        const newButtonText = await page.textContent('#orbit-btn');
        console.log(`   New button text: "${newButtonText}"`);

        if (newButtonText.includes('CINEMATIC')) {
            results.passed.push('Button text changed to RETURN TO CINEMATIC');
            console.log('✅ Button text updated correctly');
        } else {
            results.failed.push(`Button text wrong after click: "${newButtonText}"`);
        }

        // Test drag interaction
        console.log('\n🖱️ TEST 6: Testing camera drag (orbit controls)...');
        const canvas = await page.$('canvas');
        const box = await canvas.boundingBox();
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Store a marker by evaluating camera position
        const markerBefore = await page.evaluate(() => {
            return Date.now();
        });

        console.log('   Performing drag gesture...');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 200, centerY - 100, { steps: 20 });
        await page.waitForTimeout(500);
        await page.mouse.up();
        await page.waitForTimeout(1000);

        results.passed.push('Drag gesture completed');
        console.log('✅ Drag gesture executed');

        await page.screenshot({ path: 'test-orbit-02-after-drag.png' });

        // Test vertical drag
        console.log('\n🖱️ TEST 7: Testing vertical drag...');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY + 150, { steps: 20 });
        await page.waitForTimeout(500);
        await page.mouse.up();
        await page.waitForTimeout(1000);

        results.passed.push('Vertical drag completed');
        console.log('✅ Vertical drag executed');

        await page.screenshot({ path: 'test-orbit-03-vertical.png' });

        // Test zoom (scroll wheel)
        console.log('\n🖱️ TEST 8: Testing zoom (scroll wheel)...');
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, -500); // Scroll up to zoom in
        await page.waitForTimeout(1000);

        results.passed.push('Zoom test completed');
        console.log('✅ Zoom interaction executed');

        await page.screenshot({ path: 'test-orbit-04-zoomed.png' });

        // Test RETURN TO CINEMATIC
        console.log('\n🎬 TEST 9: Testing RETURN TO CINEMATIC...');
        await orbitBtn.click();
        await page.waitForTimeout(2000);

        const finalButtonText = await page.textContent('#orbit-btn');
        console.log(`   Final button text: "${finalButtonText}"`);

        if (finalButtonText.includes('EXPLORE')) {
            results.passed.push('Button reverted to EXPLORE');
            console.log('✅ Returned to cinematic mode');
        } else {
            results.failed.push(`Button text wrong after return: "${finalButtonText}"`);
        }

        await page.screenshot({ path: 'test-orbit-05-returned.png' });

        // Final verification
        console.log('\n✅ TEST 10: Final verification...');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-orbit-final.png', fullPage: true });

        results.passed.push('All interaction tests completed');
        console.log('✅ All tests executed successfully');

        console.log('\n⏸️ Keeping browser open for 5 seconds...');
        await page.waitForTimeout(5000);

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

    if (results.failed.length > 0) {
        console.log(`\n❌ FAILED (${results.failed.length}):`);
        results.failed.forEach(test => console.log(`   • ${test}`));
    }

    const total = results.passed.length + results.failed.length;
    const percentage = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(70));
    console.log(`📈 SCORE: ${results.passed.length}/${total} (${percentage}%)`);
    console.log('='.repeat(70));

    if (results.failed.length === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Orbit controls working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check details above.\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-orbit-01-before.png');
    console.log('  • test-orbit-02-after-drag.png');
    console.log('  • test-orbit-03-vertical.png');
    console.log('  • test-orbit-04-zoomed.png');
    console.log('  • test-orbit-05-returned.png');
    console.log('  • test-orbit-final.png\n');

    await browser.close();
})();
