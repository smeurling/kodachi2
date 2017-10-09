
module.exports = (app) => {

    //Login
    //Logout
    //Create account
    //Edit account
    //Forgot account details

    function query(target){
        return new Promise((resolve, reject) => {
            const options = {
                hostname: app.ratsitkey.endpoint,
                port: 443,
                path: '/api/v1/personinformation?SSN='+target,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': app.ratsitkey.auth,
                    'Package': 'personadress'
                }
            }
            const req = https.request(options, (res) => {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);

                var body = [];
                res.on('data', (d) => {
                    body.push(d);
                });
                res.on('end', () => {
                    resolve(Buffer.concat(body).toString());
                });
                res.on('error', (e) => {
                    reject(e);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.end();
        });
    }

    async function validateSsn(ssn){
        return await query(ssn);
    }

    async function createAccount(inst){
    }

    app.taskApi.create_task('account', 'logout',
            ['user'],[],
            app.taskApi.okcancel().concat({unique:true,autocancel:true}),
            async (inst, ctx) => {
                if(inst.response.ok) app.userApi.logout(ctx);
                return 'OK';
            });
    app.taskApi.create_task('account','login',
            ['anonymous'],[],
            app.taskApi.okcancel().concat({field:'email_or_ssn', desc:'login', type:'text'}, {field:'password', desc:'password', type:'password'}).concat({unique:true,autocancel:true}),
            async (inst, ctx) => {
                if(inst.response.ok){
                    var user = app.userApi.findAccount({ssn:inst.response.email_or_ssn}) || app.userApi.findAccount({email:inst.response.email_or_ssn});
                    if(user) {
                        if(app.userApi.tryLogin(ctx, user, inst.response.password)){
                            return 'OK';
                        } else return 'RETRY';
                    } else {
                        return 'OK';
                    }
                }
            });
    app.taskApi.create_task('account', 'register_account', 
            ['anonymous'],[], 
            app.taskApi.okcancel().concat([{field:'ssn', desc:'ssn_field', type:'ssn'}, {field:'has_ssn', desc:'has_ssn_field', default:'checked', type:'checkbox', enables:'ssn'}]).concat({unique:true}), 
            async (inst, ctx) => {

                if(inst.response.cancel) return 'OK';

                if(!inst.response.has_ssn){
                    inst.next_tasks.push('manual_ssn_details');
                    inst.data.nossn = true;
                    return 'OK';
                }

                inst.data.ssnResult = await validateSsn(inst.response.ssn);
                console.dir(inst.data.ssnResult);

                if(inst.data.ssnResult && inst.data.ssnResult.responseCode && inst.data.ssnResult.responseCode == 'Ok') {
                    if(app.userApi.findAccount({ssn:inst.data.ssnResult.ssn}))
                        inst.next_tasks.push('ssn_exists_forgot_details');
                    else
                        inst.next_tasks.push('check_ssn_details');
                } else
                    inst.next_tasks.push('manual_ssn_details');
                return 'OK';
            }, (inst) => {
                if(inst.response.cancel) return 'OK';
                if(!createAccount(ctx, inst)) return 'RETRY';
                return 'OK'; 
            }
    );
    app.taskApi.create_task('account', 'check_ssn_details',
            [],[],
            app.taskApi.yesno(),
            async (inst) => {
                if(inst.response.yes) 
                    inst.next_tasks.push('fill_user_details');
                else
                    inst.next_tasks.push('manual_ssn_details');

                return 'OK';
            });
    app.taskApi.create_task('account','manual_ssn_details',    //e.g. for people whose preferred gender, name, etc, don't match their ssn details, or for people with bad ssn.
            [],[],
            [],
            async (inst) => {
                return 'OK'; 
            });
    app.taskApi.create_task('account','ssn_exists_forgot_details', //info page before forgot_account
            [],[],
            [],
            async (inst) => {
                return 'OK'; 
            });
    app.taskApi.create_task('account','fill_user_details',     //for email, avatar, nickname & password
            [],[],
            [],
            async (inst) => {
                return 'OK'; 
            });
    app.taskApi.create_task('account','forgot_account_details',
            [],[],
            [],
            async (inst) => {
                return 'OK'; 
            });

}
