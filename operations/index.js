const db = require('../database/db');
const c = require('./../constants');
const t = c.TABLES;
const mailgun = require('mailgun-js')({ apiKey: c.MAILGUN_API_KEY, domain: c.MAILGUN_DOMAIN });
const mail = require('./../lib/mailer');


/**
*
*Send buy leads(without communication information) 
*to free listing company by email 
*as a promotional mail
*
*/

const buyLeadMailer = async() => {
  let connection;
    try {
        connection = await db.getConnectionAsync();
        
        let companyList = await db.queryAsync(`
        SELECT DISTINCT L.id, L.title, TRIM(L.email)
        FROM ${c.TABLES.COMPANY} L, ${c.TABLES.COMPANY_PACKAGE} lp, ${c.TABLES.COMPANY_LEADS} ll 
        WHERE L.id = lp.listing_id AND lp.package_id = 5 
        AND L.status = 1 AND L.email 
        NOT IN( 'webhopersindia@gmail.com', 'pharmahopers@gmail.com')  
        AND ll.listing_id = L.id`);
        //console.log(companyList);
        
        let mailTemplate = await _getTemplateFromDB(28);
        
        let { subject, message } = mailTemplate;

        // let leadsData = await db.queryAsync(`SELECT * from ${t.}`)

        // message = message
        //             .replace(/{{leads_listing_list}}/g, `${leads_listing_list}`);

        // for(let i=0; i< companyList.length; i++){
        //   let company = companyList[i];
        //   await mailgun.messages().send({ from: 'PharmaHopers <info@pharmahopers.com>', to: company.email, subject, html: message });
        // }
       

      } catch (e) {
      console.log(e.message);
    } finally {
        connection.release();
    }
}

const bulkMailCustomer = async() => {
  let connection;
    try {
        connection = await db.getConnectionAsync();
        
        let companyList = await db.queryAsync(`
        SELECT email from deliverable_emails 
        LIMIT 100400, 100`); // 100400, 100 sent
        //console.log(companyList);
        let mailTemplate = await _getTemplateFromDB(27);
        
        let { subject, message } = mailTemplate;

        for(let i=0; i< companyList.length; i++){
          let company = companyList[i];
          //await mailgun.messages().send({ from: 'PharmaHopers <info@pharmahopers.com>', to: company.email, subject, html: message });
        }

    } catch (e) {
      console.log(e.message);
    } finally {
        connection.release();
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

module.exports = {buyLeadMailer,bulkMailCustomer};