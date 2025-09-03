const moment = require('moment');
const axios = require('axios');
const { exec } = require('child_process');
const sms = require('./../lib/sms');

// Website URL and PM2 service name
const url = 'https://www.pharmahopers.com';
//const url = 'http://pharmahopers.loc:3001';

// Function to monitor website status
const checkWebsiteStatus = async () => {
    axios.get(url,{ timeout: 30000 })
        
        .then((response) => {
            if (response.status === 200) {
                console.log(`Website is up. Status Code: ${response.status}`);
            } else {

                

                console.log(`Unexpected response. Status Code: ${response.status}`);
                restartPM2Service();
                //send sms
                console.log("Error server down");
                sms.send('8627009670' , 1259, ['Server Down', new Date().toLocaleString(), 0]);
                sms.send('8171957605' , 1259, ['Server Down', new Date().toLocaleString(), 0]); 
            }
        })
        .catch((error) => {
            if ((error.code === 'ETIMEDOUT') || (error.code === 'ECONNABORTED') || error.code === 502 || error.code === 500 || error.code === 503) {
                sms.send('8627009670' , 1259, [`Server ${error.code}`, new Date().toLocaleString(), 0]);
sms.send('8171957605' , 1259, [`Server ${error.code}`, new Date().toLocaleString(), 0]);
                restartPM2Service();
            }else{
                console.error(`Error accessing website: ${error.message}`);
                sms.send('8627009670' , 1259, ['Server Down1', new Date().toLocaleString(), 0]);
                sms.send('8171957605' , 1259, ['Server Down1', new Date().toLocaleString(), 0]);
                restartPM2Service();
            }

        });
}

// Function to restart PM2 service
function restartPM2Service() {
    
    console.log('Restarting PM2 service...');
    exec(`pm2 restart all`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting PM2: ${error.message}`);
            return;
        }
        console.log(`PM2 Restart Output: ${stdout}`);
        if (stderr) {
            console.error(`PM2 Restart Error: ${stderr}`);
        }
    });
    
}
module.exports = checkWebsiteStatus;
