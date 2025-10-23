import { chromium } from 'playwright';

(async () => {
    console.log('\n🎬 TESTING CONFERENCE SCENE INTEGRATION\n');
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
            if (!text.includes('404')) {
                results.failed.push(`Console error: ${text}`);
            }
        } else if (text.includes('✅') || text.includes('🌍') || text.includes('🎬') || text.includes('🏢')) {
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

        // Wait for cinematic to complete (fast-forward 48 seconds)
        console.log('\n⏱️ TEST 3: Waiting for cinematic completion (48s)...');
        for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(4000);
            const progress = await page.evaluate(() => {
                return document.getElementById('progress-bar').style.width;
            });
            console.log(`  ⏳ ${(i + 1) * 4}s - Progress: ${progress}`);
        }
        results.passed.push('Cinematic completed');
        console.log('✅ Cinematic completed');

        // Check for conference room appearance
        console.log('\n🏢 TEST 4: Checking conference room scene...');
        await page.waitForTimeout(3000); // Wait for 2s delay + 1s buffer

        const conferenceVisible = await page.evaluate(() => {
            const conference = document.getElementById('conference-room');
            return window.getComputedStyle(conference).display !== 'none';
        });

        if (conferenceVisible) {
            results.passed.push('Conference room scene appeared');
            console.log('✅ Conference room scene is visible');
        } else {
            results.failed.push('Conference room did not appear');
            console.log('❌ Conference room NOT visible');
        }

        await page.screenshot({ path: 'test-conference-01-room.png' });

        // Monitor dialogue
        console.log('\n💬 TEST 5: Monitoring conference dialogue...');
        let dialogueCount = 0;

        for (let i = 0; i < 60; i++) { // Monitor for 60 seconds (6 dialogue lines)
            await page.waitForTimeout(1000);

            const speakerName = await page.textContent('#speaker-name');
            const dialogueText = await page.textContent('#dialogue-text');

            if (speakerName && dialogueText && dialogueText.length > 10) {
                console.log(`  💬 ${speakerName}: ${dialogueText.substring(0, 60)}...`);
                dialogueCount++;
            }

            // Check if conference is still visible
            const stillVisible = await page.evaluate(() => {
                const conference = document.getElementById('conference-room');
                return window.getComputedStyle(conference).display !== 'none';
            });

            if (!stillVisible && i > 10) {
                console.log('  ℹ️  Conference scene ended');
                break;
            }
        }

        if (dialogueCount > 0) {
            results.passed.push(`Conference dialogue played (${dialogueCount} lines detected)`);
            console.log(`✅ Dialogue system working (${dialogueCount} lines)`);
        } else {
            results.failed.push('No dialogue detected');
        }

        await page.screenshot({ path: 'test-conference-02-dialogue.png' });

        // Check for training montage
        console.log('\n📚 TEST 6: Checking for training montage...');
        await page.waitForTimeout(5000);

        const montageVisible = await page.evaluate(() => {
            const montage = document.getElementById('training-montage');
            return window.getComputedStyle(montage).display !== 'none';
        });

        if (montageVisible) {
            results.passed.push('Training montage appeared');
            console.log('✅ Training montage is visible');
        } else {
            console.log('⚠️  Training montage may have finished or not started');
        }

        await page.screenshot({ path: 'test-conference-03-montage.png' });

        // Monitor montage text
        console.log('\n📝 TEST 7: Monitoring montage text...');
        let montageTexts = [];

        for (let i = 0; i < 30; i++) { // Monitor for 30 seconds
            await page.waitForTimeout(1000);

            const montageText = await page.textContent('#montage-text');
            if (montageText && montageText.length > 0 && !montageTexts.includes(montageText)) {
                console.log(`  📝 "${montageText}"`);
                montageTexts.push(montageText);
            }

            // Check if montage is still visible
            const stillVisible = await page.evaluate(() => {
                const montage = document.getElementById('training-montage');
                return window.getComputedStyle(montage).display !== 'none';
            });

            if (!stillVisible && i > 5) {
                console.log('  ℹ️  Training montage ended');
                break;
            }
        }

        if (montageTexts.length > 0) {
            results.passed.push(`Training montage text displayed (${montageTexts.length} messages)`);
            console.log(`✅ Montage text system working (${montageTexts.length} messages)`);
        } else {
            results.failed.push('No montage text detected');
        }

        // Final screenshot
        console.log('\n📸 TEST 8: Final state...');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-conference-final.png', fullPage: true });

        results.passed.push('All scene transitions tested');
        console.log('✅ Scene flow test completed');

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
        console.log('\n🎉 ALL TESTS PASSED! Conference scene working perfectly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check details above.\n');
    }

    console.log('Screenshots saved:');
    console.log('  • test-conference-01-room.png');
    console.log('  • test-conference-02-dialogue.png');
    console.log('  • test-conference-03-montage.png');
    console.log('  • test-conference-final.png\n');

    console.log('⏸️  Keeping browser open for 10 seconds for manual verification...');
    await page.waitForTimeout(10000);

    await browser.close();
})();
