const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // 1. Navigate to a public job URL
        console.log("Navigating to public job URL...");
        await page.goto('http://localhost:3000/#/jobs/1/acme', { waitUntil: 'networkidle0' });

        // 2. Verify redirect to /login
        const currentUrl = page.url();
        if (currentUrl.includes('/#/login')) {
            console.log("✅ Successfully redirected to login page.");
        } else {
            throw new Error(`Expected redirect to login, but landed on: ${currentUrl}`);
        }

        // 3. Perform login as applicant
        // Since we have mock credentials, we can type them into the form
        console.log("Logging in as mock applicant...");
        await page.type('input[type="email"]', 'alice.j@example.com');
        await page.type('input[type="password"]', '123');
        await page.click('button[type="submit"]');

        // wait for login to complete and navigate
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // 4. Verify landing on /applicant dashboard
        const finalUrl = page.url();
        if (finalUrl.includes('/#/applicant')) {
            console.log("✅ Successfully landed on Applicant Dashboard.");
        } else {
            throw new Error(`Expected redirect to dashboard, but landed on: ${finalUrl}`);
        }

        console.log("Test completed successfully!");

    } catch (error) {
        console.error('Puppeteer Script Error:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
