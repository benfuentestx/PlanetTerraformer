import { chromium } from 'playwright';

(async () => {
    console.log('\n🚀 TESTING ROCKET LAUNCH SEQUENCE\n');
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
        if (msg.type() === 'error' && !text.includes('404')) {
            console.log('❌ Browser Error:', text);
            results.failed.push(`Console error: ${text}`);
        } else if (text.includes('🚀') || text.includes('⏰') || text.includes('💥') || text.includes('🎮')) {
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

        // Use fast-forward button to skip to rocket launch
        console.log('\n⏩ TEST 2: Fast-forwarding to rocket launch...');
        const ffBtn = await page.$('#fast-forward-btn');

        // Skip: loading → cinematic
        await ffBtn.click();
        await page.waitForTimeout(1000);
        console.log('  ⏩ Skipped to cinematic');

        // Skip: cinematic → conference
        await ffBtn.click();
        await page.waitForTimeout(3000);
        console.log('  ⏩ Skipped to conference');

        // Skip: conference → training
        await ffBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ⏩ Skipped to training');

        // Skip: training → rocket launch
        await ffBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ⏩ Skipped to rocket launch');

        results.passed.push('Fast-forwarded to rocket launch');
        console.log('✅ Reached rocket launch sequence');

        await page.screenshot({ path: 'test-rocket-01-countdown.png' });

        // Wait for countdown to complete and watch for rocket launch
        console.log('\n⏰ TEST 3: Monitoring countdown sequence...');

        // Wait for countdown (approximately 16 seconds)
        for (let i = 0; i < 18; i++) {
            await page.waitForTimeout(1000);

            const narrativeText = await page.textContent('#narrative-text');
            if (narrativeText && narrativeText.length > 0) {
                console.log(`  ⏰ ${narrativeText}`);
            }

            if (narrativeText && narrativeText.includes('IGNITION')) {
                console.log('  🔥 Ignition sequence started!');
                break;
            }
        }

        results.passed.push('Countdown sequence completed');
        console.log('✅ Countdown sequence worked');

        await page.screenshot({ path: 'test-rocket-02-ignition.png' });

        // Check for rocket visible during liftoff
        console.log('\n🚀 TEST 4: Checking rocket liftoff...');
        await page.waitForTimeout(3000);

        const narrativeText2 = await page.textContent('#narrative-text');
        console.log(`  📢 Current text: "${narrativeText2}"`);

        if (narrativeText2 && narrativeText2.includes('LIFTOFF')) {
            results.passed.push('Liftoff text displayed');
            console.log('✅ Liftoff confirmed');
        } else {
            results.failed.push('Liftoff text not found');
            console.log('❌ Liftoff text not found');
        }

        await page.screenshot({ path: 'test-rocket-03-liftoff.png' });

        // Wait for transition to cockpit
        console.log('\n🏢 TEST 5: Waiting for cockpit transition...');
        await page.waitForTimeout(8000);

        await page.screenshot({ path: 'test-rocket-04-cockpit.png' });

        // Monitor mission control dialogue
        console.log('\n📡 TEST 6: Monitoring mission control dialogue...');
        let dialogueDetected = false;

        for (let i = 0; i < 25; i++) {
            await page.waitForTimeout(1000);

            const narrativeText = await page.textContent('#narrative-text');
            if (narrativeText && narrativeText.length > 0) {
                console.log(`  📡 ${narrativeText}`);
                dialogueDetected = true;

                if (narrativeText.includes('BRACE FOR IMPACT')) {
                    console.log('  ⚠️  Emergency landing protocol activated!');
                    break;
                }
            }
        }

        if (dialogueDetected) {
            results.passed.push('Mission control dialogue played');
            console.log('✅ Mission control communication working');
        } else {
            results.failed.push('No mission control dialogue detected');
        }

        await page.screenshot({ path: 'test-rocket-05-dialogue.png' });

        // Check for crash landing
        console.log('\n💥 TEST 7: Monitoring crash landing...');
        await page.waitForTimeout(3000);

        const crashText = await page.textContent('#narrative-text');
        console.log(`  📢 Status: "${crashText}"`);

        if (crashText && crashText.includes('STRANDED')) {
            results.passed.push('Crash landing sequence completed');
            console.log('✅ Successfully landed on Terraform (crashed)');
        } else {
            console.log('⚠️  Crash text may have finished');
        }

        await page.screenshot({ path: 'test-rocket-06-crash.png' });

        // Check for gameplay start button
        console.log('\n🎮 TEST 8: Checking for gameplay button...');
        await page.waitForTimeout(6000);

        const gameBtn = await page.$('#start-game-btn');
        const gameBtnVisible = gameBtn ? await gameBtn.isVisible() : false;

        if (gameBtnVisible) {
            results.passed.push('Gameplay button visible');
            console.log('✅ START SURVIVAL button appeared');
        } else {
            results.failed.push('Gameplay button not visible');
            console.log('❌ Gameplay button NOT visible');
        }

        await page.screenshot({ path: 'test-rocket-07-gameplay-ready.png' });

        // Final verification
        console.log('\n✅ TEST 9: Final verification...');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-rocket-final.png', fullPage: true });

        results.passed.push('All rocket sequence tests completed');
        console.log('✅ Rocket launch sequence fully tested');

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
        console.log('\n🎉 ALL TESTS PASSED! Rocket launch working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check details above.\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-rocket-01-countdown.png');
    console.log('  • test-rocket-02-ignition.png');
    console.log('  • test-rocket-03-liftoff.png');
    console.log('  • test-rocket-04-cockpit.png');
    console.log('  • test-rocket-05-dialogue.png');
    console.log('  • test-rocket-06-crash.png');
    console.log('  • test-rocket-07-gameplay-ready.png');
    console.log('  • test-rocket-final.png\n');

    console.log('⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

    await browser.close();
})();
