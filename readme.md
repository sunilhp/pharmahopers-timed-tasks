# Steps to run

- Create .env file, Sample File below.
    ```
        NODE_ENV=dev
    ```
- Add File under `config/` according to the environment. If environment is `production` then add `production.json` file else `development.json` file is required. Sample File below.
    ```
    {
        "DB": {
            "connectionLimit": number,
            "host": "db host",
            "user": "db user",
            "password": "db password",
            "database": "database name",
            "port": port number
        }
    }
    ```
- Add `constants.js` file to define the constants and other required keys. Sample file below.
    ```
    module.exports = {
        FREE_PACKAGE_ID: 00,
        FREE_COMPANY_BASE_RANK: 00,
        TABLES: {
            COMPANY: 'rs0d_listings',
            COMPANY_PACKAGE: 'rs0d_listing_package',
            COMPANY_LEADS: 'rs0d_listing_leads',
            DAILY_HITS: 'rs0d_daily_hits',
            PACKAGE: 'rs0d_packages_new',
            COMPANY_PACKAGE_HISTORY: 'rs0d_listing_package_history',
            BANNERS: 'rs0d_banners',
            EMAIL_TEMPLATES: 'rs0d_email_templates'
        },
        MAILGUN_API_KEY: 'xxxxxx',
        MAILGUN_DOMAIN: 'xxxx',
        DEV_TEST_EMAIL: ['xxxx'],
        HELPLINE: '8627009670',
        COMPANY_LOGO_BASE_URL: 'https://www.pharmahopers.com/assets/images/logo',
        SMS_API_URL: `xxxx`,
    };
    ```
- Node version `16` is required to run the application.
- Do npm install using `npm i`
- Run the app according to environment(dev: `npm run dev`, prod: `npm run start`)

**Happy Coding!**
