const db = require('./../database/db');
const t = require('./../constants').TABLES;
const FREE_PACKAGE_ID = require('./../constants').FREE_PACKAGE_ID;
const sms = require('./../lib/sms');
const mail = require('./../lib/mailer');
const COMPANY_LOGO_BASE_URL = require('./../constants').COMPANY_LOGO_BASE_URL;


const _calculateMonths = d => {
    let months = 0, years = 0, days = 0, weeks = 0;
    while(d){
        if(d >= 365){
            years++;
            d -= 365;
        }else if(d >= 30){
            months++;
            d -= 30;
        }else if(d >= 7){
            weeks++;
            d -= 7;
        }else{
            days++;
            d--;
        }
    };

    return months == 12 ? "1 year" : `${months} months`;
};

/**
 * Notifier is responsible for sending 
 * any kind of notifications to the 
 * PharmaHopers members via sms or mail
 */
const notifier = async () => {
    let connection
    const help = '+91 904-144-6655'
    const smsPackageTemplateId = '1260'
    const smsCycleTemplateId = '1259'

    const mailCycleExpiryTemplateId = '24'
    const mailPackageExpiryTemplateId = '25'

    try {
        connection = await db.getConnectionAsync()

        const companies = await db.queryAsync(`SELECT 
            c.title, 
            c.slug,
            (select name from rs0d_states where id = c.state_id) as state,
            (select name from rs0d_cities where id = c.city_id) as city,
            (select name from rs0d_packages_new where id = cp.package_id) as package_name,
            c.postcode,
            c.address,
            c.contact_person,
            c.phone_number, 
            c.sms_number, 
            c.email, 
            c.website,
            c.logo_url,
            cp.credits, 
            cp.cycle_credits, 
            DATEDIFF(cp.ending_on, NOW()) AS package_remaining_days, 
            DATE_FORMAT(cp.ending_on, '%e %b %Y') AS ending_on, 
            DATEDIFF((cp.cycle_end - INTERVAL 1 DAY), NOW()) AS cycle_remaining_days, 
            DATE_FORMAT((cp.cycle_end - INTERVAL 1 DAY), '%e %b %Y') AS cycle_end
            FROM ${t.COMPANY_PACKAGE} AS cp
            JOIN ${t.COMPANY} AS c
                ON cp.listing_id = c.id
            WHERE cp.package_id != ${FREE_PACKAGE_ID}`);

        //pass exact 6 package ids
        const packages = await db.queryAsync(`SELECT * from ${t.PACKAGE} WHERE id IN(1,2,3,4,6,7) order by FIELD(id,  7,1,2,3,4,6)`);

        for(let i=0; i< companies.length; i++){
            let company = companies[i];
            if (company.package_remaining_days == 7
                || company.package_remaining_days == 3
                || company.package_remaining_days == 1
            ) {

                let mailTemplate = await _getTemplateFromDB(mailPackageExpiryTemplateId);
                let { subject, message } = mailTemplate
                message = message
                    .replace(/{{listing_logo_url}}/g, `${COMPANY_LOGO_BASE_URL}/${company.logo_url}`)
                    .replace(/{{listing_slug}}/g, company.slug)
                    .replace(/{{listing_url}}/g, company.website)
                    .replace(/{{listing_name}}/g, company.title)
                    .replace(/{{listing_address}}/g, company.address)
                    .replace(/{{listing_city}}/g, company.city)
                    .replace(/{{listing_state}}/g, company.state)
                    .replace(/{{listing_pincode}}/g, company.postcode)
                    .replace(/{{listing_contact}}/g, company.phone_number)
                    .replace(/{{listing_user_name}}/g, company.contact_person)
                    .replace(/{{listing_package_name}}/g, company.package_name)
                    .replace(/{{listing_expiry}}/g, company.ending_on)

                    .replace(/{{membership_package_first_name}}/g, packages[0].name)
                    .replace(/{{membership_package_first_description}}/g, packages[0].description)
                    .replace(/{{membership_package_first_price}}/g, packages[0].price)
                    .replace(/{{membership_package_first_duration}}/g, _calculateMonths(packages[0].duration))
                    .replace(/{{membership_package_first_weekly_credit}}/g, packages[0].cycle_credit)

                    .replace(/{{membership_package_second_name}}/g, packages[1].name)
                    .replace(/{{membership_package_second_description}}/g, packages[1].description)
                    .replace(/{{membership_package_second_price}}/g, packages[1].price)
                    .replace(/{{membership_package_second_duration}}/g, _calculateMonths(packages[1].duration))
                    .replace(/{{membership_package_second_weekly_credit}}/g, packages[1].cycle_credit)

                    .replace(/{{membership_package_third_name}}/g, packages[2].name)
                    .replace(/{{membership_package_third_description}}/g, packages[2].description)
                    .replace(/{{membership_package_third_price}}/g, packages[2].price)
                    .replace(/{{membership_package_third_duration}}/g, _calculateMonths(packages[2].duration))
                    .replace(/{{membership_package_third_weekly_credit}}/g, packages[2].cycle_credit)

                    .replace(/{{membership_package_fourth_name}}/g, packages[3].name)
                    .replace(/{{membership_package_fourth_description}}/g, packages[3].description)
                    .replace(/{{membership_package_fourth_price}}/g, packages[3].price)
                    .replace(/{{membership_package_fourth_duration}}/g, _calculateMonths(packages[3].duration))
                    .replace(/{{membership_package_fourth_weekly_credit}}/g, packages[3].cycle_credit)

                    .replace(/{{membership_package_fifth_name}}/g, packages[4].name)
                    .replace(/{{membership_package_fifth_description}}/g, packages[4].description)
                    .replace(/{{membership_package_fifth_price}}/g, packages[4].price)
                    .replace(/{{membership_package_fifth_duration}}/g, _calculateMonths(packages[4].duration))
                    .replace(/{{membership_package_fifth_weekly_credit}}/g, packages[4].cycle_credit)

                    .replace(/{{membership_package_sixth_name}}/g, packages[5].name)
                    .replace(/{{membership_package_sixth_description}}/g, packages[5].description)
                    .replace(/{{membership_package_sixth_price}}/g, packages[5].price)
                    .replace(/{{membership_package_sixth_duration}}/g, _calculateMonths(packages[5].duration))
                    .replace(/{{membership_package_sixth_weekly_credit}}/g, packages[5].cycle_credit);


                //send mail
                await mail.send({subject, message}, company.email );

                //send sms
                sms.send(company.sms_number || company.phone_number , smsPackageTemplateId, [company.title, company.ending_on, help])

            }
            else if (company.cycle_remaining_days == 2
                || company.cycle_remaining_days == 1
            ) {
                if(company.cycle_credits){

                    let mailTemplate = await _getTemplateFromDB(mailCycleExpiryTemplateId);
                    let { subject, message } = mailTemplate
                    message = message
                        .replace(/{{listing_logo_url}}/g, `${COMPANY_LOGO_BASE_URL}/${company.logo_url}`)
                        .replace(/{{listing_slug}}/g, company.slug)
                        .replace(/{{listing_url}}/g, company.website)
                        .replace(/{{listing_name}}/g, company.title)
                        .replace(/{{listing_address}}/g, company.address)
                        .replace(/{{listing_city}}/g, company.city)
                        .replace(/{{listing_state}}/g, company.state)
                        .replace(/{{listing_pincode}}/g, company.postcode)
                        .replace(/{{listing_contact}}/g, company.phone_number)
                        .replace(/{{listing_user_name}}/g, company.contact_person)
                        .replace(/{{expiry_date}}/g, company.cycle_end)
                        .replace(/{{credit_balance}}/g, company.cycle_credits)


                    //send email
                    await mail.send({subject, message}, company.email );

                    //send sms
                    sms.send(company.sms_number || company.phone_number , smsCycleTemplateId, [company.title, company.cycle_end, company.cycle_credits])

                }
            }
        }

    } catch (e) {
        console.log(e.message)
    } finally {
        connection.release()
    }
}



const _getTemplateFromDB = async (templateId) => {
    let connection;
    try {
        connection = await db.getConnectionAsync();
        const template = await db.queryAsync(`SELECT subject, message
            FROM ${t.EMAIL_TEMPLATES}
            WHERE id = ${templateId};`);
        if (template.length > 0)
            return template[0]
        else return null
    } catch (e) {
        console.log('error while getting email template: ' + e.message)
        return null
    } finally {
        connection.release()
    }
}



module.exports = notifier
