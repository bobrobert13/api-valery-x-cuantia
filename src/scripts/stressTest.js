import cron from "cron"
import needle from "needle";


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// url to the api to stress test
const url = process.env.PUBLIC_URL

// ammount of users
const users = 2

// time configuration (cron job)
const time = "*/1 * * * * *"

//request body to send
const payload = {
    product: {
        code:"6973304114862",
        sensitiveAudit: false
    }
}

// user to log in as
const loginUser = {
    "user":{
        "email":"admin@admin.com",
        "password": "admin-00"
    }
}
// defining the token variable
let loginToken

let callCount = 0

// function to execute each time
const task = async () => {
    const number = callCount
    console.log("attempting", number+1)
    callCount++
    try{
        const res = await needle('post', url+"/inventory/getProduct", payload, {json:true, headers:{Authorization:loginToken}} )
        console.log("succes on", number+1)
    //    console.log("success", res.body)
    }catch(error){
        console.log("error on", number+1)
    }
}

async function init (){
    needle("post", url+"/auth/login", loginUser, {json:true})
        .then(async (res)=>{
            console.log("succesfull login", res.body.token.code)
            loginToken = res.body.token.code
            for (let i =1; i<=users; i++){
                // await sleep(1000)
                const job = new cron.CronJob(
                    time,
                    task,
                    null,
                    true,
                    undefined,
                    undefined,
                    false
                )
                job.start()
            }
        }).catch((error)=>{
            console.log("could not login", error)
        })
}

init()