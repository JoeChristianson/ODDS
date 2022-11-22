const selector = document.querySelector(".book-selector")
const refreshCountdownElement = document.querySelector("#seconds-to-refresh")

const grid = document.querySelector("tbody")
let data;
let liveScoresData
let API_KEY
let defaultBookmaker = window.localStorage.getItem("bookie") || "fanduel"

let lastRefreshed = null;

const ncaaf = { espn: "college-football", oddsAPI: "americanfootball_ncaaf" }
const nfl = { espn: "nfl", oddsAPI: "americanfootball_nfl" }
const sports = {
    ncaaf, nfl
}
let sport = nfl

const leagueString = window.localStorage.getItem("league")

if(leagueString){
    sport = sports[leagueString]
}

document.querySelector(".league-selector").value = leagueString

let timeElapsed = 0
let intervalFunction;
let refetchTimer = 3600
let refreshCountdown = refetchTimer;

const fetchOdds = async (testing) => {
    try {
        const date = new Date()
        localStorage.setItem("last refreshed", JSON.stringify(date))
        document.querySelector(".last-refreshed").innerHTML = convertDate(date)
        const oddsAPIRouter = `https://api.the-odds-api.com/v4/sports/${sport.oddsAPI}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
        const resp = await fetch(oddsAPIRouter)
        const newData = await resp.json()
        if (Array.isArray(newData)||!newData?.message === "Unauthorized") {
            data = newData
        }
        const liveScoresURL = `https://site.api.espn.com/apis/site/v2/sports/football/${sport.espn}/scoreboard`
        const liveScoresResponse = await fetch(liveScoresURL)
        liveScoresData = await liveScoresResponse.json()
        console.log(liveScoresData);
        addLiveScoresToData()
        return data
    } catch (err) {
        alertError(err)
    }
}



// refetch()

const makeTable = async (bookmaker) => {
    try {

        if (data.length > 0) {
            window.localStorage.setItem("oddsData92893", JSON.stringify(data))
        }
        const tableArray = convertDataForTable(data, bookmaker)

        grid.innerHTML = ""
        tableArray.forEach(td => {
            const row = `
            <tr>
            <td>
            ${td.startTime}
            <br>
            ${td.broadcast}
            </td>
            <td class="teams-and-logos">
            <div>
            ${td.awayLogo ? `<img src="${td.awayLogo}">` : ""}
            ${td.away} at
            <br>
            ${td.awayLogo ? `<img src="${td.homeLogo}">` : ""}
            ${td.home}
            </div>
            </td>
            <td>
            ${td.period}
            </td>
            <td>
            ${td.clock}
            </td>
            <td>
            ${td.situation}
            </td>
            <td>
            ${td.score}
            </td>
            <td>
            ${td.totalPoints}
            </td>
            <td>
            ${td.spreads[0].name}: ${td.spreads[0].point} <br> ${td.spreads[1].name}: ${td.spreads[1].point}
            </td>
            <td>
            ${td.moneyline[0].name}: ${td.moneyline[0].price} <br> ${td.moneyline[1].name}: ${td.moneyline[1].price}
            </td>
            <td>
            Over/Under: ${td.overUnder[0].point}
            </td>

            </tr>
            `
            grid.innerHTML = grid.innerHTML + row
        })
        document.querySelectorAll("td").forEach(td => {
            if (td.innerHTML.includes("undefined") && !td.innerHTML.includes("img")) {
                td.innerHTML = "no odds"
            }
        })
    } catch (err) {
        return "invalid API Key"
    }
}

launch()
async function launch() {
    await getAPIKey();
    if (localStorage.getItem("oddsData92893")) {
        data = JSON.parse(localStorage.getItem("oddsData92893"))
    } else {
        await fetchOdds()
    }
    await refetch()
    makeTable(defaultBookmaker)
    fetchBookmakers(data)
    fetchBookmakers(data)
}

async function refetch() {
    refreshCountdown = refetchTimer + 1
    refreshCountdownElement.innerHTML = convertSeconds(refreshCountdown)
    const newIntervalFunction = () => {
        refreshCountdown--
        refreshCountdownElement.innerHTML = convertSeconds(refreshCountdown)
        if (refreshCountdown === 0) {
            refetch()
            setTimeout(() => intervalFunction(), 1000)
        } else if (refreshCountdown > 0) {
            setTimeout(() => intervalFunction(), 1000)
        }
    }
    if(!intervalFunction){
        newIntervalFunction()
    }
    intervalFunction = newIntervalFunction
    await fetchOdds()
    makeTable(defaultBookmaker)
    fetchBookmakers(data)
}

document.querySelector(".refetch-once-btn").addEventListener("click", refetch)
document.querySelector(".league-selector").addEventListener("change", (e) => {
    sport = sports[e.target.value]
    refetch()
    window.localStorage.setItem("league",e.target.value)
})

function convertDataForTable(data, bookmaker) {
    const res = data.map(d => {
        const bookie = d.bookmakers.find(d => d.key === bookmaker);
        const headToHead = bookie?.markets?.find(m => m.key === "h2h")?.outcomes;
        const spreads = bookie?.markets?.find(m => m.key === "spreads")?.outcomes;
        const totals = bookie?.markets?.find(m => m.key === "totals")?.outcomes;
        return {
            broadcast:d.broadcast||"",
            home: d.home_team,
            homeLogo: d.homeLogo,
            away: d.away_team,
            awayLogo: d.awayLogo,
            score: d.homeScore ? `${d.awayScore} - ${d.homeScore}` : "",
            startTime: convertDate(d?.commence_time) || "",
            clock: d?.clock || "",
            period: d?.period || "",
            moneyline: headToHead || "N/A",
            situation: d.situation || "",
            spreads: spreads || "N/A",
            overUnder: totals || "N/A",
            totalPoints: parseInt(d.homeScore) ? parseInt(d.homeScore) + parseInt(d.awayScore) : ""
        }
    })

    return res
}

function fetchBookmakers(data) {
    const bookmakers = []

    data.forEach(game => {
        game.bookmakers.forEach(bookmaker => {
            const { key, title } = bookmaker
            if (bookmakers.filter(b => b.key === key).length === 0) {
                bookmakers.push({ key, title })
            }
        })
    })

    bookmakers.forEach(book => {
        const option = document.createElement("option")
        option.value = book.key
        option.textContent = book.title
        selector.appendChild(option)
    })
    selector.value = defaultBookmaker
    return bookmakers
}

selector.addEventListener("change", (e) => {
    const { value } = e.target
    defaultBookmaker = value
    window.localStorage.setItem("bookie", value)
    makeTable(value)
})

function convertDate(dateString) {
    if (typeof dateString === "string") {
        date = new Date(dateString)
    } else {
        date = dateString
    }
    const month = date.toLocaleString('default', { month: 'short' })
    const day = date.getDate()
    const hour = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12
    let minutes = date.getMinutes()
    if (minutes < 10) {
        minutes = "0" + minutes.toString()
    }
    const merd = date.getHours() < 12 ? "A.M" : "P.M."
    const reformatted = `${month} ${day} ${hour}:${minutes} ${merd}`
    return reformatted
}

async function getAPIKey() {
    API_KEY = localStorage.getItem("ODDS_1010_API_KEY")
    if (!API_KEY) {
        API_KEY = await prompt("Enter Odds api_key:")
        if (await testAPIKey()) {
            console.log("authorized");
            localStorage.setItem("ODDS_1010_API_KEY", API_KEY)
            return true
        } else {
            console.log("Unauthorized");
            alert("Invalid API key")
            await getAPIKey()
            return false
        }
    }
}

async function testAPIKey() {
    const data = await fetchOdds(true)
    console.log(data);
    if (data?.message === "Unauthorized") {

        return false
    }
    return true
}

function addLiveScoresToData() {
    data.forEach(game => {
        const { home_team, away_team } = game
        liveScoresData.events.forEach((liveGame, index) => {
            if (liveGame.name.includes(home_team) && liveGame.name.includes(away_team)) {
                console.log(liveGame.name)
                // console.log(game,liveGame);
                const homeTeam = liveGame.competitions[0].competitors.find(c => c.homeAway === "home")
                const awayTeam = liveGame.competitions[0].competitors.find(c => c.homeAway === "away")
                console.log(liveGame.awayTeam);
                game.homeScore = homeTeam.score
                game.awayScore = awayTeam.score
                game.clock = liveGame.status.displayClock
                game.period = liveGame.status.period
                game.situation = liveGame.competitions[0]?.situation?.downDistanceText
                game.homeLogo = homeTeam.team.logo
                game.awayLogo = awayTeam.team.logo
                game.broadcast = liveGame.competitions[0]?.broadcasts?.[0]?.names?.[0]
            }
        })
        if (game.period < 5) {
            console.log(game);
        }
    })
}

function alertError(error){
    alert(error.message)
}

document.querySelector("#timer-selector").addEventListener("change",timerSelector)

function timerSelector(e){
    const value = parseInt(e.target.value)
    refetchTimer = value;
    refreshCountdown = value;
}

function convertSeconds(time){
    const minutes = Math.floor(time/60)
    const seconds = time%60
    return `${minutes}:${seconds<10?"0"+seconds:seconds}`
}

document.querySelector("#reset-key-btn").addEventListener("click",()=>{
    window.localStorage.removeItem("ODDS_1010_API_KEY")
    launch()
})