const path = require('path');
const fs = require('fs');
const Papa = require("papaparse");
const axios = require('axios');
const { api_url } = require('./config.js')
const updateEmailList = function (storeData) {
    if (storeData.email_list_id.length < 10) return;
    fs.readdir(storeData.csv_directory_path, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        let promises = [];
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            if (isCSV(file)) {
                const filepath = storeData.csv_directory_path + "/" + file;

                const promise = new Promise(function (resolve, reject) {
                    fs.readFile(filepath, 'utf-8', (err, data) => {
                        
                        if (err) {

                            resolve([])
                        } else {
                            Papa.parse(data, {
                                complete: function (results, file) {

                                    let emails = []
                                    for (let i = 0; i < results.data.length; i++) {
                                        const item = results.data[i]
                                        if (!verifyEmail(item[0])) continue;
                                        if (item.length === 2 || item.length === 3) {
                                            emails.push({
                                                email: item[0],
                                                title: item[1],
                                                name: item[2]
                                            })
                                        }
                                    }
                                    resolve(emails)
                                },
                                delimiter: ",",
                                error: function (err, file, inputElem, reason) {
                                    resolve([])
                                },
                            })
                        }
                    })

                });
                promises.push(promise)
            }
        });
        let total_emails = [];
        Promise.all(promises).then(function (emaillist) {
            emaillist.forEach(email_array => {
                if (email_array.length > 0) {
                    email_array.forEach(an_email => {
                        const existed_arr = total_emails.filter((item) => item.email === an_email.email)
                        if (existed_arr.length === 0) {
                            total_emails.push(an_email)
                        }
                    })
                }
            });
            addMultipleEmails(total_emails, storeData.email_list_id)
        });

    });
}

const addMultipleEmails = function (emails, email_list_id) {

    const url = api_url + `/app/add_multi_email`;
    const data = {
        id: email_list_id,
        multipleEmails: emails
    };

    axios({
        url,
        method: "post",
        data
    })
        .then(function (response) {
            if (response.data.success) {
                console.info("==> email list update success")
            } else {
                console.info("==> email list update failed", response.data.error)
            }

        })
        .catch(function (errors) {
            console.info(errors);
        });

}
const isCSV = function (str) {
    if (str.length < 4) {
        return false
    } else {
        var last = str.substring(str.length - 4, str.length);
        if (last === '.csv') {
            return true
        } else {
            return false
        }
    }
}
const verifyEmail = value => {
    var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailRex.test(value)) {
        return true;
    }
    return false;
};

module.exports = {
    updateEmailList
}