const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Log all console messages
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

        // Log all page errors
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // First we simulate a login by setting localStorage manually
        await page.evaluate(() => {
            window.localStorage.setItem('token', 'fake-token-for-test');
            window.localStorage.setItem('user', JSON.stringify({
                id: '123',
                email: 'applicant@test.com',
                role: 'APPLICANT',
                firstName: 'Test',
                lastName: 'Applicant'
            }));
        });

        // Navigate to the dashboard
        await page.goto('http://localhost:3000/#/applicant', { waitUntil: 'networkidle0' });

        // Give it a moment to render and crash
        await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
        console.error('Puppeteer Script Error:', error);
    } finally {
        await browser.close();
    }
})();
