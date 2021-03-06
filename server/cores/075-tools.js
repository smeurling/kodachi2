
import asyncBusboy from "async-busboy";
import mail from "nodemailer";
const fs = require("fs");

module.exports = (app) => {
    const api = {};

    api.form = async (ctx) => {
        const data = await asyncBusboy(ctx.req);

        for (let i = 0; i < data.files.length; ++i) {
            data.fields[data.files[i].fieldname] = data.files[i];
        }
        return data.fields;
    };

    api.upload = async (file) => {

        const suffix = `.${file.file.split(/\./).slice(-1)[0]}`;
        const base = app.uuid() + suffix;

        const read = fs.createReadStream(file.file);

        const upload = new app.s3.upload({
            "Bucket": "kodachi-uploads",
            "Key": base,
            "ACL": "public-read",
            "StorageClass": "REDUCED_REDUNDANCY",
            "ContentType": "binary/octet-stream"
        });
        read.pipe(upload);
        return `//kodachi-uploads.s3-eu-west-1.amazonaws.com/${base}`;
    };

    api.email = async (to, subject, text, html, immediate) => {

        const opts = {
            from: "\"Kodachi\" <no-reply@kodachi.se>",
            to,
            subject,
            text,
            html
        };

        setTimeout(() => {
            console.log("Sending email "+subject+" now!");
            app.emailTransport.sendMail(opts, (error, info) => {
                if (error) {
                    console.dir(error);
                } else {
                    console.log("message %s sent: %s!", info.messageId, info.response);
                }
            });
        }, immediate ? Math.random() * 5000 + 5000 : Math.random() * 60000 * 9 + 60000);
    };

    app.utils = api;
};
