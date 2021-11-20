//node wev_download.js --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" --dest="document.html"

let minimist = require("minimist");
let axios = require("axios");
let fs = require("fs");
const { fstat } = require("fs");

let arg = minimist(process.argv);

let pro = axios.get(arg.url);
pro.then(function(response)
{
    let data = response.data;
    fs.writeFileSync(arg.dest,data,"utf-8");
}).catch(function(err)
{
    console.log(err);
})