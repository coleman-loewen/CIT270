const express = require('express');
const bodyparser = require("body-parser")
const https = require('https');
const fs = require('fs');
const {v4: uuidv4} = require("uuid") 
const port = 4043;
const app = express();
const {createClient} = require('redis');
const md5 = require('md5');
const redisclient = createClient(
   { url: 'redis://default@34.122.148.133:6379',
   }
   );
app.use(bodyparser.json())

https.createServer({
    key: fs.readFileSync('usr/src/app/SSL/server.key'),
    cert: fs.readFileSync('usr/src/app/SSL/server.cert'),
    ca: fs.readFileSync('usr/src/app/SSL/chain.pem'),    
}, app).listen(port, async () => {
    console.log('listening...')
    try{   
    await redisclient.connect();
        console.log('Listening...')}
        catch(error){
            console.log(error)
        }
});


// app.listen(port, async ()=>{
//     await redisclient.connect();
//     console.log('listening on port '+port);
// });

app.get('/', (req,res)=>{
    res.send('Hello World!')
});

app.post('/user', (req,res)=>{
    const newUserRequestObject = req.body;
    const loginPassword = req.body;
    const hash = md5(loginPassword)
    console.log(hash)
    newUserRequestObject.password=hash
    newUserRequestObject.verifyPassword=hash 
    console.log('New User:' ,JSON.stringify(newUserRequestObject));
    redisclient.hSet('users',req.body.email,JSON.stringify(newUserRequestObject));
    res.send('New user: '+newUserRequestObject.email+' added');
});
app.post("/login", async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = md5(req.body.password);
    console.log("loginPassword", loginPassword);

    const userString=await redisclient.hGet('users',loginEmail);
    const userObject=JSON.parse(userString)
    if(userString=='' || userString==null){
        res.status(404);
        res.send('User not found');
    }
    else if (loginEmail == userObject.userName && loginPassword == userObject.password){
        const token = uuidv4();
        res.send(token);
    } else{
        res.status(401);//unauthorized
        res.send("Invalid user or password");
    }
})
