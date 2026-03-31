const {google} = require("googleapis");
require("dotenv").config();
const requiredEnv = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "GOOGLE_REFRESH_TOKEN",
    "CALENDAR_ID",
];

function createAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    )
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return oauth2Client;
}

function normalizeEventsStart(event){
    const raw = event.start?.dateTime || event.start?.date;

    if(!raw) return null;

    const date = new Date(raw);

    if( Number.isNaN(date.getTime()) ) return null;

    return {
        date,
        timestamp: date.getTime(),
        iso: date.toISOString(),
        isAllDay: Boolean(!event.start?.dateTime || event.start?.date),
    };
}

function alarm(event){
    console.log(`Alarm: ${event.summary}, ${event.start?.dateTime || event.start?.date}`);
}

async function chackEvents(calendar){

    const response = await calendar.events.list(
        {
            calendarId: process.env.CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
        }
    )
    const events = response.data.items || [];

    console.log("events in checkEvents:", events.length);


    const now = Date.now();
    const interval = 60_000;
    for(const event of events){
        const normalized = normalizeEventsStart(event);

        if(normalized && now < normalized.timestamp && normalized.timestamp < now + interval){
            alarm(event);
            return;
        }
    }
}


async function main() {
    console.log("Calendar alarm app started");
    const missing = requiredEnv.filter((name) => !process.env[name]);
    if(missing.length > 0) {
        throw new Error("Missing env variables: " + missing.join(", "));
    }
    console.log("Config loaded successfully")

    const auth = createAuthClient();
    console.log('auth client created successfully');


    const calendar = google.calendar({version: "v3", auth});

    const response = await calendar.events.list(
        {
            calendarId: process.env.CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
        }
    )
    const events = response.data.items || [];
    if (events.length === 0) {
        console.log("No events found.");
    }else{
        for(const event of events) {
            const start = event.start?.dateTime || event.start?.date || "No start time";
            console.log(`Start: ${start} Summary: ${event.summary || "No summary"}`);
        }
    }

    for(const event of events) {
        const normalizedEvent = normalizeEventsStart(event);
        if(!normalizedEvent){
            console.log("Skip event without valid start: ", event.summary || "No summary");
            continue;
        }
        console.log(normalizedEvent.iso, event.summary || "No summary");
    }
    await chackEvents(calendar);
}

main().catch((error) => {
    console.error("Fatal error:", error.message);
    process.exit(1);
});




