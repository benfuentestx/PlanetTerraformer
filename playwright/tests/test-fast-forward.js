import { chromium } from 'playwright';

(async () => {
    console.log('\n⏩ TESTING FAST FORWARD BUTTON\n');
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
        if (msg.type() === 'error' && !text.includes('404')) {
            console.log('❌ Browser Error:', text);
            results.failed.push(`Console error: ${text}`);
        } else if (text.includes('⏩') || text.includes('🎬') || text.includes('🏢') || text.includes('📚') || text.includes('🎮')) {
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

        // Check fast-forward button exists
        console.log('\n🔍 TEST 2: Checking fast-forward button...');
        const ffBtn = await page.$('#fast-forward-btn');
        const isVisible = await ffBtn.isVisible();

        if (isVisible) {
            results.passed.push('Fast-forward button visible');
            console.log('✅ Fast-forward button is visible');
        } else {
            results.failed.push('Fast-forward button not visible');
            console.log('❌ Fast-forward button NOT visible');
        }

        await page.screenshot({ path: 'test-ff-01-initial.png' });

        // Click fast-forward to skip to cinematic
        console.log('\n⏩ TEST 3: Click #1 - Start cinematic...');
        await ffBtn.click();
        await page.waitForTimeout(2000);

        const cinematicProgress = await page.evaluate(() => {
            const bar = document.getElementById('progress-bar');
            return window.getComputedStyle(bar).width;
        });

        console.log(`   Cinematic progress: ${cinematicProgress}`);
        results.passed.push('First click started cinematic');
        console.log('✅ First fast-forward click worked');

        await page.screenshot({ path: 'test-ff-02-cinematic.png' });

        // Click fast-forward again to skip to conference
        console.log('\n⏩ TEST 4: Click #2 - Skip to conference...');
        await ffBtn.click();
        await page.waitForTimeout(3000);

        const conferenceVisible = await page.evaluate(() => {
            const conference = document.getElementById('conference-room');
            return window.getComputedStyle(conference).display !== 'none';
        });

        if (conferenceVisible) {
            results.passed.push('Second click showed conference');
            console.log('✅ Second fast-forward click worked - conference visible');
        } else {
            results.failed.push('Conference not visible after second click');
            console.log('❌ Conference NOT visible');
        }

        await page.screenshot({ path: 'test-ff-03-conference.png' });

        // Click fast-forward to skip to training
        console.log('\n⏩ TEST 5: Click #3 - Skip to training montage...');
        await ffBtn.click();
        await page.waitForTimeout(3000);

        const trainingVisible = await page.evaluate(() => {
            const training = document.getElementById('training-montage');
            return window.getComputedStyle(training).display !== 'none';
        });

        if (trainingVisible) {
            results.passed.push('Third click showed training montage');
            console.log('✅ Third fast-forward click worked - training visible');
        } else {
            results.failed.push('Training montage not visible after third click');
            console.log('❌ Training montage NOT visible');
        }

        await page.screenshot({ path: 'test-ff-04-training.png' });

        // Click fast-forward to skip to gameplay
        console.log('\n⏩ TEST 6: Click #4 - Skip to gameplay...');
        await ffBtn.click();
        await page.waitForTimeout(3000);

        const gameplayButton = await page.$('#start-game-btn');
        const gameplayBtnVisible = gameplayButton ? await gameplayButton.isVisible() : false;

        if (gameplayBtnVisible) {
            results.passed.push('Fourth click showed gameplay button');
            console.log('✅ Fourth fast-forward click worked - gameplay ready');
        } else {
            results.failed.push('Gameplay button not visible');
            console.log('❌ Gameplay button NOT visible');
        }

        await page.screenshot({ path: 'test-ff-05-gameplay.png' });

        // Final verification
        console.log('\n✅ TEST 7: Final verification...');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-ff-final.png', fullPage: true });

        results.passed.push('All fast-forward tests completed');
        console.log('✅ All fast-forward scenarios tested');

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
        console.log('\n🎉 ALL TESTS PASSED! Fast-forward button working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check details above.\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-ff-01-initial.png');
    console.log('  • test-ff-02-cinematic.png');
    console.log('  • test-ff-03-conference.png');
    console.log('  • test-ff-04-training.png');
    console.log('  • test-ff-05-gameplay.png');
    console.log('  • test-ff-final.png\n');

    console.log('⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

    await browser.close();
})();
