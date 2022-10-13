const selector = document.querySelector(".book-selector")

const grid = document.querySelector("tbody")
let data;
// const API_KEY = "f10917e30207df2c2a7d81210200cd11"   
let API_KEY
let lastRefreshed = null;


const fetchOdds = async (testing)=>{
    // testing?alert("testing"):alert("fetching ODDS");
    const date = new Date()
    localStorage.setItem("last refreshed",JSON.stringify(date))
    document.querySelector(".last-refreshed").innerHTML = convertDate(date)
    const resp = await fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`)
    data = await resp.json()
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
    console.log("refetching");
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
            score:d?.score || "",
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