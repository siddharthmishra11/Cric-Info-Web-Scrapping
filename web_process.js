//node web_process --source="document.html" --dest=team.xlsx --dataDir=WorldCup
let minimist = require("minimist");
let fs = require("fs");
let jsdom = require("jsdom");
const { coerce } = require("debug");
let args = minimist(process.argv);
let excel = require("excel4node");
let path = require("path");
let pdf = require("pdf-lib");

fs.readFile(args.source,"utf-8",function(err,html)
{
   let dom = new jsdom.JSDOM(html);
   let document = dom.window.document;
   let p = document.querySelectorAll("div.match-score-block");
   let matches = [];
   for(let i=0;i<p.length;i++)
   {
        let match = {};
        let name = p[i].querySelectorAll("p.name");
        match.t1 = name[0].textContent;
        match.t2 = name[1].textContent;
        match.res = p[i].querySelector("div.status-text > span").textContent;
        let score = p[i].querySelectorAll("div.score-detail > .score");
        match.score1 = "";
        match.score2 = "";
        if(score.length==2)
        {
         match.score1 = score[0].textContent;
         match.score2 = score[1].textContent;
        }
        else if(score.length==1)
        {
         match.score1 = score[0].textContent;
        }
        matches.push(match);
   }
   let matchJson = JSON.stringify(matches);
   fs.writeFileSync("Matches.json",matchJson,"utf-8");
   let teams = [];
   for(let i=0;i<matches.length;i++)
   {
      findTeam(teams,matches[i]);
   }
   for(let i=0;i<matches.length;i++)
   {
      putTeamAppropriate(teams,matches[i]);
   }
   let teamJson = JSON.stringify(teams);
   fs.writeFileSync("Teams.json",teamJson,"utf-8");
   createExcelSheet(teams);
   preparePdf(teams,args.dataDir);
});
function putTeamAppropriate(teams,match)
{
    putEachTeam(teams,match.t1,match.t2,match.score1,match.score2,match.res);
    putEachTeam(teams,match.t2,match.t1,match.score2,match.score1,match.res);
}
function putEachTeam(teams,homeTeam,oppTeam,selfScore,oppScore,result)
{
   let idx = teamIdx(teams,homeTeam);
   teams[idx].matches.push(
      {
         vs: oppTeam,
         selfScore: selfScore,
         oppScore: oppScore,
         res: result
      }
   );
}
function findTeam(teams,match)
{
    putTeam(teams,match.t1);
    putTeam(teams,match.t2);
}
function putTeam(teams,team)
{ 
   let idx = teamIdx(teams,team); 
   if(idx==-1)
   {
      teams.push({
         name: team,
         matches: []
      });
   }
}
function teamIdx(teams,team)
{
  let tidx = teams.findIndex(function(t)
  {
      if(t.name==team)
      {
        return true;
      }
      else{
         return false;
      }
  })
  
  return tidx;
}
function createExcelSheet(teams)
{
   let wb = new excel.Workbook();
   for(let i=0;i<teams.length;i++)
   {
      let sheet = wb.addWorksheet(teams[i].name);
      sheet.cell(1,1).string("VS");
      sheet.cell(1,2).string("Self Score");
      sheet.cell(1.3).string("Opp Score");
      sheet.cell(1,4).string("Result");
      for(let j=0 ;j < teams[i].matches.length; j++)
      {
         sheet.cell(j+2,1).string(teams[i].matches[j].vs);
         sheet.cell(j+2,2).string(teams[i].matches[j].selfScore);
         sheet.cell(j+2,3).string(teams[i].matches[j].oppScore);
         sheet.cell(j+2,4).string(teams[i].matches[j].res);
      }
   }
   wb.write(args.dest,"utf-8");
}
function preparePdf(teams,dataDir)
{
   if(fs.existsSync(dataDir))
   {
     fs.rmdirSync(dataDir,{recursive: true});
   }
   fs.mkdirSync(dataDir);
   for(let i=0;i<teams.length;i++)
   {
      let folderName = path.join(dataDir,teams[i].name);
      fs.mkdirSync(folderName);
      for(let j=0;j<teams[i].matches.length;j++)
      {
         createPdf(teams[i].name,teams[i].matches[j],folderName);
      }
   }

}
function createPdf(teamName,match,fname)
{
   let matchName = path.join(fname,match.vs+".pdf");
   let tFile = fs.readFileSync("template.pdf");
   let pdfPromise = pdf.PDFDocument.load(tFile);
      pdfPromise.then(function(pdfDoc)
      {
          let page = pdfDoc.getPage(0);
          page.drawText(teamName,{
            x:325,
            y:615,
            size:15
         });
        page.drawText(match.vs,{
         x:325,
         y:590,
         size: 15
        });
        page.drawText(match.selfScore,{
         x:325,
         y:565,
         size:15
         });
         page.drawText(match.oppScore,{
            x:325,
            y:540,
            size:15
            });
            page.drawText(match.res,{
               x:310,
               y:515,
               size:10
          });
          let prmToSave =  pdfDoc.save();
           prmToSave.then(function(finalPdf)
           {
              if(fs.existsSync(matchName))
              {
                 matchName =  path.join(fname,match.vs+"1.pdf");
              }
              fs.writeFileSync(matchName,finalPdf);
           });
      });
   
}