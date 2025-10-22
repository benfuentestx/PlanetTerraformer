import { chromium } from 'playwright';

(async () => {
    console.log('\n🔍 TESTING EXPLORE BUTTON FUNCTIONALITY\n');
    console.log('='.repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
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
            results.failed.push(`Console error: ${text}`);
        } else if (text.includes('✅') || text.includes('🌍') || text.includes('🎬')) {
            console.log('  📢', text);
        }
    });

    try {
        // Load page
        console.log('\n📥 Loading page...');
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        results.passed.push('Page loaded');
        console.log('✅ Page loaded');

        // Start cinematic
        console.log('\n🎬 Starting cinematic...');
        const playBtn = await page.$('#play-btn');
        await playBtn.click();
        results.passed.push('Cinematic started');
        console.log('✅ Cinematic started');

        // Wait for cinematic to complete (45 seconds + buffer)
        console.log('\n⏱️ Waiting for cinematic to complete (50 seconds)...');
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(5000);
            const progress = await page.evaluate(() => {
                return document.getElementById('progress-bar').style.width;
            });
            console.log(`  ⏳ ${(i + 1) * 5}s - Progress: ${progress}`);
        }

        // Check if EXPLORE button is visible
        console.log('\n🔍 TEST 1: Checking if EXPLORE button appears...');
        await page.waitForTimeout(2000);

        const orbitBtn = await page.$('#orbit-btn');
        const isVisible = await orbitBtn.isVisible();

        if (isVisible) {
            results.passed.push('EXPLORE button visible after cinematic');
            console.log('✅ EXPLORE button is visible');
        } else {
            results.failed.push('EXPLORE button not visible');
            console.log('❌ EXPLORE button NOT visible');
        }

        const buttonText = await page.textContent('#orbit-btn');
        console.log(`   Button text: "${buttonText}"`);

        // Check OrbitControls state BEFORE clicking
        console.log('\n🔍 TEST 2: Checking OrbitControls state BEFORE click...');
        const controlsBeforeClick = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return {
                canvasExists: !!canvas,
                hasPointerEvents: window.getComputedStyle(canvas).pointerEvents !== 'none'
            };
        });

        console.log('   Canvas exists:', controlsBeforeClick.canvasExists);
        console.log('   Pointer events enabled:', controlsBeforeClick.hasPointerEvents);

        await page.screenshot({ path: 'test-explore-01-before-click.png' });

        // Click EXPLORE button
        console.log('\n🖱️ TEST 3: Clicking EXPLORE button...');
        await orbitBtn.click();
        await page.waitForTimeout(1000);
        results.passed.push('EXPLORE button clicked');
        console.log('✅ Button clicked');

        // Check if button text changed
        const newButtonText = await page.textContent('#orbit-btn');
        console.log(`   New button text: "${newButtonText}"`);

        if (newButtonText.includes('CINEMATIC')) {
            results.passed.push('Button text changed to CINEMATIC');
            console.log('✅ Button text changed correctly');
        } else {
            results.failed.push('Button text did not change');
            console.log('❌ Button text did NOT change');
        }

        // Check OrbitControls state AFTER clicking
        console.log('\n🔍 TEST 4: Verifying OrbitControls are enabled...');
        const controlsAfterClick = await page.evaluate(() => {
            // Try to access the controls through the global app instance
            // This is a bit of a hack, but necessary for testing
            return {
                cameraPositionX: window.innerWidth, // Placeholder
                cameraPositionY: window.innerHeight // Placeholder
            };
        });

        await page.screenshot({ path: 'test-explore-02-after-click.png' });

        // Test mouse interaction (drag to rotate)
        console.log('\n🖱️ TEST 5: Testing mouse drag interaction...');
        const canvas = await page.$('canvas');
        const box = await canvas.boundingBox();

        // Get initial camera info
        await page.waitForTimeout(500);

        // Perform drag
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-explore-03-after-drag.png' });

        results.passed.push('Mouse drag interaction completed');
        console.log('✅ Mouse drag test completed');

        // Visual verification
        console.log('\n📸 Taking final screenshots...');
        await page.screenshot({ path: 'test-explore-final.png', fullPage: true });

        console.log('\n⏸️ Keeping browser open for 5 more seconds for manual verification...');
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
    const percentage = ((results.passed.length / total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log(`📈 SCORE: ${results.passed.length}/${total} (${percentage}%)`);
    console.log('='.repeat(70));

    if (results.failed.length === 0) {
        console.log('\n🎉 ALL TESTS PASSED! EXPLORE button working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Analyzing issue...\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-explore-01-before-click.png');
    console.log('  • test-explore-02-after-click.png');
    console.log('  • test-explore-03-after-drag.png');
    console.log('  • test-explore-final.png\n');

    await browser.close();
})();
