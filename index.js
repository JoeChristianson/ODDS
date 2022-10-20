const selector = document.querySelector(".book-selector")

const grid = document.querySelector("tbody")
let data;
let liveScoresData
let API_KEY
let lastRefreshed = null;

const fetchOdds = async (testing)=>{
    // testing?alert("testing"):alert("fetching ODDS");
    const date = new Date()
    localStorage.setItem("last refreshed",JSON.stringify(date))
    document.querySelector(".last-refreshed").innerHTML = convertDate(date)
    const oddsAPIRouter = "https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american"
    const resp = await fetch(oddsAPIRouter)
    data = await resp.json()
    console.log(data);
    const liveScoresURL = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard"
    const liveScoresResponse = await fetch(liveScoresURL)
    liveScoresData = await liveScoresResponse.json()
    addLiveScoresToData()
    return data
}

const makeTable = async (bookmaker)=>{
    try{

        if(data.length>0){
            window.localStorage.setItem("oddsData92893",JSON.stringify(data))
        }
        const tableArray = convertDataForTable(data,bookmaker)

        grid.innerHTML = ""
        tableArray.forEach(td=>{
            // console.log(`${td.away} at ${td.home}: 
            // MoneyLine: ${td.moneyline[0].name}:${td.moneyline[0].price} / ${td.moneyline[1].name}:${td.moneyline[1].price}
            // Spreads: ${td.spreads[0].name}:${td.spreads[0].point} / ${td.spreads[1].name}:${td.spreads[1].point}
            // Over/Under: ${td.overUnder[0].name}:${td.overUnder[0].point} / ${td.overUnder[1].name}:${td.overUnder[1].point}
            // `);
            const row = `
            <tr>
            <td>
            ${td.startTime}
            </td>
            <td>
            ${td.away} at
            <br>
            ${td.home}
            </td>
            <td>
            ${td.score}
            </td>
            <td>
            ${td.clock}
            </td>
            <td>
            ${td.period}
            </td>
            <td>
            ${td.moneyline[0].name}: ${td.moneyline[0].price} <br> ${td.moneyline[1].name}: ${td.moneyline[1].price}
            </td>
            <td>
            ${td.spreads[0].name}: ${td.spreads[0].point} <br> ${td.spreads[1].name}: ${td.spreads[1].point}
            </td>
            <td>
            Over/Under: ${td.overUnder[0].point}
            </td>
            </tr>
            `
            grid.innerHTML = grid.innerHTML+row
        })
        document.querySelectorAll("td").forEach(td=>{
            if(td.innerHTML.includes("undefined")){
                td.innerHTML = "no odds"
        }
    })
}catch(err){
    return "invalid API Key"
}
}

launch()
async function launch(){
    await getAPIKey();
    if(localStorage.getItem("oddsData92893")){
        data = JSON.parse(localStorage.getItem("oddsData92893"))
    }else{
        await fetchOdds()
    }
    makeTable("fanduel")
    fetchBookmakers(data)
    fetchBookmakers(data)
}

async function refetch(){
    await fetchOdds()
    makeTable("fanduel")
    fetchBookmakers(data)
}

document.querySelector(".refetch-once-btn").addEventListener("click",refetch)

function convertDataForTable(data,bookmaker){
    const res = data.map(d=>{
        const bookie = d.bookmakers.find(d=>d.key===bookmaker);
        const headToHead = bookie?.markets?.find(m=>m.key==="h2h")?.outcomes;
        const spreads = bookie?.markets?.find(m=>m.key==="spreads")?.outcomes;
        const totals = bookie?.markets?.find(m=>m.key==="totals")?.outcomes;
        return {
            home:d.home_team,
            away:d.away_team,
            score:d.homeScore?`${d.awayScore} - ${d.homeScore}`:"",
            startTime:convertDate(d?.commence_time) || "",
            clock:d?.clock || "",
            period:d?.period || "",
            moneyline: headToHead || "N/A",
            spreads:spreads ||"N/A",
            overUnder:totals || "N/A"
        }
    })

    return res
}

function fetchBookmakers(data){
    const bookmakers = []

    data.forEach(game=>{
        game.bookmakers.forEach(bookmaker=>{
            const {key,title} = bookmaker
            if(bookmakers.filter(b=>b.key===key).length===0){
                bookmakers.push({key,title})
            }
        })
    })

    bookmakers.forEach(book=>{
        const option = document.createElement("option")
        option.value = book.key
        option.textContent = book.title
        selector.appendChild(option)
    })
    selector.value="fanduel"
    return bookmakers
}

selector.addEventListener("change",(e)=>{
    const {value} = e.target
    makeTable(value)
})

function convertDate(dateString){
    if(typeof dateString === "string"){
        date = new Date(dateString)
    }else{
        date = dateString
    }
    const month = date.toLocaleString('default', { month: 'short' })
    const day = date.getDate()
    const hour= date.getHours()%12===0?12:date.getHours()%12
    let minutes = date.getMinutes()
    if (minutes<10){
        minutes = "0"+minutes.toString()
    }
    const merd = date.getHours()<12?"A.M":"P.M."
    const reformatted = `${month} ${day} ${hour}:${minutes} ${merd}`
    return reformatted
}

async function getAPIKey(){
    API_KEY = localStorage.getItem("ODDS_1010_API_KEY")
    if(!API_KEY){
        API_KEY = await prompt("Enter Odds api_key:")
        if(await testAPIKey()){
            console.log("authorized");
            localStorage.setItem("ODDS_1010_API_KEY",API_KEY)
            return true
        }else{
            console.log("Unauthorized");
            alert("Invalid API key")
            await getAPIKey()
            return false
        }
    }
}

async function testAPIKey(){
    const data = await fetchOdds(true)
    console.log(data.message);
    if (data.message==="Unauthorized"){

        return false
    }
    return true
}

function addLiveScoresToData(){
    data.forEach(game=>{
        const {home_team,away_team} = game
        liveScoresData.events.forEach((liveGame,index)=>{
            if(liveGame.name.includes(home_team)||liveGame.name.includes(away_team)){
                // console.log(liveGame);
                game.homeScore = liveGame.competitions[0].competitors.find(c=>c.homeAway==="home").score
                game.awayScore = liveGame.competitions[0].competitors.find(c=>c.homeAway==="away").score
                game.clock = liveGame.status.displayClock
                game.period = liveGame.status.period
            }
        })
        
    
    })
}

// {
//     "id": "401403920",
//     "uid": "s:20~l:23~e:401403920",
//     "date": "2022-10-15T16:00Z",
//     "name": "Auburn Tigers at Ole Miss Rebels",
//     "shortName": "AUB @ MISS",
//     "season": {
//         "year": 2022,
//         "type": 2,
//         "slug": "regular-season"
//     },
//     "week": {
//         "number": 7
//     },
//     "competitions": [
//         {
//             "id": "401403920",
//             "uid": "s:20~l:23~e:401403920~c:401403920",
//             "date": "2022-10-15T16:00Z",
//             "attendance": 0,
//             "type": {
//                 "id": "1",
//                 "abbreviation": "STD"
//             },
//             "timeValid": true,
//             "neutralSite": false,
//             "conferenceCompetition": true,
//             "recent": true,
//             "venue": {
//                 "id": "3974",
//                 "fullName": "Vaught-Hemingway Stadium",
//                 "address": {
//                     "city": "Oxford",
//                     "state": "MS"
//                 },
//                 "capacity": 64038,
//                 "indoor": false
//             },
//             "competitors": [
//                 {
//                     "id": "145",
//                     "uid": "s:20~l:23~t:145",
//                     "type": "team",
//                     "order": 0,
//                     "homeAway": "home",
//                     "team": {
//                         "id": "145",
//                         "uid": "s:20~l:23~t:145",
//                         "location": "Ole Miss",
//                         "name": "Rebels",
//                         "abbreviation": "MISS",
//                         "displayName": "Ole Miss Rebels",
//                         "shortDisplayName": "Rebels",
//                         "color": "001148",
//                         "alternateColor": "00205b",
//                         "isActive": true,
//                         "venue": {
//                             "id": "3974"
//                         },
//                         "links": [
//                             {
//                                 "rel": [
//                                     "clubhouse",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "https://www.espn.com/college-football/team/_/id/145/ole-miss-rebels",
//                                 "text": "Clubhouse",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "clubhouse",
//                                     "mobile",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/_/id/145/ole-miss-rebels",
//                                 "text": "Clubhouse",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "roster",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/roster/_/id/145",
//                                 "text": "Roster",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "stats",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/stats/_/id/145",
//                                 "text": "Statistics",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "schedule",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/schedule/_/id/145",
//                                 "text": "Schedule",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "photos",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/photos/_/id/145",
//                                 "text": "photos",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "scores",
//                                     "sportscenter",
//                                     "app",
//                                     "team"
//                                 ],
//                                 "href": "sportscenter://x-callback-url/showClubhouse?uid=s:20~l:23~t:145&section=scores",
//                                 "text": "Scores",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "awards",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/awards/_/team/145",
//                                 "text": "Awards",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             }
//                         ],
//                         "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/145.png",
//                         "conferenceId": "8"
//                     },
//                     "score": "21",
//                     "linescores": [
//                         {
//                             "value": 14
//                         },
//                         {
//                             "value": 7
//                         }
//                     ],
//                     "statistics": [],
//                     "curatedRank": {
//                         "current": 9
//                     },
//                     "records": [
//                         {
//                             "name": "overall",
//                             "abbreviation": "overall",
//                             "type": "total",
//                             "summary": "6-0"
//                         },
//                         {
//                             "name": "Home",
//                             "abbreviation": "Home",
//                             "type": "homerecord",
//                             "summary": "4-0"
//                         },
//                         {
//                             "name": "Away",
//                             "abbreviation": "Away",
//                             "type": "awayrecord",
//                             "summary": "2-0"
//                         },
//                         {
//                             "name": "vsConf",
//                             "abbreviation": "CONF",
//                             "type": "vsconf",
//                             "summary": "2-0"
//                         }
//                     ]
//                 },
//                 {
//                     "id": "2",
//                     "uid": "s:20~l:23~t:2",
//                     "type": "team",
//                     "order": 1,
//                     "homeAway": "away",
//                     "team": {
//                         "id": "2",
//                         "uid": "s:20~l:23~t:2",
//                         "location": "Auburn",
//                         "name": "Tigers",
//                         "abbreviation": "AUB",
//                         "displayName": "Auburn Tigers",
//                         "shortDisplayName": "Tigers",
//                         "color": "03244d",
//                         "alternateColor": "f1f2f3",
//                         "isActive": true,
//                         "venue": {
//                             "id": "3785"
//                         },
//                         "links": [
//                             {
//                                 "rel": [
//                                     "clubhouse",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "https://www.espn.com/college-football/team/_/id/2/auburn-tigers",
//                                 "text": "Clubhouse",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "clubhouse",
//                                     "mobile",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/_/id/2/auburn-tigers",
//                                 "text": "Clubhouse",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "roster",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/roster/_/id/2",
//                                 "text": "Roster",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "stats",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/stats/_/id/2",
//                                 "text": "Statistics",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "schedule",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/schedule/_/id/2",
//                                 "text": "Schedule",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "photos",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/team/photos/_/id/2",
//                                 "text": "photos",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "scores",
//                                     "sportscenter",
//                                     "app",
//                                     "team"
//                                 ],
//                                 "href": "sportscenter://x-callback-url/showClubhouse?uid=s:20~l:23~t:2&section=scores",
//                                 "text": "Scores",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             },
//                             {
//                                 "rel": [
//                                     "awards",
//                                     "desktop",
//                                     "team"
//                                 ],
//                                 "href": "http://www.espn.com/college-football/awards/_/team/2",
//                                 "text": "Awards",
//                                 "isExternal": false,
//                                 "isPremium": false
//                             }
//                         ],
//                         "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png",
//                         "conferenceId": "8"
//                     },
//                     "score": "14",
//                     "linescores": [
//                         {
//                             "value": 0
//                         },
//                         {
//                             "value": 14
//                         }
//                     ],
//                     "statistics": [],
//                     "curatedRank": {
//                         "current": 99
//                     },
//                     "records": [
//                         {
//                             "name": "overall",
//                             "abbreviation": "overall",
//                             "type": "total",
//                             "summary": "3-3"
//                         },
//                         {
//                             "name": "Home",
//                             "abbreviation": "Home",
//                             "type": "homerecord",
//                             "summary": "3-2"
//                         },
//                         {
//                             "name": "Away",
//                             "abbreviation": "Away",
//                             "type": "awayrecord",
//                             "summary": "0-1"
//                         },
//                         {
//                             "name": "vsConf",
//                             "abbreviation": "CONF",
//                             "type": "vsconf",
//                             "summary": "1-2"
//                         }
//                     ]
//                 }
//             ],
//             "notes": [],
//             "situation": {
//                 "$ref": "http://sports.core.api.espn.pvt/v2/sports/football/leagues/college-football/events/401403920/competitions/401403920/situation?lang=en&region=us",
//                 "lastPlay": {
//                     "id": "-72721248",
//                     "type": {
//                         "id": "61",
//                         "text": "Extra Point Good",
//                         "abbreviation": "XP"
//                     },
//                     "text": "(A. Carlson KICK)",
//                     "scoreValue": 1,
//                     "team": {
//                         "id": "2"
//                     },
//                     "drive": {
//                         "description": "8 plays, 76 yards, 3:49",
//                         "start": {
//                             "yardLine": 76,
//                             "text": "AUB 24"
//                         },
//                         "end": {
//                             "yardLine": 0,
//                             "text": "MISS 0"
//                         },
//                         "timeElapsed": {
//                             "displayValue": "3:49"
//                         },
//                         "result": "TD"
//                     },
//                     "start": {
//                         "yardLine": 3,
//                         "team": {
//                             "id": "2"
//                         }
//                     },
//                     "end": {
//                         "yardLine": 3,
//                         "team": {
//                             "id": "2"
//                         }
//                     },
//                     "statYardage": 0,
//                     "athletesInvolved": [
//                         {
//                             "id": "4429013",
//                             "fullName": "Tank Bigsby",
//                             "displayName": "Tank Bigsby",
//                             "shortName": "T. Bigsby",
//                             "links": [
//                                 {
//                                     "rel": [
//                                         "playercard",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "stats",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/stats/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "splits",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/splits/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "gamelog",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/gamelog/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "news",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/news/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "bio",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/bio/_/id/4429013/tank-bigsby"
//                                 },
//                                 {
//                                     "rel": [
//                                         "overview",
//                                         "desktop",
//                                         "athlete"
//                                     ],
//                                     "href": "http://www.espn.com/college-football/player/_/id/4429013/tank-bigsby"
//                                 }
//                             ],
//                             "headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/4429013.png",
//                             "jersey": "4",
//                             "position": "RB",
//                             "team": {
//                                 "id": "2"
//                             }
//                         }
//                     ]
//                 },
//                 "down": -1,
//                 "yardLine": 3,
//                 "distance": -1,
//                 "isRedZone": true,
//                 "homeTimeouts": 3,
//                 "awayTimeouts": 3
//             },
//             "status": {
//                 "clock": 324,
//                 "displayClock": "5:24",
//                 "period": 2,
//                 "type": {
//                     "id": "2",
//                     "name": "STATUS_IN_PROGRESS",
//                     "state": "in",
//                     "completed": false,
//                     "description": "In Progress",
//                     "detail": "5:24 - 2nd Quarter",
//                     "shortDetail": "5:24 - 2nd"
//                 }
//             },
//             "broadcasts": [
//                 {
//                     "market": "national",
//                     "names": [
//                         "ESPN"
//                     ]
//                 }
//             ],
//             "leaders": [
//                 {
//                     "name": "passingYards",
//                     "displayName": "Passing Leader",
//                     "shortDisplayName": "PASS",
//                     "abbreviation": "PYDS",
//                     "leaders": [
//                         {
//                             "displayValue": "5-8, 102 YDS, 2 TD",
//                             "value": 102,
//                             "athlete": {
//                                 "id": "4689114",
//                                 "fullName": "Jaxson Dart",
//                                 "displayName": "Jaxson Dart",
//                                 "shortName": "J. Dart",
//                                 "links": [
//                                     {
//                                         "rel": [
//                                             "playercard",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "stats",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/stats/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "splits",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/splits/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "gamelog",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/gamelog/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "news",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/news/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "bio",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/bio/_/id/4689114/jaxson-dart"
//                                     },
//                                     {
//                                         "rel": [
//                                             "overview",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4689114/jaxson-dart"
//                                     }
//                                 ],
//                                 "headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/4689114.png",
//                                 "jersey": "2",
//                                 "position": {
//                                     "abbreviation": "QB"
//                                 },
//                                 "team": {
//                                     "id": "145"
//                                 },
//                                 "active": true
//                             },
//                             "team": {
//                                 "id": "145"
//                             }
//                         }
//                     ]
//                 },
//                 {
//                     "name": "rushingYards",
//                     "displayName": "Rushing Leader",
//                     "shortDisplayName": "RUSH",
//                     "abbreviation": "RYDS",
//                     "leaders": [
//                         {
//                             "displayValue": "12 CAR, 67 YDS, 1 TD",
//                             "value": 67,
//                             "athlete": {
//                                 "id": "4429013",
//                                 "fullName": "Tank Bigsby",
//                                 "displayName": "Tank Bigsby",
//                                 "shortName": "T. Bigsby",
//                                 "links": [
//                                     {
//                                         "rel": [
//                                             "playercard",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "stats",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/stats/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "splits",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/splits/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "gamelog",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/gamelog/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "news",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/news/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "bio",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/bio/_/id/4429013/tank-bigsby"
//                                     },
//                                     {
//                                         "rel": [
//                                             "overview",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4429013/tank-bigsby"
//                                     }
//                                 ],
//                                 "headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/4429013.png",
//                                 "jersey": "4",
//                                 "position": {
//                                     "abbreviation": "RB"
//                                 },
//                                 "team": {
//                                     "id": "2"
//                                 },
//                                 "active": true
//                             },
//                             "team": {
//                                 "id": "2"
//                             }
//                         }
//                     ]
//                 },
//                 {
//                     "name": "receivingYards",
//                     "displayName": "Receiving Leader",
//                     "shortDisplayName": "REC",
//                     "abbreviation": "RECYDS",
//                     "leaders": [
//                         {
//                             "displayValue": "1 REC, 46 YDS",
//                             "value": 46,
//                             "athlete": {
//                                 "id": "4431277",
//                                 "fullName": "Koy Moore",
//                                 "displayName": "Koy Moore",
//                                 "shortName": "K. Moore",
//                                 "links": [
//                                     {
//                                         "rel": [
//                                             "playercard",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "stats",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/stats/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "splits",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/splits/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "gamelog",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/gamelog/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "news",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/news/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "bio",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/bio/_/id/4431277/koy-moore"
//                                     },
//                                     {
//                                         "rel": [
//                                             "overview",
//                                             "desktop",
//                                             "athlete"
//                                         ],
//                                         "href": "http://www.espn.com/college-football/player/_/id/4431277/koy-moore"
//                                     }
//                                 ],
//                                 "headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/4431277.png",
//                                 "jersey": "0",
//                                 "position": {
//                                     "abbreviation": "WR"
//                                 },
//                                 "team": {
//                                     "id": "2"
//                                 },
//                                 "active": true
//                             },
//                             "team": {
//                                 "id": "2"
//                             }
//                         }
//                     ]
//                 }
//             ],
//             "groups": {
//                 "id": "8",
//                 "name": "Southeastern Conference",
//                 "shortName": "SEC",
//                 "isConference": true
//             },
//             "format": {
//                 "regulation": {
//                     "periods": 4
//                 }
//             },
//             "startDate": "2022-10-15T16:00Z",
//             "geoBroadcasts": [
//                 {
//                     "type": {
//                         "id": "1",
//                         "shortName": "TV"
//                     },
//                     "market": {
//                         "id": "1",
//                         "type": "National"
//                     },
//                     "media": {
//                         "shortName": "ESPN"
//                     },
//                     "lang": "en",
//                     "region": "us"
//                 }
//             ]
//         }
//     ],
//     "links": [
//         {
//             "language": "en-US",
//             "rel": [
//                 "live",
//                 "desktop",
//                 "event"
//             ],
//             "href": "https://www.espn.com/college-football/game?gameId=401403920",
//             "text": "Gamecast",
//             "shortText": "Gamecast",
//             "isExternal": false,
//             "isPremium": false
//         },
//         {
//             "language": "en-US",
//             "rel": [
//                 "boxscore",
//                 "desktop",
//                 "event"
//             ],
//             "href": "http://www.espn.com/college-football/boxscore/_/gameId/401403920",
//             "text": "Box Score",
//             "shortText": "Box Score",
//             "isExternal": false,
//             "isPremium": false
//         },
//         {
//             "language": "en-US",
//             "rel": [
//                 "highlights",
//                 "desktop"
//             ],
//             "href": "https://www.espn.com/college-football/video?gameId=401403920",
//             "text": "Highlights",
//             "shortText": "Highlights",
//             "isExternal": false,
//             "isPremium": false
//         },
//         {
//             "language": "en-US",
//             "rel": [
//                 "pbp",
//                 "desktop",
//                 "event"
//             ],
//             "href": "http://www.espn.com/college-football/playbyplay/_/gameId/401403920",
//             "text": "Play-by-Play",
//             "shortText": "Play-by-Play",
//             "isExternal": false,
//             "isPremium": false
//         }
//     ],
//     "weather": {
//         "displayValue": "Cloudy",
//         "temperature": 73,
//         "highTemperature": 73,
//         "conditionId": "7",
//         "link": {
//             "language": "en-US",
//             "rel": [
//                 "38677"
//             ],
//             "href": "http://www.accuweather.com/en/us/vaught-hemingway-stadium-ms/38677/current-weather/53600_poi?lang=en-us",
//             "text": "Weather",
//             "shortText": "Weather",
//             "isExternal": true,
//             "isPremium": false
//         }
//     },
//     "status": {
//         "clock": 324,
//         "displayClock": "5:24",
//         "period": 2,
//         "type": {
//             "id": "2",
//             "name": "STATUS_IN_PROGRESS",
//             "state": "in",
//             "completed": false,
//             "description": "In Progress",
//             "detail": "5:24 - 2nd Quarter",
//             "shortDetail": "5:24 - 2nd"
//         }
//     }
// }